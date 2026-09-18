import { prisma } from "../db";
import type { Student } from "@prisma/client";

export async function getOrCreateStudent(
  guildId: string,
  discordUserId: string
): Promise<Student> {
  return prisma.student.upsert({
    where: { guildId_discordUserId: { guildId, discordUserId } },
    update: {},
    create: { guildId, discordUserId },
  });
}

/** Returns a consenting student without creating a record before consent. */
export async function getConsentedStudent(
  guildId: string,
  discordUserId: string
): Promise<Student | null> {
  return prisma.student.findFirst({
    where: { guildId, discordUserId, consentedAt: { not: null }, revokedAt: null },
  });
}

/** Students eligible for a reminder, including their Discord IDs for bot delivery. */
export async function getReminderRecipients(itemId: string) {
  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) return [];

  const students = await prisma.student.findMany({
    where: { guildId: item.guildId, consentedAt: { not: null }, revokedAt: null },
    include: { statuses: { where: { itemId }, select: { state: true, remindedAt: true } } },
  });

  return students
    .filter((student) => {
      const status = student.statuses[0];
      return status?.state !== "DONE" && status?.remindedAt == null;
    })
    .map((student) => ({ id: student.id, discordUserId: student.discordUserId }));
}

export async function giveConsent(studentId: string): Promise<Student> {
  return prisma.student.update({
    where: { id: studentId },
    data: { consentedAt: new Date(), revokedAt: null },
  });
}

/** Revoke consent and delete all personal data in this guild (statuses, requests, peer matches). */
export async function revokeAndDelete(studentId: string): Promise<void> {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  await prisma.$transaction([
    prisma.topicRoomMember.deleteMany({ where: { studentId } }),
    prisma.itemStatus.deleteMany({ where: { studentId } }),
    prisma.helpRequest.deleteMany({ where: { studentId } }),
    prisma.match.deleteMany({ where: { OR: [{ receiverId: studentId }, { providerId: studentId }] } }),
    ...(student
      ? [
          prisma.academicRoster.updateMany({
            where: { guildId: student.guildId, discordUserId: student.discordUserId },
            data: { discordUserId: null, verifiedAt: null },
          }),
        ]
      : []),
    prisma.student.update({
      where: { id: studentId },
      data: { consentedAt: null, revokedAt: new Date(), helperOptIn: false },
    }),
  ]);
}

export async function getStudentJoinedRoomChannels(studentId: string): Promise<string[]> {
  const members = await prisma.topicRoomMember.findMany({
    where: { studentId },
    include: { room: { select: { channelId: true } } },
  });
  return members.map((m) => m.room.channelId).filter((c): c is string => c !== null);
}

export async function hasConsented(studentId: string): Promise<boolean> {
  const s = await prisma.student.findUnique({ where: { id: studentId } });
  return s?.consentedAt != null && s?.revokedAt == null;
}

export async function getConsentedStudentCount(guildId: string): Promise<number> {
  return prisma.student.count({
    where: { guildId, consentedAt: { not: null }, revokedAt: null },
  });
}
