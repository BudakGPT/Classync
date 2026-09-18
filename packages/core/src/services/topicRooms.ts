import { prisma } from "../db";
import type { TopicRoom, TopicRoomMember } from "@prisma/client";

/** Reserve the single room associated with a concept before Discord provisioning. */
export async function getOrCreateTopicRoom(conceptId: string): Promise<TopicRoom> {
  return prisma.topicRoom.upsert({
    where: { conceptId },
    update: {},
    create: { conceptId },
  });
}

export async function getTopicRoomForConcept(conceptId: string) {
  return prisma.topicRoom.findUnique({
    where: { conceptId },
    include: { members: true },
  });
}

/** An open room is joinable by students. */
export async function getJoinableTopicRoom(conceptId: string) {
  return prisma.topicRoom.findFirst({
    where: { conceptId, channelId: { not: null }, state: "OPEN" },
    include: { members: true },
  });
}

/** Claims provisioning exactly once. A failed Discord operation must release the claim. */
export async function claimTopicRoomProvisioning(roomId: string): Promise<boolean> {
  const result = await prisma.topicRoom.updateMany({
    where: { id: roomId, channelId: null, provisioningAt: null },
    data: { provisioningAt: new Date() },
  });
  return result.count === 1;
}

export async function releaseTopicRoomProvisioning(roomId: string): Promise<void> {
  await prisma.topicRoom.update({ where: { id: roomId }, data: { provisioningAt: null } });
}

export async function setTopicRoomChannel(roomId: string, channelId: string): Promise<TopicRoom> {
  return prisma.topicRoom.update({
    where: { id: roomId },
    data: { channelId, provisioningAt: null, state: "OPEN", closedAt: null, closedById: null },
  });
}

export async function addTopicRoomMember(roomId: string, studentId: string): Promise<TopicRoomMember> {
  return prisma.topicRoomMember.upsert({
    where: { roomId_studentId: { roomId, studentId } },
    update: {},
    create: { roomId, studentId },
  });
}

export async function isTopicRoomMember(roomId: string, studentId: string): Promise<boolean> {
  const member = await prisma.topicRoomMember.findUnique({
    where: { roomId_studentId: { roomId, studentId } },
  });
  return member !== null;
}

export async function getTopicRoomMembers(roomId: string) {
  return prisma.topicRoomMember.findMany({
    where: { roomId },
    include: { student: { select: { id: true, discordUserId: true } } },
    orderBy: { joinedAt: "asc" },
  });
}

export async function removeTopicRoomMember(roomId: string, studentId: string): Promise<void> {
  await prisma.topicRoomMember.deleteMany({
    where: { roomId, studentId },
  });
}

export async function closeTopicRoom(roomId: string, closedById: string): Promise<TopicRoom> {
  return prisma.topicRoom.update({
    where: { id: roomId },
    data: { state: "CLOSED", closedAt: new Date(), closedById },
  });
}

export async function reopenTopicRoom(roomId: string): Promise<TopicRoom> {
  return prisma.topicRoom.update({
    where: { id: roomId },
    data: { state: "OPEN", closedAt: null, closedById: null },
  });
}

export async function getTopicRoomByChannelId(channelId: string) {
  return prisma.topicRoom.findUnique({
    where: { channelId },
    include: {
      concept: {
        include: {
          item: { include: { guild: true } },
        },
      },
      members: {
        include: { student: { select: { discordUserId: true } } },
      },
    },
  });
}

export async function getTopicRoomsForItem(itemId: string) {
  return prisma.topicRoom.findMany({
    where: { concept: { itemId } },
    include: {
      concept: true,
      members: true,
    },
  });
}

export async function deleteTopicRoom(roomId: string): Promise<void> {
  await prisma.topicRoom.delete({ where: { id: roomId } });
}

export async function getTopicRoomsForGuild(guildId: string) {
  return prisma.topicRoom.findMany({
    where: { concept: { item: { guildId } } },
    include: {
      concept: { include: { item: { select: { id: true, title: true } } } },
      members: true,
    },
    orderBy: { createdAt: "desc" },
  });
}
