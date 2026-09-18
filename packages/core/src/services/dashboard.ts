import { prisma } from "../db";

/**
 * Read models for the TA web dashboard. Every function here is TA-facing: it may return
 * identities only through HelpRequest rows, and counts only in aggregate form.
 */

const roomSelect = {
  id: true,
  state: true,
  channelId: true,
  _count: { select: { members: true } },
} as const;

/** All items in a guild, newest first, with concept / open-request / room counts. */
export async function getItemsForDashboard(guildId: string) {
  const items = await prisma.item.findMany({
    where: { guildId },
    orderBy: { createdAt: "desc" },
    include: {
      concepts: {
        select: {
          id: true,
          topicRoom: { select: { state: true } },
          _count: { select: { helpRequests: { where: { state: "OPEN" } } } },
        },
      },
    },
  });

  return items.map(({ concepts, ...item }) => ({
    ...item,
    conceptCount: concepts.length,
    openRequestCount: concepts.reduce((sum, c) => sum + c._count.helpRequests, 0),
    openRoomCount: concepts.filter((c) => c.topicRoom?.state === "OPEN").length,
  }));
}

/** Concepts under one item with open-request count, answer state and room summary. */
export async function getItemConceptSummaries(itemId: string) {
  const concepts = await prisma.concept.findMany({
    where: { itemId },
    orderBy: { createdAt: "asc" },
    include: {
      topicRoom: { select: roomSelect },
      _count: {
        select: {
          helpRequests: { where: { state: "OPEN" } },
          answers: { where: { deliveredAt: { not: null } } },
        },
      },
    },
  });

  return concepts.map((c) => ({
    id: c.id,
    label: c.label,
    createdAt: c.createdAt,
    openRequests: c._count.helpRequests,
    answered: c._count.answers > 0,
    topicRoom: c.topicRoom
      ? { id: c.topicRoom.id, state: c.topicRoom.state, channelId: c.topicRoom.channelId, memberCount: c.topicRoom._count.members }
      : null,
  }));
}

/** One concept with its item (for the guild check) and room summary. No student rows. */
export async function getConceptDetail(conceptId: string) {
  const concept = await prisma.concept.findUnique({
    where: { id: conceptId },
    include: {
      item: { select: { id: true, guildId: true, title: true, dueAt: true, kind: true } },
      topicRoom: { select: roomSelect },
    },
  });
  if (!concept) return null;
  return {
    id: concept.id,
    label: concept.label,
    createdAt: concept.createdAt,
    item: concept.item,
    topicRoom: concept.topicRoom
      ? {
          id: concept.topicRoom.id,
          state: concept.topicRoom.state,
          channelId: concept.topicRoom.channelId,
          memberCount: concept.topicRoom._count.members,
        }
      : null,
  };
}
