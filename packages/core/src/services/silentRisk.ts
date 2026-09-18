import { prisma } from "../db";
import type { ItemKind } from "@prisma/client";

/**
 * Early-warning read model for the TA dashboard: students who have gone quiet on a task.
 * "Quiet" = consented, not revoked, and no status other than NONE on the item. This is the
 * student who never taps Stuck, so nothing else in the product represents them.
 *
 * PRIVACY: counts only, never student ids. An item is listed only when its quiet count meets
 * the floor, and the reminded sub-count is nulled below the same floor (CLAUDE.md rule 6).
 */

const PRIVACY_FLOOR = 5;
/** Only tasks due inside this window count as "about to fall behind". */
const HORIZON_MS = 7 * 24 * 60 * 60 * 1_000;

export interface SilentRiskItem {
  item: { id: string; title: string; kind: ItemKind; dueAt: Date };
  /** Consented students with no engagement on this item. Always ≥ 5 when present. */
  quietCount: number;
  /** Quiet students who were already sent a reminder DM. Null below the privacy floor. */
  remindedQuietCount: number | null;
}

export interface SilentRiskSummary {
  consentedCount: number;
  /** Soonest due first. Items below the privacy floor are omitted entirely. */
  items: SilentRiskItem[];
}

export async function getSilentRisk(guildId: string, now = new Date()): Promise<SilentRiskSummary> {
  const [students, items] = await Promise.all([
    prisma.student.findMany({
      where: { guildId, consentedAt: { not: null }, revokedAt: null },
      select: { id: true },
    }),
    prisma.item.findMany({
      where: { guildId, dueAt: { gte: now, lte: new Date(now.getTime() + HORIZON_MS) } },
      orderBy: { dueAt: "asc" },
      select: { id: true, title: true, kind: true, dueAt: true },
    }),
  ]);
  const consentedIds = new Set(students.map((s) => s.id));
  if (consentedIds.size < PRIVACY_FLOOR || items.length === 0) {
    return { consentedCount: consentedIds.size, items: [] };
  }

  const statuses = await prisma.itemStatus.findMany({
    where: { itemId: { in: items.map((i) => i.id) }, studentId: { in: [...consentedIds] } },
    select: { itemId: true, studentId: true, state: true, remindedAt: true },
  });

  const result: SilentRiskItem[] = [];
  for (const item of items) {
    if (item.dueAt === null) continue;
    const rows = statuses.filter((s) => s.itemId === item.id);
    const engaged = new Set(rows.filter((s) => s.state !== "NONE").map((s) => s.studentId));
    const quietCount = consentedIds.size - engaged.size;
    if (quietCount < PRIVACY_FLOOR) continue;

    const remindedQuiet = rows.filter((s) => s.state === "NONE" && s.remindedAt !== null).length;
    result.push({
      item: { id: item.id, title: item.title, kind: item.kind, dueAt: item.dueAt },
      quietCount,
      remindedQuietCount: remindedQuiet >= PRIVACY_FLOOR ? remindedQuiet : null,
    });
  }
  return { consentedCount: consentedIds.size, items: result };
}
