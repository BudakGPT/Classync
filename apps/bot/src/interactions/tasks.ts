import {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  type ButtonInteraction,
  type ModalSubmitInteraction,
  type StringSelectMenuInteraction,
} from "discord.js";
import {
  createHelpRequest,
  getConsentedStudent,
  getGuildByDiscordId,
  getItemById,
  getOrCreateConcept,
  getOrCreateStudent,
  getConceptById,
  getStudentJoinedRoomChannels,
  getTaQueue,
  isTa,
  giveConsent,
  normalizeLabel,
  revokeAndDelete,
  setStatus,
} from "@classync/core";
import { conceptPickerScreen, consentScreen, taskDetailScreen, taskListScreen, stuckNotice } from "../ui/tasks.js";
import { revokeStudentRoomAccess } from "../topicRooms.js";
import { handleRoomButton, handleRoomModal, handleRoomSelect } from "./rooms.js";

type TaskComponent = ButtonInteraction | StringSelectMenuInteraction | ModalSubmitInteraction;

export async function contextForItem(itemId: string, userId: string, interactionGuildId: string | null) {
  const item = await getItemById(itemId);
  if (!item) return null;
  if (interactionGuildId !== null) {
    const guild = await getGuildByDiscordId(interactionGuildId);
    if (!guild || item.guildId !== guild.id) return null;
    if (await isTa(interactionGuildId, userId)) return null;
  }
  if (item.dueAt && item.dueAt.getTime() < Date.now()) return null;
  const student = await getConsentedStudent(item.guildId, userId);
  return student ? { item, student } : null;
}

async function refreshDetail(interaction: ButtonInteraction | StringSelectMenuInteraction, itemId: string, notice?: string) {
  const context = await contextForItem(itemId, interaction.user.id, interaction.guildId);
  if (!context) return interaction.followUp({ content: "Open `/tasks` in the class server first.", flags: MessageFlags.Ephemeral });
  return interaction.editReply(await taskDetailScreen(itemId, context.student, notice));
}

async function saveStuck(interaction: StringSelectMenuInteraction, itemId: string, conceptId: string) {
  const context = await contextForItem(itemId, interaction.user.id, interaction.guildId);
  if (!context) return interaction.followUp({ content: "This task is unavailable.", flags: MessageFlags.Ephemeral });
  const concept = await getConceptById(conceptId);
  if (!concept || concept.itemId !== itemId) return interaction.followUp({ content: "That concept is unavailable.", flags: MessageFlags.Ephemeral });
  await setStatus(itemId, context.student.id, "STUCK", concept.id);
  return interaction.editReply(await taskDetailScreen(itemId, context.student, await stuckNotice(concept.id)));
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
      content: "Delete all of your statuses, room memberships, and TA-help requests in this server, and revoke consent? This cannot be undone.",
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

async function handleButton(interaction: ButtonInteraction): Promise<void> {
  if (interaction.customId.startsWith("task:consent:")) return handleConsent(interaction);
  if (interaction.customId.startsWith("task:privacy")) return handlePrivacy(interaction);

  if (interaction.customId === "task:panel-tasks" || interaction.customId === "task:panel-ask") {
    if (!interaction.guildId) return;
    const guild = await getGuildByDiscordId(interaction.guildId);
    if (!guild) return;
    const student = await getConsentedStudent(guild.id, interaction.user.id);
    if (!student) {
      await interaction.editReply(consentScreen());
      return;
    }
    await interaction.editReply(await taskListScreen(guild.id, student));
    return;
  }

  if (interaction.customId === "task:panel-ta") {
    if (!interaction.guildId) return;
    if (!await isTa(interaction.guildId, interaction.user.id)) {
      await interaction.editReply({ content: "Menu ini dikhususkan untuk Dosen & Asisten Dosen (TA) yang terdaftar." });
      return;
    }
    const guild = await getGuildByDiscordId(interaction.guildId);
    const queue = guild ? await getTaQueue(guild.id) : [];
    await interaction.editReply({
      content: `🧑‍🏫 **TA Dashboard & Queue**\nAntrean saat ini: **${queue.length} topik**.\nGunakan command \`/ta queue\` untuk melihat antrean lengkap di Discord, atau [Buka Web Dashboard](http://localhost:3000/g/${guild?.id}).`,
    });
    return;
  }

  if (await handleRoomButton(interaction)) return;

  const [, action, itemId, state] = interaction.customId.split(":");
  if (!itemId) return;
  const context = await contextForItem(itemId, interaction.user.id, interaction.guildId);
  if (!context) return void await interaction.followUp({ content: "Open `/tasks` in the class server first.", flags: MessageFlags.Ephemeral });

  if (action === "back") return void await interaction.editReply(await taskListScreen(context.item.guildId, context.student));
  if (action === "stuck") {
    await interaction.editReply(await conceptPickerScreen(itemId));
    return;
  }
  if (action === "help") {
    const status = await import("@classync/core").then(({ getMyStatus }) => getMyStatus(itemId, context.student.id));
    if (!status?.conceptId) {
      await interaction.editReply(await taskDetailScreen(itemId, context.student, "Choose **Stuck** and a concept before requesting TA help."));
      return;
    }
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(`task:help-confirm:${itemId}:${status.conceptId}`).setLabel("Confirm request").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(`task:detail:${itemId}`).setLabel("Cancel").setStyle(ButtonStyle.Secondary),
    );
    await interaction.editReply({
      content: "Your name will be visible to the TA for this item only. Do you want to request help?",
      components: [row],
    });
    return;
  }
  if (action === "help-confirm" && state) {
    const concept = await getConceptById(state);
    if (!concept || concept.itemId !== itemId) return void await interaction.followUp({ content: "That concept is unavailable.", flags: MessageFlags.Ephemeral });
    await createHelpRequest(concept.id, context.student.id);
    await interaction.editReply(await taskDetailScreen(itemId, context.student, "Your TA-help request was sent."));
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
  if (interaction.values[0] === "new") {
    const modal = new ModalBuilder().setCustomId(`task:new-concept:${itemId}`).setTitle("What are you stuck on?");
    modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder().setCustomId("label").setLabel("Concept label").setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(80),
    ));
    await interaction.showModal(modal);
    return;
  }
  await saveStuck(interaction, itemId, interaction.values[0]);
}

async function handleModal(interaction: ModalSubmitInteraction): Promise<void> {
  if (await handleRoomModal(interaction)) return;

  const [, action, itemId] = interaction.customId.split(":");
  if (action !== "new-concept" || !itemId) return;
  const context = await contextForItem(itemId, interaction.user.id, interaction.guildId);
  if (!context) return void await interaction.editReply({ content: "This task is unavailable.", components: [] });
  const rawLabel = interaction.fields.getTextInputValue("label");
  if (normalizeLabel(rawLabel).length === 0) {
    await interaction.editReply({ content: "Enter at least one letter or number for the concept.", components: [] });
    return;
  }
  const concept = await getOrCreateConcept(itemId, rawLabel);
  await setStatus(itemId, context.student.id, "STUCK", concept.id);
  await interaction.editReply(await taskDetailScreen(itemId, context.student, await stuckNotice(concept.id)));
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

