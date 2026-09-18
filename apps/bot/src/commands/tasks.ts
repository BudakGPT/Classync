import { MessageFlags, SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { getConsentedStudent } from "@classync/core";
import { consentScreen, taskListScreen } from "../ui/tasks.js";

export default {
  data: new SlashCommandBuilder().setName("tasks").setDescription("View your private task checklist"),
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guildId) {
      await interaction.reply({ content: "This command is available in a class server only.", flags: MessageFlags.Ephemeral });
      return;
    }
    const student = await getConsentedStudent(interaction.guildId, interaction.user.id);
    await interaction.reply({
      ...(student ? await taskListScreen(interaction.guildId, student) : consentScreen()),
      flags: MessageFlags.Ephemeral,
    });
  },
};
