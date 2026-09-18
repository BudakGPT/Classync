import { prisma } from "../db";
import type { Answer } from "@prisma/client";
import { z } from "zod";

/** Create an answer (outbox: deliveredAt = null). Bot deliver job will stamp it. */
export async function createAnswer(params: {
  conceptId: string;
  authorUserId: string;
  body: string;
}): Promise<Answer> {
  const parsed = z.object({
    conceptId: z.string().min(1),
    authorUserId: z.string().min(1),
    body: z.string().trim().min(1).max(4_000),
  }).parse(params);
  return prisma.answer.create({ data: parsed });
}

/** Fetch answers not yet delivered (for the bot deliver job). */
export async function getPendingAnswers(): Promise<Answer[]> {
  return prisma.answer.findMany({ where: { deliveredAt: null } });
}

/** Context needed by the Discord outbox worker; it intentionally has no student data. */
export async function getAnswerDeliveryContext(answerId: string) {
  return prisma.answer.findUnique({
    where: { id: answerId },
    include: {
      concept: {
        include: {
          item: { include: { guild: { select: { announcementChannelId: true, discordGuildId: true } } } },
          topicRoom: true,
        },
      },
    },
  });
}

/** Stamp delivery — idempotent via deliveredAt check. */
export async function stampDelivered(
  answerId: string,
  deliveredCount: number,
  pinnedMessageId?: string,
  threadMessageId?: string
): Promise<void> {
  await prisma.answer.updateMany({
    where: { id: answerId, deliveredAt: null },
    data: { deliveredAt: new Date(), deliveredCount, pinnedMessageId, threadMessageId },
  });
}

/** Get the latest answer for a concept (for the "already answered" bot message). */
export async function getLatestAnswerForConcept(conceptId: string): Promise<Answer | null> {
  return prisma.answer.findFirst({
    where: { conceptId },
    orderBy: { createdAt: "desc" },
  });
}

/** All answers grouped for the knowledge base page. */
export async function getAnswersForGuild(guildId: string) {
  return prisma.answer.findMany({
    where: { concept: { item: { guildId } }, deliveredAt: { not: null } },
    include: {
      concept: {
        select: {
          id: true,
          label: true,
          item: { select: { id: true, title: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/** Total delivered answer count for guild overview tile. */
export async function getDeliveredAnswerCount(guildId: string): Promise<number> {
  return prisma.answer.count({
    where: {
      deliveredAt: { not: null },
      concept: { item: { guildId } },
    },
  });
}
