import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  type ButtonInteraction,
  type ModalSubmitInteraction,
  type StringSelectMenuInteraction,
} from "discord.js";
import {
  getConsentedStudent,
  getGuildByDiscordId,
  getOrCreateStudent,
  getStudentJoinedRoomChannels,
  getTaQueue,
  isTa,
  giveConsent,
  revokeAndDelete,
} from "@classync/core";
import { conceptPickerScreen, consentScreen, taskDetailScreen, taskListScreen } from "../ui/tasks.js";
import { setStatus } from "@classync/core";
import { webUrl } from "../config.js";
import { revokeStudentRoomAccess } from "../topicRooms.js";
import { handleRoomButton, handleRoomModal, handleRoomSelect } from "./rooms.js";
import { contextForItem, type TaskComponent } from "./taskContext.js";
import { handleHelpButton, openConceptModal, saveNewConcept, saveStuck } from "./tasksStuck.js";

async function refreshDetail(interaction: ButtonInteraction | StringSelectMenuInteraction, itemId: string, notice?: string) {
  const context = await contextForItem(itemId, interaction.user.id, interaction.guildId);
  if (!context) return interaction.followUp({ content: "Open `/tasks` in the class server first.", flags: MessageFlags.Ephemeral });
  return interaction.editReply(await taskDetailScreen(itemId, context.student, notice));
}

async function handleConsent(interaction: ButtonInteraction): Promise<void> {
  if (!interaction.guildId) {
    await interaction.followUp({ content: "Consent must be given in the class server.", flags: MessageFlags.Ephemeral });
    return;
  }
  const guild = await getGuildByDiscordId(interaction.guildId);
  if (!guild) {
    await interaction.followUp({ content: "A TA must run `/setup channel` first.", flags: MessageFlags.Ephemeral });
    return;
  }
  if (await isTa(interaction.guildId, interaction.user.id)) {
    await interaction.editReply({ content: "Registered TAs cannot use student task flows.", components: [] });
    return;
  }
  if (interaction.customId.endsWith(":decline")) {
    await interaction.editReply({ content: "No problem. Classync will not store your data.", components: [] });
    return;
  }
  const student = await getOrCreateStudent(guild.id, interaction.user.id);
  await giveConsent(student.id);
  await interaction.editReply(await taskListScreen(guild.id, student));
}

async function handlePrivacy(interaction: ButtonInteraction): Promise<void> {
  if (!interaction.guildId) return;
  const guild = await getGuildByDiscordId(interaction.guildId);
  if (!guild) return;
  const student = await getConsentedStudent(guild.id, interaction.user.id);
  if (!student) {
    await interaction.followUp({ content: "Open `/tasks` to start using Classync.", flags: MessageFlags.Ephemeral });
    return;
  }
  if (interaction.customId === "task:privacy") {
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId("task:privacy-confirm").setLabel("Delete my data").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId("task:privacy-cancel").setLabel("Cancel").setStyle(ButtonStyle.Secondary),
    );
    await interaction.editReply({
      content: "Delete all of your statuses, room memberships, peer matches, and TA-help requests in this server, and revoke consent? This cannot be undone.",
      components: [row],
    });
    return;
  }
  if (interaction.customId === "task:privacy-confirm") {
    const channelIds = await getStudentJoinedRoomChannels(student.id);
    await revokeStudentRoomAccess(interaction.client, guild.discordGuildId, interaction.user.id, channelIds);
    await revokeAndDelete(student.id);
    await interaction.editReply({ content: "Your Classync data and room access in this server have been deleted and consent revoked.", components: [] });
    return;
  }
  await interaction.editReply(await taskListScreen(guild.id, student));
}

async function handlePanel(interaction: ButtonInteraction): Promise<void> {
  if (!interaction.guildId) return;
  const guild = await getGuildByDiscordId(interaction.guildId);
  if (!guild) return;
  if (interaction.customId === "task:panel-ta") {
    if (!await isTa(interaction.guildId, interaction.user.id)) {
      await interaction.editReply({ content: "Menu ini dikhususkan untuk Dosen & Asisten Dosen (TA) yang terdaftar." });
      return;
    }
    const queue = await getTaQueue(guild.id);
    await interaction.editReply({
      content: `🧑‍🏫 **TA Dashboard & Queue**\nAntrean saat ini: **${queue.length} topik**.\nGunakan command \`/ta queue\` untuk melihat antrean lengkap di Discord, atau [Buka Web Dashboard](${webUrl()}/g/${guild.id}).`,
    });
    return;
  }
  const student = await getConsentedStudent(guild.id, interaction.user.id);
  await interaction.editReply(student ? await taskListScreen(guild.id, student) : consentScreen());
}

async function handleButton(interaction: ButtonInteraction): Promise<void> {
  if (interaction.customId.startsWith("task:consent:")) return handleConsent(interaction);
  if (interaction.customId.startsWith("task:privacy")) return handlePrivacy(interaction);
  if (interaction.customId.startsWith("task:panel-")) return handlePanel(interaction);
  if (await handleRoomButton(interaction)) return;

  const [, action, itemId, state] = interaction.customId.split(":");
  if (!itemId) return;
  if (action === "help" || action === "help-confirm") return handleHelpButton(interaction, action, itemId, state);

  const context = await contextForItem(itemId, interaction.user.id, interaction.guildId);
  if (!context) return void await interaction.followUp({ content: "Open `/tasks` in the class server first.", flags: MessageFlags.Ephemeral });
  if (action === "back") await interaction.editReply(await taskListScreen(context.item.guildId, context.student));
  else if (action === "stuck") await interaction.editReply(await conceptPickerScreen(itemId));
  else if (action === "progress" || action === "done") {
    // PRD B2: private status only; nothing is revealed to anyone else.
    await setStatus(itemId, context.student.id, action === "done" ? "DONE" : "IN_PROGRESS");
    await interaction.editReply(await taskDetailScreen(itemId, context.student, action === "done" ? "✅ Marked done. Reminders for this task stop." : "🔵 Marked in progress."));
  }
}

async function handleSelect(interaction: StringSelectMenuInteraction): Promise<void> {
  if (interaction.customId === "task:choose") {
    await refreshDetail(interaction, interaction.values[0]);
    return;
  }
  if (await handleRoomSelect(interaction)) return;

  const [, action, itemId] = interaction.customId.split(":");
  if (action !== "concept" || !itemId) return;
  if (interaction.values[0] === "new") return openConceptModal(interaction, itemId);
  await saveStuck(interaction, itemId, interaction.values[0]);
}

async function handleModal(interaction: ModalSubmitInteraction): Promise<void> {
  if (await handleRoomModal(interaction)) return;
  const [, action, itemId] = interaction.customId.split(":");
  if (action !== "new-concept" || !itemId) return;
  await saveNewConcept(interaction, itemId);
}

export async function handleTaskInteraction(interaction: TaskComponent): Promise<boolean> {
  if (!interaction.customId.startsWith("task:")) return false;
  if (interaction.isModalSubmit()) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    await handleModal(interaction);
    return true;
  }
  if (
    interaction.isStringSelectMenu() &&
    (interaction.customId.startsWith("task:concept:") || interaction.customId.startsWith("task:room-concept:")) &&
    interaction.values[0] === "new"
  ) {
    await handleSelect(interaction);
    return true;
  }
  if (interaction.isButton() && interaction.customId.startsWith("task:panel-")) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    await handleButton(interaction);
    return true;
  }
  await interaction.deferUpdate();
  if (interaction.isButton()) await handleButton(interaction);
  else if (interaction.isStringSelectMenu()) await handleSelect(interaction);
  return true;
}
