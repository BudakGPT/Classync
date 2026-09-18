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

export async function giveConsent(studentId: string): Promise<Student> {
  return prisma.student.update({
    where: { id: studentId },
    data: { consentedAt: new Date(), revokedAt: null },
  });
}

/** Revoke consent and delete all personal data in this guild (statuses, requests, peer matches). */
export async function revokeAndDelete(studentId: string): Promise<void> {
  await prisma.$transaction([
    prisma.itemStatus.deleteMany({ where: { studentId } }),
    prisma.helpRequest.deleteMany({ where: { studentId } }),
    prisma.match.deleteMany({ where: { OR: [{ receiverId: studentId }, { providerId: studentId }] } }),
    prisma.student.update({
      where: { id: studentId },
      data: { consentedAt: null, revokedAt: new Date(), helperOptIn: false },
    }),
  ]);
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
