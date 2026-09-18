import { prisma } from "../db.js";
import type { HelpRequest } from "@prisma/client";

export async function createHelpRequest(
  conceptId: string,
  studentId: string
): Promise<HelpRequest> {
  return prisma.helpRequest.upsert({
    where: { conceptId_studentId: { conceptId, studentId } },
    // Reopening resets the request window used by the outbox delivery worker.
    update: { state: "OPEN", createdAt: new Date() },
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

/** Delivery worker recipients, after an answer has closed their open request. */
export async function getAnsweredRequestsForDelivery(conceptId: string, answerCreatedAt: Date) {
  const previousAnswer = await prisma.answer.findFirst({
    where: { conceptId, deliveredAt: { not: null }, createdAt: { lt: answerCreatedAt } },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  return prisma.helpRequest.findMany({
    where: {
      conceptId,
      state: "ANSWERED",
      createdAt: { gt: previousAnswer?.createdAt, lte: answerCreatedAt },
    },
    include: { student: { select: { discordUserId: true } } },
    orderBy: { createdAt: "asc" },
  });
}

/** TA-only queue. Identity is returned solely for explicit help requests. */
export async function getTaQueue(guildId: string) {
  const concepts = await prisma.concept.findMany({
    where: { item: { guildId } },
    include: {
      item: { select: { id: true, title: true } },
      helpRequests: {
        where: { state: "OPEN" },
        include: { student: { select: { discordUserId: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return concepts
    .filter((concept) => concept.helpRequests.length > 0)
    .map((concept) => ({
      conceptId: concept.id,
      label: concept.label,
      item: concept.item,
      requesters: concept.helpRequests.map((request) => ({
        discordUserId: request.student.discordUserId,
        createdAt: request.createdAt,
      })),
    }))
    .sort((a, b) =>
      b.requesters.length - a.requesters.length ||
      a.requesters[0].createdAt.getTime() - b.requesters[0].createdAt.getTime()
    );
}
