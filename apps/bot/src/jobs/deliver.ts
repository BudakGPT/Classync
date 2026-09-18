import type { Client } from "discord.js";
import { getPendingAnswers, stampDelivered, getConceptById, getItemById, getOpenRequestsForConcept } from "@classync/core";

const POLL_INTERVAL_MS = 10_000;

export function startDeliverJob(client: Client) {
  setInterval(async () => {
    try {
      await deliverPending(client);
    } catch (err) {
      console.error("[deliver] Error:", err);
    }
  }, POLL_INTERVAL_MS);

  console.log("📬 Deliver job started (every 10s)");
}

async function deliverPending(client: Client) {
  const pending = await getPendingAnswers();
  if (pending.length === 0) return;

  for (const answer of pending) {
    const concept = await getConceptById(answer.conceptId);
    if (!concept) continue;

    const item = await getItemById(concept.itemId);
    if (!item) continue;

    // Get requesters BEFORE marking answered (already marked, get ANSWERED state)
    // We store discordUserIds from the open requests captured when answer was created
    // Re-fetch all ANSWERED requests for this concept that don't have delivery yet
    const guild = await client.guilds.fetch(item.guildId).catch(() => null);
    if (!guild) continue;

    // Fetch students with ANSWERED requests for this concept
    const { prisma } = await import("@classync/core");
    const recipients = await prisma.helpRequest.findMany({
      where: { conceptId: answer.conceptId, state: "ANSWERED" },
      include: { student: { select: { discordUserId: true } } },
    });

    let deliveredCount = 0;
    let pinnedMessageId: string | undefined;

    // DM each student
    for (const req of recipients) {
      try {
        const user = await client.users.fetch(req.student.discordUserId);
        await user.send(
          `📚 **TA answered your question on: ${item.title}**\n\n**Topic:** ${concept.label}\n\n${answer.body}`
        );
        deliveredCount++;
      } catch {
        // Closed DMs — log and skip, never throw
        console.warn(`[deliver] Cannot DM ${req.student.discordUserId} (DMs closed)`);
      }
    }

    // Pin answer in announcement channel
    const guildData = await prisma.guild.findUnique({ where: { id: item.guildId } });
    if (guildData?.announcementChannelId) {
      try {
        const channel = await guild.channels.fetch(guildData.announcementChannelId);
        if (channel?.isTextBased()) {
          const msg = await channel.send(
            `📌 **Answer for: ${item.title}**\n**Topic:** ${concept.label}\n\n${answer.body}\n\n_Delivered to ${deliveredCount} student(s)_`
          );
          pinnedMessageId = msg.id;
          await msg.pin().catch(() => {}); // Pin may fail if no permission — ok
        }
      } catch (err) {
        console.warn("[deliver] Could not pin:", err);
      }
    }

    await stampDelivered(answer.id, deliveredCount, pinnedMessageId);
    console.log(`[deliver] Answer ${answer.id} delivered to ${deliveredCount} students`);
  }
}
