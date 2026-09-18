import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  type ButtonInteraction,
  type ModalSubmitInteraction,
  type StringSelectMenuInteraction,
} from "discord.js";
import {
  getConceptById,
  getConsentedStudent,
  getGuildByDiscordId,
  getItemById,
  getOrCreateConcept,
  isTa,
  normalizeLabel,
} from "@classync/core";
import { roomConfirmScreen, roomPickerScreen, taskDetailScreen } from "../ui/tasks.js";
import { channelUrl, ensurePrivateTopicRoom } from "../topicRooms.js";

async function contextForItem(itemId: string, userId: string, interactionGuildId: string | null) {
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

export async function handleRoomButton(interaction: ButtonInteraction): Promise<boolean> {
  const [prefix, action, itemId, conceptId] = interaction.customId.split(":");
  if (prefix !== "task" || !itemId) return false;

  if (action === "room") {
    const context = await contextForItem(itemId, interaction.user.id, interaction.guildId);
    if (!context) {
      await interaction.followUp({ content: "Open `/tasks` in the class server first.", flags: MessageFlags.Ephemeral });
      return true;
    }
    await interaction.editReply(await roomPickerScreen(itemId));
    return true;
  }

  if (action === "detail") {
    const context = await contextForItem(itemId, interaction.user.id, interaction.guildId);
    if (!context) {
      await interaction.followUp({ content: "This task is unavailable.", flags: MessageFlags.Ephemeral });
      return true;
    }
    await interaction.editReply(await taskDetailScreen(itemId, context.student));
    return true;
  }

  if (action === "room-confirm" && conceptId) {
    const context = await contextForItem(itemId, interaction.user.id, interaction.guildId);
    if (!context || !interaction.guildId) {
      await interaction.followUp({ content: "This task is unavailable.", flags: MessageFlags.Ephemeral });
      return true;
    }
    const guild = await getGuildByDiscordId(interaction.guildId);
    const concept = await getConceptById(conceptId);
    if (!guild || !concept) {
      await interaction.editReply({ content: "That concept is unavailable.", components: [] });
      return true;
    }

    const channelId = await ensurePrivateTopicRoom(
      interaction.client,
      guild,
      context.item,
      concept,
      { id: context.student.id, discordUserId: interaction.user.id }
    );

    if (!channelId) {
      await interaction.editReply({
        content: "Could not create or access the room. Please contact a TA.",
        components: [],
      });
      return true;
    }

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setLabel("Open Discussion Room").setStyle(ButtonStyle.Link).setURL(channelUrl(interaction.guildId, channelId)),
      new ButtonBuilder().setCustomId(`task:detail:${itemId}`).setLabel("Back to Task").setStyle(ButtonStyle.Secondary),
    );

    await interaction.editReply({
      content: `✅ You have entered the discussion room for **${concept.label}**: <#${channelId}>\n\nClick below to open the room.`,
      components: [row],
    });
    return true;
  }

  return false;
}

export async function handleRoomSelect(interaction: StringSelectMenuInteraction): Promise<boolean> {
  const [, action, itemId] = interaction.customId.split(":");
  if (action !== "room-concept" || !itemId) return false;

  const context = await contextForItem(itemId, interaction.user.id, interaction.guildId);
  if (!context) {
    await interaction.followUp({ content: "This task is unavailable.", flags: MessageFlags.Ephemeral });
    return true;
  }

  const selectedValue = interaction.values[0];
  if (selectedValue === "new") {
    const modal = new ModalBuilder()
      .setCustomId(`task:new-room-concept:${itemId}`)
      .setTitle("Create Concept Room");
    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("label")
          .setLabel("Concept or Topic")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(80)
          .setPlaceholder("e.g. Dockerfile syntax, memory leak"),
      )
    );
    await interaction.showModal(modal);
    return true;
  }

  const concept = await getConceptById(selectedValue);
  if (!concept || concept.itemId !== itemId) {
    await interaction.followUp({ content: "Concept not found.", flags: MessageFlags.Ephemeral });
    return true;
  }

  await interaction.editReply(roomConfirmScreen(itemId, context.item.title, concept.id, concept.label));
  return true;
}

export async function handleRoomModal(interaction: ModalSubmitInteraction): Promise<boolean> {
  const [, action, itemId] = interaction.customId.split(":");
  if (action !== "new-room-concept" || !itemId) return false;

  const context = await contextForItem(itemId, interaction.user.id, interaction.guildId);
  if (!context) {
    await interaction.editReply({ content: "This task is unavailable.", components: [] });
    return true;
  }

  const rawLabel = interaction.fields.getTextInputValue("label");
  if (normalizeLabel(rawLabel).length === 0) {
    await interaction.editReply({ content: "Enter at least one alphanumeric character for the concept.", components: [] });
    return true;
  }

  const concept = await getOrCreateConcept(itemId, rawLabel);
  await interaction.editReply(roomConfirmScreen(itemId, context.item.title, concept.id, concept.label));
  return true;
}
