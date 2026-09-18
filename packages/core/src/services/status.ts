import { prisma } from "../db";
import type { ItemStatus, StatusState } from "@prisma/client";

/** Get or init a student's status for one item (never exposes to others). */
export async function getMyStatus(
  itemId: string,
  studentId: string
): Promise<ItemStatus | null> {
  return prisma.itemStatus.findUnique({
    where: { itemId_studentId: { itemId, studentId } },
  });
}

export async function setStatus(
  itemId: string,
  studentId: string,
  state: StatusState,
  conceptId?: string
): Promise<ItemStatus> {
  return prisma.itemStatus.upsert({
    where: { itemId_studentId: { itemId, studentId } },
    update: { state, conceptId: conceptId ?? null },
    create: { itemId, studentId, state, conceptId: conceptId ?? null },
  });
}

/** Mark that a reminder was sent so we don't re-send. */
export async function markReminded(itemId: string, studentId: string): Promise<void> {
  await prisma.itemStatus.upsert({
    where: { itemId_studentId: { itemId, studentId } },
    update: { remindedAt: new Date() },
    create: { itemId, studentId, state: "NONE", remindedAt: new Date() },
  });
}

/**
 * Returns my statuses across all items in a guild.
 * PRIVACY: only returns data for the requesting student.
 */
export async function getMyStatuses(
  guildId: string,
  studentId: string
): Promise<ItemStatus[]> {
  return prisma.itemStatus.findMany({
    where: {
      studentId,
      item: { guildId },
    },
    include: { item: true },
  });
}

export async function getMyStatusMap(itemIds: string[], studentId: string): Promise<Map<string, ItemStatus>> {
  const statuses = await prisma.itemStatus.findMany({
    where: { itemId: { in: itemIds }, studentId },
  });
  return new Map(statuses.map((status) => [status.itemId, status]));
}
