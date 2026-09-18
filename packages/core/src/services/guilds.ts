import { prisma } from "../db";
import type { Guild } from "@prisma/client";

export async function getOrCreateGuild(
  discordGuildId: string,
  name: string
): Promise<Guild> {
  return prisma.guild.upsert({
    where: { discordGuildId },
    update: { name },
    create: { discordGuildId, name },
  });
}

export async function setAnnouncementChannel(
  discordGuildId: string,
  channelId: string
): Promise<Guild> {
  return prisma.guild.update({
    where: { discordGuildId },
    data: { announcementChannelId: channelId },
  });
}

export async function addTaUser(
  discordGuildId: string,
  discordUserId: string
): Promise<Guild> {
  const guild = await prisma.guild.findUniqueOrThrow({ where: { discordGuildId } });
  if (guild.taUserIds.includes(discordUserId)) return guild;
  return prisma.guild.update({
    where: { discordGuildId },
    data: { taUserIds: { push: discordUserId } },
  });
}

export async function setHelpForumChannel(
  discordGuildId: string,
  channelId: string
): Promise<Guild> {
  return prisma.guild.update({
    where: { discordGuildId },
    data: { helpForumChannelId: channelId },
  });
}

/** Atomically claims an unowned guild. Returns the existing owner when already claimed. */
export async function claimGuildOwnership(
  discordGuildId: string,
  discordUserId: string
): Promise<{ guild: Guild; claimed: boolean }> {
  const result = await prisma.guild.updateMany({
    where: { discordGuildId, ownerUserId: null },
    data: { ownerUserId: discordUserId },
  });
  const guild = await prisma.guild.findUniqueOrThrow({ where: { discordGuildId } });
  return { guild, claimed: result.count === 1 };
}

export async function transferGuildOwnership(
  discordGuildId: string,
  discordUserId: string
): Promise<Guild> {
  return prisma.guild.update({
    where: { discordGuildId },
    data: { ownerUserId: discordUserId },
  });
}

export async function removeTaUser(
  discordGuildId: string,
  discordUserId: string
): Promise<Guild> {
  const guild = await prisma.guild.findUniqueOrThrow({ where: { discordGuildId } });
  if (!guild.taUserIds.includes(discordUserId)) return guild;
  return prisma.guild.update({
    where: { discordGuildId },
    data: { taUserIds: guild.taUserIds.filter((id) => id !== discordUserId) },
  });
}

export async function getGuildByDiscordId(
  discordGuildId: string
): Promise<Guild | null> {
  return prisma.guild.findUnique({ where: { discordGuildId } });
}

export async function getGuildById(id: string): Promise<Guild | null> {
  return prisma.guild.findUnique({ where: { id } });
}

/** Returns all guilds where the given Discord user ID is a TA. */
export async function getGuildsForTa(discordUserId: string): Promise<Guild[]> {
  return prisma.guild.findMany({
    where: { taUserIds: { has: discordUserId } },
  });
}

export async function isTa(
  discordGuildId: string,
  discordUserId: string
): Promise<boolean> {
  const guild = await prisma.guild.findUnique({ where: { discordGuildId } });
  return guild?.taUserIds.includes(discordUserId) ?? false;
}
