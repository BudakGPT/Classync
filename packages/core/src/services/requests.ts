import { prisma } from "../db";
import type { HelpRequest } from "@prisma/client";

export async function createHelpRequest(
  conceptId: string,
  studentId: string
): Promise<HelpRequest> {
  return prisma.helpRequest.upsert({
    where: { conceptId_studentId: { conceptId, studentId } },
    update: { state: "OPEN" },
    create: { conceptId, studentId },
  });
}

/** Returns open requests for a concept, including student discordUserId for TA view. */
export async function getOpenRequestsForConcept(conceptId: string) {
  return prisma.helpRequest.findMany({
    where: { conceptId, state: "OPEN" },
    include: { student: { select: { discordUserId: true } } },
    orderBy: { createdAt: "asc" },
  });
}

/** Total open help-request count across a guild (for overview tile). */
export async function getOpenRequestCount(guildId: string): Promise<number> {
  return prisma.helpRequest.count({
    where: { state: "OPEN", concept: { item: { guildId } } },
  });
}

export async function markRequestsAnswered(conceptId: string): Promise<void> {
  await prisma.helpRequest.updateMany({
    where: { conceptId, state: "OPEN" },
    data: { state: "ANSWERED" },
  });
}
