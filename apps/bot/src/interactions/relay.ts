import type { Client, Message } from "discord.js";
import { getActiveMatchForUser } from "@classync/core";

/**
 * DM relay for an ACTIVE peer match (handoff §4). Text is forwarded and never stored.
 * The receiver appears as "Classmate XX" (last 2 chars of the match id) until they reveal;
 * the provider appears as "Helper" until they reveal.
 */
export async function handleDirectMessage(client: Client, message: Message): Promise<void> {
  const active = await getActiveMatchForUser(message.author.id);
  if (!active) return;

  const isReceiver = active.receiver.discordUserId === message.author.id;
  const other = isReceiver ? active.provider : active.receiver;
  const revealed = isReceiver ? active.receiverRevealed : active.providerRevealed;
  const label = revealed
    ? `<@${message.author.id}>`
    : isReceiver
      ? `Classmate ${active.id.slice(-2).toUpperCase()}`
      : "Helper";

  const attachments = message.attachments.map((a) => a.url);
  const body = [message.content, ...attachments].filter(Boolean).join("\n");
  if (!body) return;
  const content = `**${label}:** ${body}`.slice(0, 2000);

  try {
    const user = await client.users.fetch(other.discordUserId);
    await user.send(content);
  } catch {
    console.warn(`[relay] Cannot DM ${other.discordUserId} (DMs closed)`);
    await message.reply("Could not deliver, your classmate may have DMs closed.").catch(() => undefined);
  }
}
