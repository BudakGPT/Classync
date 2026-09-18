import type { Client } from "discord.js";
import { getAnswerDeliveryContext, getAnsweredRequestsForDelivery, getPendingAnswers, stampDelivered } from "@classync/core";

const POLL_INTERVAL_MS = 10_000;
let running = false;

export function startDeliverJob(client: Client): void {
  void deliverPending(client);
  setInterval(() => void deliverPending(client), POLL_INTERVAL_MS);
  console.log("Deliver job started (every 10s)");
}


async function sendRoomAnswer(client: Client, guildId: string, channelId: string, content: string): Promise<{ messageId?: string; pinnedMessageId?: string }> {
  const guild = await client.guilds.fetch(guildId).catch(() => null);
  const channel = guild ? await guild.channels.fetch(channelId).catch(() => null) : null;
  if (!channel?.isSendable()) return {};
  const message = await channel.send(content);
  await message.pin().catch(() => undefined);
  return { messageId: message.id, pinnedMessageId: message.id };
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

      const answerText = `📌 **TA Answer for: ${item.title}**\n**Topic:** ${concept.label}\n\n${answer.body}`;
      let pinnedMessageId: string | undefined;
      let threadMessageId: string | undefined;

      // Only post + pin in the topic room if one is open; otherwise answers are DM-only.
      if (concept.topicRoom?.channelId && concept.topicRoom.state !== "CLOSED") {
        const sent = await sendRoomAnswer(client, item.guild.discordGuildId, concept.topicRoom.channelId, answerText)
          .catch((error: unknown) => {
            console.warn("[deliver] Could not post topic-room answer", error);
            return { messageId: undefined, pinnedMessageId: undefined };
          });
        pinnedMessageId = sent.pinnedMessageId;
        threadMessageId = sent.messageId;
      }

      await stampDelivered(answer.id, deliveredCount, pinnedMessageId, threadMessageId);
      console.log(`[deliver] Answer ${answer.id} delivered to ${deliveredCount} requester(s)`);
    }
  } catch (error) {
    console.error("[deliver] Error", error);
  } finally {
    running = false;
  }
}
