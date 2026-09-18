import type { Client, Message } from "discord.js";
import { getTopicRoomByChannelId } from "@classync/core";

// Debounce map: roomId -> timestamp of last notification
const alertDebounceMap = new Map<string, number>();
const DEBOUNCE_MS = 2 * 60 * 1000; // 2 minutes

export async function handleTopicRoomMessage(client: Client, message: Message): Promise<void> {
  if (message.author.bot || !message.guildId) return;

  const room = await getTopicRoomByChannelId(message.channelId);
  if (!room || room.state !== "OPEN") return;

  const { concept } = room;
  const item = concept.item;
  const guild = item.guild;

  // Do not alert TAs when a TA is the one posting
  if (guild.taUserIds.includes(message.author.id)) return;

  // Debounce per room
  const lastAlert = alertDebounceMap.get(room.id) ?? 0;
  const now = Date.now();
  if (now - lastAlert < DEBOUNCE_MS) return;
  alertDebounceMap.set(room.id, now);

  const preview = message.content.trim().slice(0, 200);
  const snippet = preview.length > 0 ? preview : "*(attached media or embed)*";
  const jumpUrl = `https://discord.com/channels/${message.guildId}/${message.channelId}/${message.id}`;

  const alertContent = [
    `🔔 **New activity in discussion room**`,
    `**Assignment:** ${item.title}`,
    `**Topic:** ${concept.label}`,
    `**From:** <@${message.author.id}> (${message.author.tag})`,
    `> ${snippet}`,
    `👉 [Open Message in Discord](${jumpUrl})`,
  ].join("\n");

  for (const taUserId of guild.taUserIds) {
    try {
      const user = await client.users.fetch(taUserId);
      await user.send(alertContent);
    } catch {
      // Ignore DM failures (e.g. user blocked DMs or closed bot DMs)
    }
  }
}
