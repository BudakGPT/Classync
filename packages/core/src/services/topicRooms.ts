import { prisma } from "../db.js";
import type { TopicRoom, TopicRoomState } from "@prisma/client";

/** Reserve the single room associated with a concept before Discord provisioning. */
export async function getOrCreateTopicRoom(conceptId: string): Promise<TopicRoom> {
  return prisma.topicRoom.upsert({ where: { conceptId }, update: {}, create: { conceptId } });
}

export async function getTopicRoomForConcept(conceptId: string): Promise<TopicRoom | null> {
  return prisma.topicRoom.findUnique({ where: { conceptId } });
}

/** An answered room is still joinable until a TA archives it. */
export async function getJoinableTopicRoom(conceptId: string): Promise<TopicRoom | null> {
  return prisma.topicRoom.findFirst({
    where: { conceptId, threadId: { not: null }, state: { in: ["OPEN", "ANSWERED"] } },
  });
}

/** Claims provisioning exactly once. A failed Discord operation must release the claim. */
export async function claimTopicRoomProvisioning(roomId: string): Promise<boolean> {
  const result = await prisma.topicRoom.updateMany({
    where: { id: roomId, threadId: null, provisioningAt: null },
    data: { provisioningAt: new Date() },
  });
  return result.count === 1;
}

export async function releaseTopicRoomProvisioning(roomId: string): Promise<void> {
  await prisma.topicRoom.update({ where: { id: roomId }, data: { provisioningAt: null } });
}

export async function setTopicRoomThread(roomId: string, threadId: string): Promise<TopicRoom> {
  return prisma.topicRoom.update({
    where: { id: roomId },
    data: { threadId, provisioningAt: null, state: "OPEN", archivedAt: null },
  });
}

export async function setTopicRoomState(roomId: string, state: TopicRoomState): Promise<TopicRoom> {
  const now = new Date();
  return prisma.topicRoom.update({
    where: { id: roomId },
    data: {
      state,
      answeredAt: state === "ANSWERED" ? now : undefined,
      archivedAt: state === "ARCHIVED" ? now : state === "OPEN" ? null : undefined,
    },
  });
}

export async function markTopicRoomAnswered(conceptId: string): Promise<void> {
  await prisma.topicRoom.updateMany({
    where: { conceptId, state: "OPEN" },
    data: { state: "ANSWERED", answeredAt: new Date() },
  });
}

export async function getTopicRoomsForGuild(guildId: string) {
  return prisma.topicRoom.findMany({
    where: { concept: { item: { guildId } } },
    include: { concept: { include: { item: { select: { id: true, title: true } } } } },
    orderBy: { createdAt: "desc" },
  });
}
