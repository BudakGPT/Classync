import { prisma } from "../db";
import type { Item, ItemKind } from "@prisma/client";
import { z } from "zod";

const itemInputSchema = z.object({
  guildId: z.string().min(1),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2_000).optional(),
  dueAt: z.date().optional(),
  kind: z.enum(["ASSIGNMENT", "QUIZ", "EXAM", "READING"]).optional(),
  sourceMessageId: z.string().min(1).optional(),
});

export async function createItem(params: {
  guildId: string;
  title: string;
  description?: string;
  dueAt?: Date;
  kind?: ItemKind;
  sourceMessageId?: string;
}): Promise<Item> {
  return prisma.item.create({ data: itemInputSchema.parse(params) });
}

/** Parses an unambiguous Jakarta-local due value and returns its UTC instant. */
export function parseJakartaDueAt(raw: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?: (\d{2}):(\d{2}))?$/.exec(raw.trim());
  if (!match) return null;
  const [, yearRaw, monthRaw, dayRaw, hourRaw, minuteRaw] = match;
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  const hour = hourRaw === undefined ? 23 : Number(hourRaw);
  const minute = minuteRaw === undefined ? 59 : Number(minuteRaw);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth || hour > 23 || minute > 59) return null;
  return new Date(Date.UTC(year, month - 1, day, hour - 7, minute));
}

export async function getItemsDueWithin(from: Date, until: Date): Promise<Item[]> {
  return prisma.item.findMany({ where: { dueAt: { gte: from, lte: until } } });
}

export async function getItemsByGuild(guildId: string): Promise<Item[]> {
  return prisma.item.findMany({
    // Keep undated items, but do not offer students tasks after their deadline.
    where: {
      guildId,
      OR: [
        { dueAt: null },
        { dueAt: { gte: new Date() } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
}

export async function getItemById(id: string): Promise<Item | null> {
  return prisma.item.findUnique({ where: { id } });
}

export async function updateItem(
  id: string,
  data: Partial<Pick<Item, "title" | "dueAt" | "kind" | "description">>
): Promise<Item> {
  return prisma.item.update({ where: { id }, data });
}

/**
 * Returns done / in_progress / stuck counts for an item.
 * Returns null if fewer than 5 students have any status (privacy floor).
 */
export async function getItemAggregate(itemId: string) {
  const statuses = await prisma.itemStatus.groupBy({
    by: ["state"],
    where: { itemId, state: { not: "NONE" } },
    _count: { state: true },
  });

  const totalReporters = statuses.reduce((sum, s) => sum + s._count.state, 0);
  if (totalReporters < 5) return null;

  const counts = { DONE: 0, IN_PROGRESS: 0, STUCK: 0 } as Record<string, number>;
  for (const s of statuses) {
    counts[s.state] = s._count.state;
  }
  return counts;
}

export async function setItemDiscordCategory(itemId: string, discordCategoryId: string): Promise<Item> {
  return prisma.item.update({
    where: { id: itemId },
    data: { discordCategoryId },
  });
}
