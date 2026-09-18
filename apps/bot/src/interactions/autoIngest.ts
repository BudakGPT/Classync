import type { Client, Message } from "discord.js";
import { getGuildByDiscordId, parseAnnouncement, createItem } from "@classync/core";

export async function handleAutoIngest(client: Client, message: Message) {
  if (!message.guildId || message.author.bot) return;

  const guild = await getGuildByDiscordId(message.guildId);
  if (!guild?.announcementChannelId) return;
  if (message.channelId !== guild.announcementChannelId) return;

  // Parse with LLM (or fallback)
  const parsed = await parseAnnouncement(message.content);

  const item = await createItem({
    guildId: guild.id,
    title: parsed.title,
    dueAt: parsed.dueAt ? new Date(parsed.dueAt) : undefined,
    kind: parsed.kind,
    sourceMessageId: message.id,
  });

  const dueStr = item.dueAt
    ? `📅 Due: <t:${Math.floor(item.dueAt.getTime() / 1000)}:F>`
    : "📅 No deadline detected";

  await message.reply(
    `📌 **Task added to Classync!**\n**${item.title}**\n${dueStr}\n🏷️ ${item.kind}\n\n_Students can track this with \`/tasks\`. If details are wrong, TA can use \`/ta add-item\` to correct._`
  );
}
