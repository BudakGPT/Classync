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
  getItemById,
  getOrCreateConcept,
  getOrCreateStudent,
  getConceptById,
  giveConsent,
  normalizeLabel,
  revokeAndDelete,
  setStatus,
} from "@classync/core";
import { conceptPickerScreen, consentScreen, stuckNotice, taskDetailScreen, taskListScreen } from "../ui/tasks.js";

type TaskComponent = ButtonInteraction | StringSelectMenuInteraction | ModalSubmitInteraction;

async function contextForItem(itemId: string, userId: string, interactionGuildId: string | null) {
  const item = await getItemById(itemId);
  if (!item || (interactionGuildId !== null && item.guildId !== interactionGuildId)) return null;
  const student = await getConsentedStudent(item.guildId, userId);
  return student ? { item, student } : null;
}

async function refreshDetail(interaction: ButtonInteraction | StringSelectMenuInteraction, itemId: string, notice?: string) {
  const context = await contextForItem(itemId, interaction.user.id, interaction.guildId);
  if (!context) return interaction.reply({ content: "Open `/tasks` in the class server first.", flags: MessageFlags.Ephemeral });
  return interaction.update(await taskDetailScreen(itemId, context.student, notice));
}

async function saveStuck(interaction: StringSelectMenuInteraction, itemId: string, conceptId: string) {
  const context = await contextForItem(itemId, interaction.user.id, interaction.guildId);
  if (!context) return interaction.reply({ content: "This task is unavailable.", flags: MessageFlags.Ephemeral });
  const concept = await getConceptById(conceptId);
  if (!concept || concept.itemId !== itemId) return interaction.reply({ content: "That concept is unavailable.", flags: MessageFlags.Ephemeral });
  await setStatus(itemId, context.student.id, "STUCK", concept.id);
  return interaction.update(await taskDetailScreen(itemId, context.student, await stuckNotice(concept.id)));
}

async function handleConsent(interaction: ButtonInteraction): Promise<void> {
  if (!interaction.guildId) {
    await interaction.reply({ content: "Consent must be given in the class server.", flags: MessageFlags.Ephemeral });
    return;
  }
  if (interaction.customId.endsWith(":decline")) {
    await interaction.update({ content: "No problem. Classync will not store your data.", components: [] });
    return;
  }
  const student = await getOrCreateStudent(interaction.guildId, interaction.user.id);
  await giveConsent(student.id);
  await interaction.update(await taskListScreen(interaction.guildId, student));
}

async function handlePrivacy(interaction: ButtonInteraction): Promise<void> {
  if (!interaction.guildId) return;
  const student = await getConsentedStudent(interaction.guildId, interaction.user.id);
  if (!student) {
    await interaction.reply({ content: "Open `/tasks` to start using Classync.", flags: MessageFlags.Ephemeral });
    return;
  }
  if (interaction.customId === "task:privacy") {
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId("task:privacy-confirm").setLabel("Delete my data").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId("task:privacy-cancel").setLabel("Cancel").setStyle(ButtonStyle.Secondary),
    );
    await interaction.update({
      content: "Delete all of your statuses and TA-help requests in this server, and revoke consent? This cannot be undone.",
      components: [row],
    });
    return;
  }
  if (interaction.customId === "task:privacy-confirm") {
    await revokeAndDelete(student.id);
    await interaction.update({ content: "Your Classync data in this server has been deleted and consent revoked.", components: [] });
    return;
  }
  await interaction.update(await taskListScreen(interaction.guildId, student));
}

