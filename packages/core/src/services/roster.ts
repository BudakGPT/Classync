import { prisma } from "../db.js";
import { RosterRole, type AcademicRoster } from "@prisma/client";

export interface RosterEntryInput {
  npm: string;
  name: string;
  role?: "STUDENT" | "TA";
  className?: string | null;
}

export type VerifyResult =
  | { success: true; entry: AcademicRoster; alreadyVerifiedSameUser?: boolean }
  | { success: false; reason: "NOT_FOUND" | "ALREADY_CLAIMED" | "DISCORD_ALREADY_VERIFIED"; claimedBy?: string };

export async function saveRosterEntries(
  guildId: string,
  entries: RosterEntryInput[]
): Promise<{ added: number; updated: number; total: number }> {
  let added = 0;
  let updated = 0;

  for (const item of entries) {
    const cleanNpm = String(item.npm).trim().replace(/\s+/g, "");
    if (!cleanNpm) continue;
    const cleanName = String(item.name).trim();
    const role = item.role === "TA" ? RosterRole.TA : RosterRole.STUDENT;
    const cleanClass = item.className ? String(item.className).trim() : null;

    const existing = await prisma.academicRoster.findUnique({
      where: { guildId_npm: { guildId, npm: cleanNpm } },
    });

    if (existing) {
      await prisma.academicRoster.update({
        where: { id: existing.id },
        data: {
          name: cleanName,
          role,
          className: cleanClass ?? existing.className,
        },
      });
      updated++;
    } else {
      await prisma.academicRoster.create({
        data: {
          guildId,
          npm: cleanNpm,
          name: cleanName,
          role,
          className: cleanClass,
        },
      });
      added++;
    }
  }

  return { added, updated, total: added + updated };
}

export async function getRosterByGuild(guildId: string): Promise<AcademicRoster[]> {
  return prisma.academicRoster.findMany({
    where: { guildId },
    orderBy: [{ role: "asc" }, { className: "asc" }, { name: "asc" }],
  });
}

export async function getDistinctClasses(guildId: string): Promise<string[]> {
  const records = await prisma.academicRoster.findMany({
    where: { guildId, className: { not: null } },
    select: { className: true },
    distinct: ["className"],
  });
  return records
    .map((r) => r.className?.trim())
    .filter((c): c is string => Boolean(c && c.length > 0))
    .sort();
}

export async function verifyRosterMember(
  discordGuildId: string,
  npm: string,
  discordUserId: string
): Promise<VerifyResult> {
  const guild = await prisma.guild.findUnique({ where: { discordGuildId } });
  if (!guild) return { success: false, reason: "NOT_FOUND" };

  const cleanNpm = npm.trim().replace(/\s+/g, "");
  const entry = await prisma.academicRoster.findUnique({
    where: { guildId_npm: { guildId: guild.id, npm: cleanNpm } },
  });

  if (!entry) return { success: false, reason: "NOT_FOUND" };

  if (entry.discordUserId) {
    if (entry.discordUserId === discordUserId) {
      return { success: true, entry, alreadyVerifiedSameUser: true };
    }
    return { success: false, reason: "ALREADY_CLAIMED", claimedBy: entry.discordUserId };
  }

  const userOther = await prisma.academicRoster.findFirst({
    where: { guildId: guild.id, discordUserId },
  });
  if (userOther && userOther.npm !== cleanNpm) {
    return { success: false, reason: "DISCORD_ALREADY_VERIFIED" };
  }

  const updated = await prisma.academicRoster.update({
    where: { id: entry.id },
    data: { discordUserId, verifiedAt: new Date() },
  });

  if (entry.role === RosterRole.STUDENT) {
    await prisma.student.upsert({
      where: { guildId_discordUserId: { guildId: guild.id, discordUserId } },
      update: { consentedAt: new Date() },
      create: { guildId: guild.id, discordUserId, consentedAt: new Date() },
    });
  } else if (entry.role === RosterRole.TA) {
    if (!guild.taUserIds.includes(discordUserId)) {
      await prisma.guild.update({
        where: { id: guild.id },
        data: { taUserIds: { push: discordUserId } },
      });
    }
  }

  return { success: true, entry: updated };
}

export async function setGuildAuth(
  discordGuildId: string,
  params: { authEnabled?: boolean; authChannelId?: string; verifiedRoleId?: string }
) {
  return prisma.guild.update({
    where: { discordGuildId },
    data: params,
  });
}
