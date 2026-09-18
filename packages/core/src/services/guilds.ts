import { prisma } from "../db.js";
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

export async function getGuildByDiscordId(
  discordGuildId: string
): Promise<Guild | null> {
  return prisma.guild.findUnique({ where: { discordGuildId } });
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
