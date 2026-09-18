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
import { stuckNotice, taskDetailScreen } from "../ui/tasks";
import { contextForItem, type TaskContext } from "./taskContext";
import { offerPeerHelp } from "./helper";

const labelSchema = z.string().trim().min(1).max(80);
const UNAVAILABLE = { content: "This task is unavailable.", flags: MessageFlags.Ephemeral } as const;

export async function openConceptModal(interaction: StringSelectMenuInteraction, itemId: string): Promise<void> {
  const modal = new ModalBuilder().setCustomId(`task:new-concept:${itemId}`).setTitle("What are you stuck on?");
  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder().setCustomId("label").setLabel("Concept label").setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(80)
    )
  );
  await interaction.showModal(modal);
}

/** Existing concept chosen from the select menu. */
export async function saveStuck(interaction: StringSelectMenuInteraction, itemId: string, conceptId: string): Promise<void> {
  const ctx = await contextForItem(itemId, interaction);
  if (!ctx) return void (await interaction.followUp(UNAVAILABLE));
  const concept = await getConceptById(conceptId);
  if (!concept || concept.itemId !== itemId) return void (await interaction.followUp({ content: "That label is unavailable.", flags: MessageFlags.Ephemeral }));
  await interaction.editReply(await persistStuck(interaction, ctx, concept));
}

/** New concept typed in the modal. */
export async function saveNewConcept(interaction: ModalSubmitInteraction, itemId: string): Promise<void> {
  const ctx = await contextForItem(itemId, interaction);
  if (!ctx) return void (await interaction.editReply({ content: UNAVAILABLE.content, components: [] }));
  const raw = labelSchema.safeParse(interaction.fields.getTextInputValue("label"));
  if (!raw.success || normalizeLabel(raw.data).length === 0) {
    await interaction.editReply({ content: "Enter at least one letter or number for the label.", components: [] });
    return;
  }
  const concept = await getOrCreateConcept(itemId, raw.data);
  await interaction.editReply(await persistStuck(interaction, ctx, concept));
}

/** The stuck handler: save status, compose threshold notice, then try the peer-help offer (handoff §4). */
async function persistStuck(
  interaction: StringSelectMenuInteraction | ModalSubmitInteraction,
  ctx: TaskContext,
  concept: { id: string; label: string }
) {
  await setStatus(ctx.item.id, ctx.student.id, "STUCK", concept.id);
  const notice = await stuckNotice(concept.id);
  const peerLine = await offerPeerHelp(interaction.client, ctx.item, concept, ctx.student);
  return taskDetailScreen(ctx.item, ctx.student.id, [notice, peerLine].filter(Boolean).join("\n"));
}

export async function handleHelpButton(interaction: ButtonInteraction, action: string, itemId: string, conceptId?: string): Promise<void> {
  const ctx = await contextForItem(itemId, interaction);
  if (!ctx) return void (await interaction.followUp(UNAVAILABLE));
  if (action === "help") {
    const status = await getMyStatus(itemId, ctx.student.id);
    if (!status?.conceptId) {
      await interaction.editReply(await taskDetailScreen(ctx.item, ctx.student.id, "Choose **Stuck** and a label before requesting TA help."));
      return;
    }
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(`task:help-confirm:${itemId}:${status.conceptId}`).setLabel("Confirm request").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(`task:back:${itemId}`).setLabel("Cancel").setStyle(ButtonStyle.Secondary)
    );
    await interaction.editReply({ content: "Your name will be visible to the TA for this item only. Request help?", components: [row] });
    return;
  }
  const concept = conceptId ? await getConceptById(conceptId) : null;
  if (!concept || concept.itemId !== itemId) return void (await interaction.followUp({ content: "That label is unavailable.", flags: MessageFlags.Ephemeral }));
  await createHelpRequest(concept.id, ctx.student.id);
  await interaction.editReply(await taskDetailScreen(ctx.item, ctx.student.id, "🙋 Your TA-help request was sent."));
}