async function handleButton(interaction: ButtonInteraction): Promise<void> {
  if (interaction.customId.startsWith("task:consent:")) return handleConsent(interaction);
  if (interaction.customId.startsWith("task:privacy")) return handlePrivacy(interaction);
  const [, action, itemId, state] = interaction.customId.split(":");
  if (!itemId) return;
  const context = await contextForItem(itemId, interaction.user.id, interaction.guildId);
  if (!context) return void await interaction.reply({ content: "Open `/tasks` in the class server first.", flags: MessageFlags.Ephemeral });
  if (action === "back") return void await interaction.update(await taskListScreen(context.item.guildId, context.student));
  if (action === "status" && (state === "IN_PROGRESS" || state === "DONE")) {
    await setStatus(itemId, context.student.id, state);
    await interaction.update(await taskDetailScreen(itemId, context.student, "Saved privately."));
    return;
  }
  if (action === "stuck") {
    await interaction.update(await conceptPickerScreen(itemId));
    return;
  }
  if (action === "help") {
    const status = await import("@classync/core").then(({ getMyStatus }) => getMyStatus(itemId, context.student.id));
    if (!status?.conceptId) {
      await interaction.update(await taskDetailScreen(itemId, context.student, "Choose **Stuck** and a concept before requesting TA help."));
      return;
    }
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(`task:help-confirm:${itemId}:${status.conceptId}`).setLabel("Confirm request").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(`task:back:${itemId}`).setLabel("Cancel").setStyle(ButtonStyle.Secondary),
    );
    await interaction.update({
      content: "Your name will be visible to the TA for this item only. Do you want to request help?",
      components: [row],
    });
    return;
  }
  if (action === "help-confirm" && state) {
    const concept = await getConceptById(state);
    if (!concept || concept.itemId !== itemId) return void await interaction.reply({ content: "That concept is unavailable.", flags: MessageFlags.Ephemeral });
    await createHelpRequest(concept.id, context.student.id);
    await interaction.update(await taskDetailScreen(itemId, context.student, "Your TA-help request was sent."));
  }
}

async function handleSelect(interaction: StringSelectMenuInteraction): Promise<void> {
  if (interaction.customId === "task:choose") {
    await refreshDetail(interaction, interaction.values[0]);
    return;
  }
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
  const [, action, itemId] = interaction.customId.split(":");
  if (action !== "new-concept" || !itemId) return;
  const context = await contextForItem(itemId, interaction.user.id, interaction.guildId);
  if (!context) return void await interaction.reply({ content: "This task is unavailable.", flags: MessageFlags.Ephemeral });
  const rawLabel = interaction.fields.getTextInputValue("label");
  if (normalizeLabel(rawLabel).length === 0) {
    await interaction.reply({ content: "Enter at least one letter or number for the concept.", flags: MessageFlags.Ephemeral });
    return;
  }
  const concept = await getOrCreateConcept(itemId, rawLabel);
  await setStatus(itemId, context.student.id, "STUCK", concept.id);
  await interaction.reply(await taskDetailScreen(itemId, context.student, await stuckNotice(concept.id)));
}

export async function handleTaskInteraction(interaction: TaskComponent): Promise<boolean> {
  if (!interaction.customId.startsWith("task:")) return false;
  if (interaction.isButton()) await handleButton(interaction);
  else if (interaction.isStringSelectMenu()) await handleSelect(interaction);
  else if (interaction.isModalSubmit()) await handleModal(interaction);
  return true;
}

export async function handleReminderInteraction(interaction: ButtonInteraction): Promise<boolean> {
  if (!interaction.customId.startsWith("reminder:")) return false;
  const [, action, itemId] = interaction.customId.split(":");
  if (!itemId) return true;
  const context = await contextForItem(itemId, interaction.user.id, interaction.guildId);
  if (!context) {
    await interaction.reply({ content: "Open `/tasks` in the class server to update this task.", flags: MessageFlags.Ephemeral });
    return true;
  }
  if (action === "done") {
    await setStatus(itemId, context.student.id, "DONE");
    await interaction.update({ content: "✅ Marked as done.", components: [] });
  } else if (action === "stuck") {
    await interaction.update(await conceptPickerScreen(itemId));
  }
  return true;
}
