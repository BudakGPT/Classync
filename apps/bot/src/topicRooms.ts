import {
  ChannelType,
  PermissionFlagsBits,
  type CategoryChannel,
  type Client,
  type OverwriteResolvable,
  type TextChannel,
} from "discord.js";
import {
  addTopicRoomMember,
  claimTopicRoomProvisioning,
  getOrCreateTopicRoom,
  getTopicRoomForConcept,
  releaseTopicRoomProvisioning,
  setItemDiscordCategory,
  setTopicRoomChannel,
} from "@classync/core";

export {
  closeAssignmentRooms,
  closeTopicRoomChannel,
  reopenTopicRoomChannel,
} from "./roomModeration.js";

export function channelUrl(discordGuildId: string, channelId: string): string {
  return `https://discord.com/channels/${discordGuildId}/${channelId}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 50);
}

export async function ensureItemCategory(
  client: Client,
  discordGuildId: string,
  item: { id: string; title: string; discordCategoryId?: string | null },
  taUserIds: string[]
): Promise<CategoryChannel | null> {
  const discordGuild = await client.guilds.fetch(discordGuildId).catch(() => null);
  if (!discordGuild) return null;

  if (item.discordCategoryId) {
    const existing = await discordGuild.channels.fetch(item.discordCategoryId).catch(() => null);
    if (existing && existing.type === ChannelType.GuildCategory) {
      return existing as CategoryChannel;
    }
  }

  const overwrites: OverwriteResolvable[] = [
    { id: discordGuild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
    ...(client.user ? [{
      id: client.user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.ManageMessages,
        PermissionFlagsBits.ReadMessageHistory,
      ],
    }] : []),
    ...taUserIds.map((id) => ({
      id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
      ],
    })),
  ];

  const categoryName = `📁 ${item.title}`.slice(0, 100);
  const category = await discordGuild.channels.create({
    name: categoryName,
    type: ChannelType.GuildCategory,
    permissionOverwrites: overwrites,
  }).catch((err) => {
    console.error("[topicRooms] Failed to create item category", err);
    return null;
  });

  if (category) {
    await setItemDiscordCategory(item.id, category.id);
  }
  return category;
}

export async function ensurePrivateTopicRoom(
  client: Client,
  guildInfo: { id: string; discordGuildId: string; taUserIds: string[] },
  item: { id: string; title: string; discordCategoryId?: string | null },
  concept: { id: string; label: string },
  student: { id: string; discordUserId: string }
): Promise<string | null> {
  const room = await getOrCreateTopicRoom(concept.id);
  if (room.channelId) {
    await enrollStudentInTopicRoom(client, guildInfo.discordGuildId, room.channelId, student, room.id);
    return room.channelId;
  }

  if (!await claimTopicRoomProvisioning(room.id)) {
    const latest = await getTopicRoomForConcept(concept.id);
    if (latest?.channelId) {
      await enrollStudentInTopicRoom(client, guildInfo.discordGuildId, latest.channelId, student, latest.id);
      return latest.channelId;
    }
    return null;
  }

  try {
    const category = await ensureItemCategory(client, guildInfo.discordGuildId, item, guildInfo.taUserIds);
    const discordGuild = await client.guilds.fetch(guildInfo.discordGuildId);
    const channelName = `help-${slugify(concept.label)}`.slice(0, 100);

    const overwrites: OverwriteResolvable[] = [
      { id: discordGuild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
      ...(client.user ? [{
        id: client.user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ManageChannels,
          PermissionFlagsBits.ManageMessages,
          PermissionFlagsBits.ReadMessageHistory,
        ],
      }] : []),
      ...guildInfo.taUserIds.map((id) => ({
        id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
        ],
      })),
      {
        id: student.discordUserId,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
        ],
      },
    ];

    const channel = await discordGuild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: category?.id,
      permissionOverwrites: overwrites,
    });

    const opening = [
      `## 📚 ${item.title} — ${concept.label}`,
      `**Private Concept Room**`,
      `• All members in this room can see each other's Discord name and messages.`,
      `• Registered TAs are notified of student questions here.`,
      `• Discuss and share solutions for this concept below.`,
    ].join("\n\n");

    await channel.send(opening);
    await setTopicRoomChannel(room.id, channel.id);
    await addTopicRoomMember(room.id, student.id);
    return channel.id;
  } catch (error) {
    await releaseTopicRoomProvisioning(room.id).catch(() => undefined);
    console.error(`[topicRooms] Could not create room for concept ${concept.id}`, error);
    return null;
  }
}

export async function enrollStudentInTopicRoom(
  client: Client,
  discordGuildId: string,
  channelId: string,
  student: { id: string; discordUserId: string },
  roomId: string
): Promise<void> {
  await addTopicRoomMember(roomId, student.id);
  const guild = await client.guilds.fetch(discordGuildId).catch(() => null);
  const channel = guild ? await guild.channels.fetch(channelId).catch(() => null) : null;
  if (channel && channel.type === ChannelType.GuildText) {
    await (channel as TextChannel).permissionOverwrites.create(student.discordUserId, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true,
    }).catch((err) => console.warn(`[topicRooms] Could not add overwrite for ${student.discordUserId}`, err));
  }
}

export async function revokeStudentRoomAccess(
  client: Client,
  discordGuildId: string,
  studentDiscordUserId: string,
  channelIds: string[]
): Promise<void> {
  const guild = await client.guilds.fetch(discordGuildId).catch(() => null);
  if (!guild) return;

  for (const channelId of channelIds) {
    try {
      const channel = await guild.channels.fetch(channelId).catch(() => null);
      if (channel && channel.type === ChannelType.GuildText) {
        await (channel as TextChannel).permissionOverwrites.delete(studentDiscordUserId);
      }
    } catch {
      // Best effort cleanup
    }
  }
}
