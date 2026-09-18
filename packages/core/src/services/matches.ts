import { prisma } from "../db";
import { z } from "zod";
import type { Match } from "@prisma/client";
import { setStatus } from "./status";

/**
 * Peer matching (docs/personal_handoff/peer-matching-handoff.md §3).
 * PRIVACY: relayed text is never stored. A receiver's identity reaches a provider only
 * through revealIdentity, when the receiver chose it. getActiveMatchForUser is the only
 * function returning both Discord IDs, and it is used by the bot process alone.
 */

const PROVIDER_CAP_PER_7_DAYS = 3;
const idSchema = z.string().min(1).max(64);

export interface ProviderCandidate {
  studentId: string;
  discordUserId: string;
}

/** Consented, opted-in classmates who finished the item, are free, and are under the weekly cap. */
export async function findProviders(
  itemId: string,
  receiverStudentId: string,
  limit = 2
): Promise<ProviderCandidate[]> {
  const item = await prisma.item.findUnique({ where: { id: itemId }, select: { guildId: true } });
  if (!item) return [];
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const done = await prisma.itemStatus.findMany({
    where: {
      itemId,
      state: "DONE",
      studentId: { not: receiverStudentId },
      student: {
        guildId: item.guildId,
        helperOptIn: true,
        consentedAt: { not: null },
        revokedAt: null,
        matchesAsReceiver: { none: { state: "ACTIVE" } },
        matchesAsProvider: { none: { state: "ACTIVE" } },
      },
    },
    select: {
      student: {
        select: {
          id: true,
          discordUserId: true,
          _count: { select: { matchesAsProvider: { where: { acceptedAt: { gte: since } } } } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return done
    .filter((s) => s.student._count.matchesAsProvider < PROVIDER_CAP_PER_7_DAYS)
    .slice(0, limit)
    .map((s) => ({ studentId: s.student.id, discordUserId: s.student.discordUserId }));
}

/** Creates a PENDING match. Returns null if the receiver is already matched (PENDING or ACTIVE in any role). */
export async function createMatch(params: {
  itemId: string;
  conceptId?: string;
  receiverId: string;
  offeredTo: string[];
}): Promise<Match | null> {
  const busy = await prisma.match.count({
    where: {
      OR: [
        { receiverId: params.receiverId, state: { in: ["PENDING", "ACTIVE"] } },
        { providerId: params.receiverId, state: "ACTIVE" },
      ],
    },
  });
  if (busy > 0) return null;
  return prisma.match.create({
    data: {
      itemId: params.itemId,
      conceptId: params.conceptId ?? null,
      receiverId: params.receiverId,
      offeredTo: params.offeredTo,
    },
  });
}

/** Atomic first-Yes-wins. Returns null if someone else won, or the provider is busy or no longer consented. */
export async function acceptMatch(matchId: string, providerStudentId: string): Promise<Match | null> {
  const id = idSchema.parse(matchId);
  const provider = await prisma.student.findUnique({ where: { id: providerStudentId } });
  if (!provider || provider.consentedAt == null || provider.revokedAt != null) return null;

  const busy = await prisma.match.count({
    where: { state: "ACTIVE", OR: [{ receiverId: providerStudentId }, { providerId: providerStudentId }] },
  });
  if (busy > 0) return null;

  const won = await prisma.match.updateMany({
    where: { id, state: "PENDING", offeredTo: { has: providerStudentId } },
    data: { state: "ACTIVE", providerId: providerStudentId, acceptedAt: new Date() },
  });
  if (won.count === 0) return null;
  return prisma.match.findUnique({ where: { id } });
}

/** Removes the student from offeredTo. State stays PENDING; the expiry job handles an empty list. */
export async function declineOffer(matchId: string, providerStudentId: string): Promise<void> {
  const id = idSchema.parse(matchId);
  const match = await prisma.match.findUnique({ where: { id }, select: { state: true, offeredTo: true } });
  if (!match || match.state !== "PENDING") return;
  await prisma.match.update({
    where: { id },
    data: { offeredTo: { set: match.offeredTo.filter((s) => s !== providerStudentId) } },
  });
}

async function findParticipantMatch(matchId: string, byStudentId: string) {
  const id = idSchema.parse(matchId);
  return prisma.match.findFirst({
    where: { id, OR: [{ receiverId: byStudentId }, { providerId: byStudentId }] },
  });
}

/** Either side closes the match; the receiver's ItemStatus becomes DONE. Returns null if not a participant. */
export async function resolveMatch(matchId: string, byStudentId: string): Promise<Match | null> {
  const match = await findParticipantMatch(matchId, byStudentId);
  if (!match || match.state !== "ACTIVE") return null;
  const updated = await prisma.match.update({
    where: { id: match.id },
    data: { state: "RESOLVED", resolvedAt: new Date() },
  });
  await setStatus(match.itemId, match.receiverId, "DONE");
  return updated;
}

/** Sets REPORTED. Returns the guild's TA Discord user IDs so the bot can notify with the match id only. */
export async function reportMatch(matchId: string, byStudentId: string): Promise<string[] | null> {
  const match = await findParticipantMatch(matchId, byStudentId);
  if (!match || (match.state !== "ACTIVE" && match.state !== "PENDING")) return null;
  await prisma.match.update({ where: { id: match.id }, data: { state: "REPORTED" } });
  const item = await prisma.item.findUnique({
    where: { id: match.itemId },
    select: { guild: { select: { taUserIds: true } } },
  });
  return item?.guild.taUserIds ?? [];
}

/** Flips the caller's reveal flag. Returns the other side's Discord user ID so the bot can tell them. */
export async function revealIdentity(matchId: string, byStudentId: string): Promise<string | null> {
  const match = await findParticipantMatch(matchId, byStudentId);
  if (!match || match.state !== "ACTIVE" || !match.providerId) return null;
  const isReceiver = match.receiverId === byStudentId;
  await prisma.match.update({
    where: { id: match.id },
    data: isReceiver ? { receiverRevealed: true } : { providerRevealed: true },
  });
  const other = await prisma.student.findUnique({
    where: { id: isReceiver ? match.providerId : match.receiverId },
    select: { discordUserId: true },
  });
  return other?.discordUserId ?? null;
}

export interface ActiveMatchView {
  id: string;
  itemId: string;
  receiver: { studentId: string; discordUserId: string };
  provider: { studentId: string; discordUserId: string };
  receiverRevealed: boolean;
  providerRevealed: boolean;
}

/** The single ACTIVE match where this Discord user is receiver or provider. BOT PROCESS ONLY. */
export async function getActiveMatchForUser(discordUserId: string): Promise<ActiveMatchView | null> {
  const match = await prisma.match.findFirst({
    where: {
      state: "ACTIVE",
      OR: [{ receiver: { discordUserId } }, { provider: { discordUserId } }],
    },
    include: {
      receiver: { select: { id: true, discordUserId: true } },
      provider: { select: { id: true, discordUserId: true } },
    },
    orderBy: { acceptedAt: "desc" },
  });
  if (!match || !match.provider) return null;
  return {
    id: match.id,
    itemId: match.itemId,
    receiver: { studentId: match.receiver.id, discordUserId: match.receiver.discordUserId },
    provider: { studentId: match.provider.id, discordUserId: match.provider.discordUserId },
    receiverRevealed: match.receiverRevealed,
    providerRevealed: match.providerRevealed,
  };
}

/** Resolves which Student row of this Discord user takes part in the match (receiver, provider, or offered). */
export async function getMatchStudentId(matchId: string, discordUserId: string): Promise<string | null> {
  const id = idSchema.parse(matchId);
  const match = await prisma.match.findUnique({
    where: { id },
    select: { receiverId: true, providerId: true, offeredTo: true },
  });
  if (!match) return null;
  const candidates = [match.receiverId, ...match.offeredTo];
  if (match.providerId) candidates.push(match.providerId);
  const student = await prisma.student.findFirst({
    where: { discordUserId, id: { in: candidates } },
    select: { id: true },
  });
  return student?.id ?? null;
}

export interface ExpiredMatch {
  matchId: string;
  itemId: string;
  itemTitle: string;
  receiverDiscordUserId: string;
}

/** Sets EXPIRED on stale PENDING rows. Returns receivers so the bot can send the TA-path fallback DM. */
export async function expirePendingMatches(olderThanMinutes = 30): Promise<ExpiredMatch[]> {
  const cutoff = new Date(Date.now() - olderThanMinutes * 60 * 1000);
  const stale = await prisma.match.findMany({
    where: { state: "PENDING", createdAt: { lt: cutoff } },
    select: {
      id: true,
      itemId: true,
      item: { select: { title: true } },
      receiver: { select: { discordUserId: true } },
    },
  });
  if (stale.length === 0) return [];
  await prisma.match.updateMany({
    where: { id: { in: stale.map((m) => m.id) }, state: "PENDING" },
    data: { state: "EXPIRED" },
  });
  return stale.map((m) => ({
    matchId: m.id,
    itemId: m.itemId,
    itemTitle: m.item.title,
    receiverDiscordUserId: m.receiver.discordUserId,
  }));
}

export async function setHelperOptIn(studentId: string, value: boolean): Promise<void> {
  await prisma.student.update({ where: { id: studentId }, data: { helperOptIn: value } });
}
