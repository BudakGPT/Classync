import { MessageFlags, type ButtonInteraction } from "discord.js";
import { setStatus } from "@classync/core";
import { conceptPickerScreen } from "../ui/tasks.js";
import { contextForItem } from "./taskContext.js";

/** Buttons on the reminder DM (PRD B5). Done writes the private status; Still stuck opens the concept picker. */
export async function handleReminderInteraction(interaction: ButtonInteraction): Promise<boolean> {
  if (!interaction.customId.startsWith("reminder:")) return false;
  await interaction.deferUpdate();
  const [, action, itemId] = interaction.customId.split(":");
  if (!itemId) return true;
  const context = await contextForItem(itemId, interaction.user.id, interaction.guildId);
  if (!context) {
    await interaction.followUp({ content: "Open `/tasks` in the class server to update this task.", flags: MessageFlags.Ephemeral });
    return true;
  }
  if (action === "done") {
    await setStatus(itemId, context.student.id, "DONE");
    await interaction.editReply({ content: `✅ **${context.item.title}** marked done. No more reminders for this task.`, components: [] });
  } else if (action === "stuck") {
    await interaction.editReply(await conceptPickerScreen(itemId));
  }
  return true;
}
