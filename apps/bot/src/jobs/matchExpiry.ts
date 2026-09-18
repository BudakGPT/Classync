import { ActionRowBuilder, ButtonBuilder, ButtonStyle, type Client } from "discord.js";
import { expirePendingMatches } from "@classync/core";

const POLL_INTERVAL_MS = 60_000;
const EXPIRE_AFTER_MINUTES = 30;

/** Every 60 s: expire stale PENDING matches and send the receiver back to the TA path (handoff §4). */
export function startMatchExpiryJob(client: Client): void {
  setInterval(async () => {
    try {
      await expireAndNotify(client);
    } catch (err) {
      console.error("[matchExpiry] Error:", err);
    }
  }, POLL_INTERVAL_MS);
  console.log("⏳ Match expiry job started (every 60s)");
}

async function expireAndNotify(client: Client): Promise<void> {
  const expired = await expirePendingMatches(EXPIRE_AFTER_MINUTES);
  for (const m of expired) {
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(`task:help:${m.itemId}`).setLabel("Request TA help").setStyle(ButtonStyle.Secondary)
    );
    try {
      const user = await client.users.fetch(m.receiverDiscordUserId);
      await user.send({
        content: `No classmate was free in ${EXPIRE_AFTER_MINUTES} minutes for **${m.itemTitle}**. Want TA help?`,
        components: [row],
      });
    } catch {
      console.warn(`[matchExpiry] Cannot DM ${m.receiverDiscordUserId} (DMs closed)`);
    }
  }
  if (expired.length > 0) console.log(`[matchExpiry] Expired ${expired.length} match(es)`);
}
