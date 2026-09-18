import { MessageFlags, SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { getConsentedStudent, getGuildByDiscordId, isTa } from "@classync/core";
import { consentScreen, taskListScreen } from "../ui/tasks.js";

export default {
  data: new SlashCommandBuilder().setName("tasks").setDescription("View your private task checklist"),
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guildId) {
      await interaction.reply({ content: "This command is available in a class server only.", flags: MessageFlags.Ephemeral });
      return;
    }
    const guild = await getGuildByDiscordId(interaction.guildId);
    if (!guild) {
      await interaction.reply({ content: "A TA must run `/setup channel` first.", flags: MessageFlags.Ephemeral });
      return;
    }
    if (await isTa(interaction.guildId, interaction.user.id)) {
      await interaction.reply({
        content: "Registered TAs cannot use student task flows. Use `/ta` to manage items, rooms, and answers.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    const student = await getConsentedStudent(guild.id, interaction.user.id);
    await interaction.reply({
      ...(student ? await taskListScreen(guild.id, student) : consentScreen()),
      flags: MessageFlags.Ephemeral,
    });
  },
};
