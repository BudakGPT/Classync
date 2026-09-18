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
import { z } from "zod";
import { createHelpRequest, getConceptById, getMyStatus, getOrCreateConcept, normalizeLabel, setStatus } from "@classync/core";
import { stuckNotice, taskDetailScreen } from "../ui/tasks.js";
import { contextForItem, type TaskContext } from "./taskContext.js";
import { offerPeerHelp } from "./helper.js";

const labelSchema = z.string().trim().min(1).max(80);
const UNAVAILABLE = { content: "This task is unavailable.", flags: MessageFlags.Ephemeral } as const;

export async function openConceptModal(interaction: StringSelectMenuInteraction, itemId: string): Promise<void> {
  const modal = new ModalBuilder().setCustomId(`task:new-concept:${itemId}`).setTitle("What are you stuck on?");
  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder().setCustomId("label").setLabel("Concept label").setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(80),
    ),
  );
  await interaction.showModal(modal);
}

/** Existing concept chosen from the select menu. */
export async function saveStuck(interaction: StringSelectMenuInteraction, itemId: string, conceptId: string): Promise<void> {
  const ctx = await contextForItem(itemId, interaction.user.id, interaction.guildId);
  if (!ctx) return void (await interaction.followUp(UNAVAILABLE));
  const concept = await getConceptById(conceptId);
  if (!concept || concept.itemId !== itemId) return void (await interaction.followUp({ content: "That concept is unavailable.", flags: MessageFlags.Ephemeral }));
  await interaction.editReply(await persistStuck(interaction, ctx, concept));
}

/** New concept typed in the modal. */
export async function saveNewConcept(interaction: ModalSubmitInteraction, itemId: string): Promise<void> {
  const ctx = await contextForItem(itemId, interaction.user.id, interaction.guildId);
  if (!ctx) return void (await interaction.editReply({ content: UNAVAILABLE.content, components: [] }));
  const raw = labelSchema.safeParse(interaction.fields.getTextInputValue("label"));
  if (!raw.success || normalizeLabel(raw.data).length === 0) {
    await interaction.editReply({ content: "Enter at least one letter or number for the concept.", components: [] });
    return;
  }
  const concept = await getOrCreateConcept(itemId, raw.data);
  await interaction.editReply(await persistStuck(interaction, ctx, concept));
}

/** The stuck handler: save status, compose threshold notice, then try the peer-help offer. */
async function persistStuck(
  interaction: StringSelectMenuInteraction | ModalSubmitInteraction,
  ctx: TaskContext,
  concept: { id: string; label: string },
) {
  await setStatus(ctx.item.id, ctx.student.id, "STUCK", concept.id);
  const notice = await stuckNotice(concept.id);
  const peerLine = await offerPeerHelp(interaction.client, ctx.item, concept, ctx.student);
  return taskDetailScreen(ctx.item.id, ctx.student, [notice, peerLine].filter(Boolean).join("\n"));
}

export async function handleHelpButton(interaction: ButtonInteraction, action: string, itemId: string, conceptId?: string): Promise<void> {
  const ctx = await contextForItem(itemId, interaction.user.id, interaction.guildId);
  if (!ctx) return void (await interaction.followUp(UNAVAILABLE));
  if (action === "help") {
    const status = await getMyStatus(itemId, ctx.student.id);
    if (!status?.conceptId) {
      await interaction.editReply(await taskDetailScreen(ctx.item.id, ctx.student, "Choose **Stuck** and a concept before requesting TA help."));
      return;
    }
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(`task:help-confirm:${itemId}:${status.conceptId}`).setLabel("Confirm request").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(`task:detail:${itemId}`).setLabel("Cancel").setStyle(ButtonStyle.Secondary),
    );
    await interaction.editReply({ content: "Your name will be visible to the TA for this item only. Do you want to request help?", components: [row] });
    return;
  }
  const concept = conceptId ? await getConceptById(conceptId) : null;
  if (!concept || concept.itemId !== itemId) return void (await interaction.followUp({ content: "That concept is unavailable.", flags: MessageFlags.Ephemeral }));
  await createHelpRequest(concept.id, ctx.student.id, await requesterDisplayName(interaction));
  await interaction.editReply(await taskDetailScreen(ctx.item.id, ctx.student, "Your TA-help request was sent."));
}

/** Guild display name at confirmation time; falls back to the global name when tapped from a DM. */
async function requesterDisplayName(interaction: ButtonInteraction): Promise<string> {
  const member = interaction.guild ? await interaction.guild.members.fetch(interaction.user.id).catch(() => null) : null;
  return member?.displayName ?? interaction.user.globalName ?? interaction.user.username;
}
