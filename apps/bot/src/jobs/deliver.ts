import type { Client } from "discord.js";
import { getAnswerDeliveryContext, getAnsweredRequestsForDelivery, getPendingAnswers, stampDelivered } from "@classync/core";

const POLL_INTERVAL_MS = 10_000;
let running = false;

export function startDeliverJob(client: Client): void {
  void deliverPending(client);
  setInterval(() => void deliverPending(client), POLL_INTERVAL_MS);
  console.log("Deliver job started (every 10s)");
}

async function sendPinnedAnswer(client: Client, channelId: string | null, guildId: string, content: string): Promise<string | undefined> {
  if (!channelId) return undefined;
  const guild = await client.guilds.fetch(guildId).catch(() => null);
  if (!guild) return undefined;
  const channel = await guild.channels.fetch(channelId).catch(() => null);
  if (!channel?.isSendable()) return undefined;
  const message = await channel.send(content);
  await message.pin().catch(() => undefined);
  return message.id;
}

export async function deliverPending(client: Client): Promise<void> {
  if (running) return;
  running = true;
  try {
    for (const answer of await getPendingAnswers()) {
      const context = await getAnswerDeliveryContext(answer.id);
      if (!context || context.deliveredAt) continue;
      const { concept } = context;
      const item = concept.item;
      let deliveredCount = 0;
      for (const request of await getAnsweredRequestsForDelivery(concept.id, answer.createdAt)) {
        try {
          const user = await client.users.fetch(request.student.discordUserId);
          await user.send(`📚 **TA answered: ${item.title}**\n\n**Topic:** ${concept.label}\n\n${answer.body}`);
          deliveredCount += 1;
        } catch {
          console.warn(`[deliver] Cannot DM requester ${request.student.discordUserId}`);
        }
      }
      const pinnedMessageId = await sendPinnedAnswer(
        client,
        item.guild.announcementChannelId,
        item.guild.discordGuildId,
        `📌 **Answer for: ${item.title}**\n**Topic:** ${concept.label}\n\n${answer.body}`,
      ).catch((error: unknown) => {
        console.warn("[deliver] Could not post pinned answer", error);
        return undefined;
      });
      await stampDelivered(answer.id, deliveredCount, pinnedMessageId);
      console.log(`[deliver] Answer ${answer.id} delivered to ${deliveredCount} requester(s)`);
    }
  } catch (error) {
    console.error("[deliver] Error", error);
  } finally {
    running = false;
  }
}
