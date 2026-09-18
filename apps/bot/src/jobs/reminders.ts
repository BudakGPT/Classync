import cron from "node-cron";
import type { Client } from "discord.js";
import { prisma } from "@classync/core";

export function startReminderJob(client: Client) {
  // Run every 15 minutes
  cron.schedule("*/15 * * * *", async () => {
    try {
      await sendReminders(client);
    } catch (err) {
      console.error("[reminders] Error:", err);
    }
  });

  console.log("⏰ Reminder job started (every 15 min)");
}

async function sendReminders(client: Client) {
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // Items due within 24 hours
  const items = await prisma.item.findMany({
    where: {
      dueAt: { gte: now, lte: in24h },
    },
    include: { guild: true },
  });

  for (const item of items) {
    // All consented students whose status is NOT done and haven't been reminded
    const students = await prisma.student.findMany({
      where: {
        guildId: item.guildId,
        consentedAt: { not: null },
        revokedAt: null,
      },
    });

    for (const student of students) {
      const status = await prisma.itemStatus.findUnique({
        where: { itemId_studentId: { itemId: item.id, studentId: student.id } },
      });

      // Skip if already done or already reminded for this item
      if (status?.state === "DONE") continue;
      if (status?.remindedAt != null) continue;

      try {
        const user = await client.users.fetch(student.discordUserId);
        await user.send(
          `⏰ **Reminder: "${item.title}"** is due <t:${Math.floor(item.dueAt!.getTime() / 1000)}:R>!\n\nOpen your checklist with \`/tasks\` to update your status.`
        );

        // Mark reminded
        await prisma.itemStatus.upsert({
          where: { itemId_studentId: { itemId: item.id, studentId: student.id } },
          update: { remindedAt: new Date() },
          create: { itemId: item.id, studentId: student.id, state: "NONE", remindedAt: new Date() },
        });
      } catch {
        // Closed DMs — skip silently
        console.warn(`[reminders] Cannot DM ${student.discordUserId}`);
      }
    }
  }

  console.log(`[reminders] Checked ${items.length} upcoming item(s)`);
}
