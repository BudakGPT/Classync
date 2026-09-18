import { ActionRowBuilder, ButtonBuilder, ButtonStyle, type Client } from "discord.js";
import cron from "node-cron";
import { getItemsDueWithin, getReminderRecipients, markReminded } from "@classync/core";

function reminderComponents(itemId: string) {
  return [new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(`reminder:done:${itemId}`).setLabel("Done").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`reminder:stuck:${itemId}`).setLabel("Still stuck").setStyle(ButtonStyle.Danger),
  )];
}

export function startReminderJob(client: Client): void {
  cron.schedule("*/15 * * * *", () => void sendReminders(client));
  console.log("Reminder job started (every 15 min)");
}

export async function sendReminders(client: Client): Promise<void> {
  const now = new Date();
  const upcoming = await getItemsDueWithin(now, new Date(now.getTime() + 24 * 60 * 60 * 1_000));
  for (const item of upcoming) {
    if (!item.dueAt) continue;
    for (const student of await getReminderRecipients(item.id)) {
      try {
        const user = await client.users.fetch(student.discordUserId);
        await user.send({
          content: `⏰ **Reminder:** **${item.title}** is due <t:${Math.floor(item.dueAt.getTime() / 1_000)}:R>.`,
          components: reminderComponents(item.id),
        });
        await markReminded(item.id, student.id);
      } catch {
        console.warn(`[reminders] Cannot DM ${student.discordUserId}`);
      }
    }
  }
}
