import { prisma } from "../db.js";
import type { Concept } from "@prisma/client";

/** Normalize a label: trim, lowercase, strip punctuation. */
export function normalizeLabel(raw: string): string {
  return raw.trim().toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, " ");
}

/** Get or create a concept for an item+label pair. */
export async function getOrCreateConcept(
  itemId: string,
  rawLabel: string
): Promise<Concept> {
  const label = normalizeLabel(rawLabel);
  return prisma.concept.upsert({
    where: { itemId_label: { itemId, label } },
    update: {},
    create: { itemId, label },
  });
}

export async function getConceptsForItem(itemId: string): Promise<Concept[]> {
  return prisma.concept.findMany({ where: { itemId }, orderBy: { createdAt: "asc" } });
}

export async function getConceptById(id: string): Promise<Concept | null> {
  return prisma.concept.findUnique({ where: { id } });
}

/**
 * Returns stuck reporter count for a concept.
 * Returns null if < 5 (privacy floor).
 */
export async function getStuckCount(conceptId: string): Promise<number | null> {
  const count = await prisma.itemStatus.count({
    where: { conceptId, state: "STUCK" },
  });
  return count >= 5 ? count : null;
}

/**
 * Difficulty list for the TA dashboard: concepts ranked by open help-request count.
 */
export async function getDifficultyList(guildId: string) {
  const concepts = await prisma.concept.findMany({
    where: { item: { guildId } },
    include: {
      item: { select: { id: true, title: true, dueAt: true } },
      helpRequests: { select: { state: true } },
    },
  });

  return concepts
    .map((c) => {
      const open = c.helpRequests.filter((r) => r.state === "OPEN").length;
      const answered = c.helpRequests.filter((r) => r.state === "ANSWERED").length;
      const band =
        open >= 5 ? ("red" as const) : open >= 3 ? ("yellow" as const) : ("green" as const);
      return { concept: c, item: c.item, open, answered, band };
    })
    .sort((a, b) => b.open - a.open);
}

/**
 * Heat map data: for each item, number of stuck reports per day over the last 7 days.
 * Shape: { itemId, itemTitle, days: { date: string; count: number }[] }[]
 */
export async function getHeatMapData(guildId: string) {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const statuses = await prisma.itemStatus.findMany({
    where: { item: { guildId }, state: "STUCK", updatedAt: { gte: since } },
    include: { item: { select: { id: true, title: true } } },
    orderBy: { updatedAt: "asc" },
  });

  const map = new Map<string, { itemTitle: string; counts: Map<string, number> }>();
  for (const s of statuses) {
    const day = s.updatedAt.toISOString().slice(0, 10);
    if (!map.has(s.itemId)) {
      map.set(s.itemId, { itemTitle: s.item.title, counts: new Map() });
    }
    const entry = map.get(s.itemId)!;
    entry.counts.set(day, (entry.counts.get(day) ?? 0) + 1);
  }

  return Array.from(map.entries()).map(([itemId, { itemTitle, counts }]) => ({
    itemId,
    itemTitle,
    days: Array.from(counts.entries()).map(([date, count]) => ({ date, count })),
  }));
}
