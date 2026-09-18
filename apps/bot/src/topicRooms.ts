import {
  ChannelType,
  type Client,
  type GuildBasedChannel,
  type ThreadChannel,
} from "discord.js";
import {
  claimTopicRoomProvisioning,
  getOrCreateTopicRoom,
  getTopicRoomForConcept,
  releaseTopicRoomProvisioning,
  setTopicRoomThread,
} from "@classync/core";

type RoomSubject = { id: string; title: string; label: string };
type ConfiguredGuild = { discordGuildId: string; helpForumChannelId: string | null };

function roomTitle(itemTitle: string, label: string): string {
  const value = `${itemTitle} — ${label}`;
  return value.length <= 100 ? value : `${value.slice(0, 99)}…`;
}

function openingMessage(itemTitle: string, label: string): string {
  return [
    `## ${itemTitle}`,
    `**Topic:** ${label}`,
    "Several students requested clarification on this topic. Share questions and helpful context here.",
  ].join("\n\n");
}

async function createDiscordThread(channel: GuildBasedChannel, subject: RoomSubject): Promise<ThreadChannel> {
  const name = roomTitle(subject.title, subject.label);
  const content = openingMessage(subject.title, subject.label);
  if (channel.type === ChannelType.GuildForum) {
    return channel.threads.create({ name, message: { content } });
  }
  if (channel.type === ChannelType.GuildText || channel.type === ChannelType.GuildAnnouncement) {
    const thread = await channel.threads.create({ name });
    await thread.send(content);
    return thread;
  }
  throw new Error("Configured discussion channel is not a forum or text channel.");
}

/**
 * Creates the one anonymous room reserved for this concept. The DB reservation
 * happens before the Discord call so concurrent reports cannot create duplicates.
 */
export async function ensureTopicRoom(
  client: Client,
  guild: ConfiguredGuild,
  subject: RoomSubject
): Promise<string | null> {
  if (!guild.helpForumChannelId) return null;
  const room = await getOrCreateTopicRoom(subject.id);
  if (room.threadId) return room.threadId;
  if (!await claimTopicRoomProvisioning(room.id)) return getTopicRoomForConcept(subject.id).then((value) => value?.threadId ?? null);

  try {
    const discordGuild = await client.guilds.fetch(guild.discordGuildId);
    const channel = await discordGuild.channels.fetch(guild.helpForumChannelId);
    if (!channel) throw new Error("Configured discussion channel no longer exists.");
    const thread = await createDiscordThread(channel, subject);
    await setTopicRoomThread(room.id, thread.id);
    return thread.id;
  } catch (error) {
    await releaseTopicRoomProvisioning(room.id).catch(() => undefined);
    console.warn(`[topic-room] Could not create room for concept ${subject.id}`, error);
    return null;
  }
}

export function threadUrl(discordGuildId: string, threadId: string): string {
  return `https://discord.com/channels/${discordGuildId}/${threadId}`;
}
