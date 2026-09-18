import {
  ChannelType,
  type Client,
  type TextChannel,
} from "discord.js";
import {
  closeTopicRoom,
  deleteTopicRoom,
  getTopicRoomsForItem,
  reopenTopicRoom,
  setItemDiscordCategory,
} from "@classync/core";

export async function closeTopicRoomChannel(
  client: Client,
  discordGuildId: string,
  roomId: string,
  closedById: string
): Promise<void> {
  const room = await closeTopicRoom(roomId, closedById);
  if (!room.channelId) return;

  const guild = await client.guilds.fetch(discordGuildId).catch(() => null);
  if (!guild) return;

  const channel = await guild.channels.fetch(room.channelId).catch(() => null);
  if (!channel || channel.type !== ChannelType.GuildText) return;

  const textChannel = channel as TextChannel;
  await textChannel.permissionOverwrites.edit(guild.roles.everyone.id, {
    SendMessages: false,
  }).catch(() => undefined);

  await textChannel.send(`🔒 **This room has been closed by <@${closedById}>.** It remains read-only as a reference.`)
    .catch(() => undefined);
}

export async function reopenTopicRoomChannel(
  client: Client,
  discordGuildId: string,
  roomId: string
): Promise<void> {
  const room = await reopenTopicRoom(roomId);
  if (!room.channelId) return;

  const guild = await client.guilds.fetch(discordGuildId).catch(() => null);
  if (!guild) return;

  const channel = await guild.channels.fetch(room.channelId).catch(() => null);
  if (!channel || channel.type !== ChannelType.GuildText) return;

  const textChannel = channel as TextChannel;
  await textChannel.permissionOverwrites.edit(guild.roles.everyone.id, {
    SendMessages: null,
  }).catch(() => undefined);

  await textChannel.send("🔓 **This room has been reopened by a TA.**").catch(() => undefined);
}

export async function closeAssignmentRooms(
  client: Client,
  discordGuildId: string,
  item: { id: string; title: string; dueAt?: Date | null; discordCategoryId?: string | null },
  closedById: string,
  deleteDiscord: boolean
): Promise<{ closedCount: number; deletedDiscord: boolean }> {
  if (item.dueAt && Date.now() < item.dueAt.getTime()) {
    throw new Error("Cannot close rooms before the assignment due date.");
  }

  const rooms = await getTopicRoomsForItem(item.id);
  const guild = await client.guilds.fetch(discordGuildId).catch(() => null);

  if (deleteDiscord && guild) {
    for (const room of rooms) {
      if (room.channelId) {
        const channel = await guild.channels.fetch(room.channelId).catch(() => null);
        if (channel) await channel.delete("Assignment rooms deleted by TA").catch(() => undefined);
      }
      await deleteTopicRoom(room.id);
    }
    if (item.discordCategoryId) {
      const category = await guild.channels.fetch(item.discordCategoryId).catch(() => null);
      if (category) await category.delete("Assignment category deleted by TA").catch(() => undefined);
      await setItemDiscordCategory(item.id, "");
    }
    return { closedCount: rooms.length, deletedDiscord: true };
  }

  for (const room of rooms) {
    await closeTopicRoomChannel(client, discordGuildId, room.id, closedById);
  }
  return { closedCount: rooms.length, deletedDiscord: false };
}
