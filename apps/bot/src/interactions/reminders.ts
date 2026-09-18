import { MessageFlags, type ButtonInteraction } from "discord.js";
import { conceptPickerScreen } from "../ui/tasks.js";
import { contextForItem } from "./taskContext.js";

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
    await interaction.editReply({ content: "The Done status is no longer used. Use **Still stuck** if you need help.", components: [] });
  } else if (action === "stuck") {
    await interaction.editReply(await conceptPickerScreen(itemId));
  }
  return true;
}
