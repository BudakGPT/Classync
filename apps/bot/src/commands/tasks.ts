import {
  SlashCommandBuilder,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ComponentType,
  type ChatInputCommandInteraction,
} from "discord.js";
import {
  getOrCreateStudent,
  hasConsented,
  giveConsent,
  getItemsByGuild,
  getMyStatus,
  setStatus,
  getOrCreateConcept,
  getStuckCount,
  getLatestAnswerForConcept,
  createHelpRequest,
  getConceptsForItem,
  revokeAndDelete,
} from "@classync/core";

export default {
  data: new SlashCommandBuilder()
    .setName("tasks")
    .setDescription("View your private assignment checklist"),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guildId) {
      await interaction.reply({ content: "❌ Server only.", flags: MessageFlags.Ephemeral });
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const student = await getOrCreateStudent(interaction.guildId, interaction.user.id);

    // Consent gate
    if (!(await hasConsented(student.id))) {
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId("consent:agree").setLabel("I agree").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("consent:decline").setLabel("No thanks").setStyle(ButtonStyle.Secondary)
      );
      await interaction.editReply({
        content:
          "**Before using Classync, please consent to data collection.**\n\n" +
          "We store:\n• Your Discord user ID\n• Your task statuses (only visible to you)\n• Any help requests you explicitly submit\n\n" +
          "You can delete your data anytime via the **Privacy** button.",
        components: [row],
      });

      const btn = await interaction.channel
        ?.awaitMessageComponent({
          filter: (i) => i.user.id === interaction.user.id && i.customId.startsWith("consent:"),
          componentType: ComponentType.Button,
          time: 60_000,
        })
        .catch(() => null);

      if (!btn || btn.customId === "consent:decline") {
        await interaction.editReply({ content: "No problem! Come back anytime.", components: [] });
        return;
      }
      await giveConsent(student.id);
      await btn.update({ content: "✅ Consent recorded. Loading your tasks...", components: [] });
    }

    await showTaskList(interaction, student.id, interaction.guildId);
  },
};

export async function showTaskList(
  interaction: ChatInputCommandInteraction,
  studentId: string,
  guildId: string
) {
  const items = await getItemsByGuild(guildId);
  if (items.length === 0) {
    await interaction.editReply({ content: "No tasks yet. Ask your TA to add one!", components: [] });
    return;
  }

  const lines: string[] = ["**📋 Your Tasks**\n"];
  for (const item of items) {
    const status = await getMyStatus(item.id, studentId);
    const state = status?.state ?? "NONE";
    const emoji = { NONE: "⬜", IN_PROGRESS: "🔵", DONE: "✅", STUCK: "🔴" }[state] ?? "⬜";
    const due = item.dueAt ? ` · Due: <t:${Math.floor(item.dueAt.getTime() / 1000)}:R>` : "";
    lines.push(`${emoji} **${item.title}**${due} \`[${state}]\``);
  }

  const privacyRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId("privacy:revoke").setLabel("🔒 Privacy / Delete my data").setStyle(ButtonStyle.Danger)
  );

  await interaction.editReply({
    content: lines.join("\n") + "\n\n*Tap a status button on any task (use `/ta add-item` to add tasks)*",
    components: [privacyRow],
  });
}
