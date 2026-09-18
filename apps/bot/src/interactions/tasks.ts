import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  type ButtonInteraction,
  type StringSelectMenuInteraction,
} from "discord.js";
import { z } from "zod";
import { getGuildByDiscordId, getOrCreateStudent, giveConsent, revokeAndDelete, setStatus } from "@classync/core";
import { conceptPickerScreen, taskDetailScreen, taskListScreen } from "../ui/tasks";
import { contextForItem, type TaskComponent } from "./taskContext";
import { handleHelpButton, openConceptModal, saveNewConcept, saveStuck } from "./tasksStuck";

const customIdSchema = z.array(z.string().min(1).max(64)).min(2).max(4);
const actionSchema = z.enum([
  "consent", "privacy", "privacy-confirm", "privacy-cancel", "choose", "status",
  "stuck", "back", "concept", "new-concept", "help", "help-confirm",
]);
const stateSchema = z.enum(["IN_PROGRESS", "DONE"]);

const NOT_READY = { content: "Open `/tasks` in the class server first.", flags: MessageFlags.Ephemeral } as const;

/** Entry for every `task:*` button, select and modal. Custom IDs are zod-validated before dispatch. */
export async function handleTaskInteraction(interaction: TaskComponent): Promise<void> {
  const parts = customIdSchema.parse(interaction.customId.split(":"));
  const action = actionSchema.parse(parts[1]);
  if (interaction.isModalSubmit()) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    if (action === "new-concept") await saveNewConcept(interaction, parts[2] ?? "");
    return;
  }
  if (interaction.isStringSelectMenu() && action === "concept" && interaction.values[0] === "new") {
    await openConceptModal(interaction, parts[2] ?? "");
    return;
  }
  await interaction.deferUpdate();
  if (interaction.isStringSelectMenu()) {
    if (action === "choose") await showDetail(interaction, interaction.values[0]);
    else if (action === "concept") await saveStuck(interaction, parts[2] ?? "", interaction.values[0]);
    return;
  }
  if (action === "consent") await handleConsent(interaction, parts[2] === "agree");
  else if (action.startsWith("privacy")) await handlePrivacy(interaction, action);
  else if (action === "help" || action === "help-confirm") await handleHelpButton(interaction, action, parts[2] ?? "", parts[3]);
  else await handleItemButton(interaction, action, parts[2] ?? "", parts[3]);
}

async function showDetail(interaction: StringSelectMenuInteraction, itemId: string): Promise<void> {
  const ctx = await contextForItem(itemId, interaction);
  if (!ctx) return void (await interaction.followUp(NOT_READY));
  await interaction.editReply(await taskDetailScreen(ctx.item, ctx.student.id));
}

async function handleItemButton(interaction: ButtonInteraction, action: string, itemId: string, arg?: string): Promise<void> {
  const state = action === "status" ? stateSchema.parse(arg) : null; // validate before any DB call
  const ctx = await contextForItem(itemId, interaction);
  if (!ctx) return void (await interaction.followUp(NOT_READY));
  if (action === "back") {
    await interaction.editReply(await taskListScreen(ctx.item.guildId, ctx.student));
  } else if (action === "stuck") {
    await interaction.editReply(await conceptPickerScreen(ctx.item.id));
  } else if (state) {
    await setStatus(ctx.item.id, ctx.student.id, state);
    await interaction.editReply(await taskDetailScreen(ctx.item, ctx.student.id, "Saved privately."));
  }
}

async function handleConsent(interaction: ButtonInteraction, agreed: boolean): Promise<void> {
  const guild = interaction.guildId ? await getGuildByDiscordId(interaction.guildId) : null;
  if (!guild) return void (await interaction.followUp({ content: "A TA must run `/setup channel` first.", flags: MessageFlags.Ephemeral }));
  if (!agreed) {
    await interaction.editReply({ content: "No problem! Come back anytime.", components: [] });
    return;
  }
  const student = await getOrCreateStudent(guild.id, interaction.user.id);
  await giveConsent(student.id);
  await interaction.editReply(await taskListScreen(guild.id, student));
}

async function handlePrivacy(interaction: ButtonInteraction, action: string): Promise<void> {
  const guild = interaction.guildId ? await getGuildByDiscordId(interaction.guildId) : null;
  if (!guild) return void (await interaction.followUp(NOT_READY));
  const student = await getOrCreateStudent(guild.id, interaction.user.id);
  if (action === "privacy") {
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId("task:privacy-confirm").setLabel("Delete my data").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId("task:privacy-cancel").setLabel("Cancel").setStyle(ButtonStyle.Secondary)
    );
    await interaction.editReply({
      content: "Delete all your statuses, TA-help requests and peer matches in this server, and revoke consent? This cannot be undone.",
      components: [row],
    });
  } else if (action === "privacy-confirm") {
    await revokeAndDelete(student.id);
    await interaction.editReply({ content: "🔒 Your Classync data in this server has been deleted and consent revoked.", components: [] });
  } else {
    await interaction.editReply(await taskListScreen(guild.id, student));
  }
}
