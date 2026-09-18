import { SlashCommandBuilder, MessageFlags, type ChatInputCommandInteraction } from "discord.js";
import { getGuildByDiscordId, getOrCreateStudent, hasConsented } from "@classync/core";
import { consentScreen, taskListScreen } from "../ui/tasks";

export default {
  data: new SlashCommandBuilder()
    .setName("tasks")
    .setDescription("View your private assignment checklist"),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guildId) {
      await interaction.reply({ content: "❌ Server only.", flags: MessageFlags.Ephemeral });
      return;
    }
    const guild = await getGuildByDiscordId(interaction.guildId);
    if (!guild) {
      await interaction.reply({ content: "❌ A TA must run `/setup channel` first.", flags: MessageFlags.Ephemeral });
      return;
    }
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const student = await getOrCreateStudent(guild.id, interaction.user.id);
    // Consent gate: buttons are handled by the component router (task:consent:*).
    const screen = (await hasConsented(student.id)) ? await taskListScreen(guild.id, student) : consentScreen();
    await interaction.editReply(screen);
  },
};
