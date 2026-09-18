import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from "discord.js";
import {
  getConceptsForItem,
  getItemsByGuild,
  getItemById,
  getLatestAnswerForConcept,
  getMyStatus,
  getMyStatusMap,
  getStuckCount,
} from "@classync/core";

/** Structural types so the bot never imports @prisma/client. */
export type StudentRef = { id: string; helperOptIn: boolean };
export type ItemRef = { id: string; guildId: string; title: string; kind: string; dueAt: Date | null };

const statusEmoji: Record<string, string> = {
  NONE: "⚪",
  IN_PROGRESS: "🔵",
  DONE: "✅",
  STUCK: "🔴",
};

function truncate(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}

export function consentScreen() {
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId("task:consent:agree").setLabel("I agree").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("task:consent:decline").setLabel("No thanks").setStyle(ButtonStyle.Secondary),
  );
  return {
    content: [
      "## Your privacy comes first",
      "Classync stores your Discord ID, your private task statuses, and any TA-help requests or concept rooms you join.",
      "Your statuses are visible only to you. When you join a private concept room, all members and TAs in that room can see your Discord identity and messages. You can delete your data anytime with **Privacy**.",
      "If you opt in to help classmates, other students may be told you finished an item. Your name is never shown unless you reveal it.",
    ].join("\n\n"),
    components: [row],
  };
}

function privacyRow(student: StudentRef) {
  const helper = student.helperOptIn
    ? new ButtonBuilder().setCustomId("helper:optout").setLabel("🤝 Help classmates: on").setStyle(ButtonStyle.Success)
    : new ButtonBuilder().setCustomId("helper:optin").setLabel("🤝 Help classmates: off").setStyle(ButtonStyle.Secondary);
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    helper,
    new ButtonBuilder().setCustomId("task:privacy").setLabel("Privacy / delete my data").setStyle(ButtonStyle.Danger),
  );
}

export async function taskListScreen(guildId: string, student: StudentRef) {
  const items = await getItemsByGuild(guildId);
  if (items.length === 0) {
    return { content: "## Your tasks\nNo tasks yet. Ask a TA to add one.", components: [privacyRow(student)] };
  }

  const statuses = await getMyStatusMap(items.map((item) => item.id), student.id);
  const lines = items.map((item) => {
    const state = statuses.get(item.id)?.state ?? "NONE";
    const due = item.dueAt ? ` · Due <t:${Math.floor(item.dueAt.getTime() / 1000)}:R>` : "";
    return `${statusEmoji[state] ?? "⚪"} **${item.title}** · ${item.kind}${due} · \`${state}\``;
  });
  const picker = new StringSelectMenuBuilder()
    .setCustomId("task:choose")
    .setPlaceholder("Choose a task to update")
    .addOptions(items.map((item) => new StringSelectMenuOptionBuilder()
      .setLabel(truncate(item.title, 100))
      .setDescription(`Status: ${statuses.get(item.id)?.state ?? "NONE"}`)
      .setValue(item.id)));

  return {
    content: `## Your tasks\n${lines.join("\n")}\n\nChoose a task below to update its status or enter a concept room.`,
    components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(picker), privacyRow(student)],
  };
}

export async function taskDetailScreen(itemId: string, student: StudentRef, notice?: string) {
  const item = await getItemById(itemId);
  if (!item) return { content: "That task no longer exists.", components: [] };
  const status = await getMyStatus(item.id, student.id);
  const state = status?.state ?? "NONE";
  const due = item.dueAt ? `<t:${Math.floor(item.dueAt.getTime() / 1000)}:F>` : "No due date";

  const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(`task:stuck:${item.id}`).setLabel("Stuck").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId(`task:room:${item.id}`).setLabel("Ask / Join Room").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`task:help:${item.id}`).setLabel("Request TA help").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`task:back:${item.id}`).setLabel("Back").setStyle(ButtonStyle.Secondary),
  );

  return {
    content: [
      `## ${item.title}`,
      `**Type:** ${item.kind}  |  **Due:** ${due}`,
      `**Your private status:** ${statusEmoji[state] ?? "⚪"} ${state}`,
      notice ? `\n${notice}` : "",
    ].join("\n"),
    components: [actionRow],
  };
}

export async function conceptPickerScreen(itemId: string) {
  const concepts = await getConceptsForItem(itemId);
  const options = concepts.slice(0, 24).map((concept) => new StringSelectMenuOptionBuilder()
    .setLabel(truncate(concept.label, 100))
    .setValue(concept.id));
  options.push(new StringSelectMenuOptionBuilder().setLabel("Type a new concept").setValue("new"));
  const picker = new StringSelectMenuBuilder()
    .setCustomId(`task:concept:${itemId}`)
    .setPlaceholder("What are you stuck on?")
    .addOptions(options);
  const back = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(`task:detail:${itemId}`).setLabel("Back").setStyle(ButtonStyle.Secondary),
  );
  return {
    content: "Choose an existing concept or type a new one. This saves your Stuck status privately and offers you to a classmate who finished it.",
    components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(picker), back],
  };
}

export async function roomPickerScreen(itemId: string) {
  const concepts = await getConceptsForItem(itemId);
  const options = concepts.slice(0, 24).map((concept) => new StringSelectMenuOptionBuilder()
    .setLabel(truncate(concept.label, 100))
    .setValue(concept.id));
  options.push(new StringSelectMenuOptionBuilder().setLabel("Type a new concept...").setValue("new"));
  const picker = new StringSelectMenuBuilder()
    .setCustomId(`task:room-concept:${itemId}`)
    .setPlaceholder("Which concept room do you want to enter?")
    .addOptions(options);
  const back = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(`task:detail:${itemId}`).setLabel("Back").setStyle(ButtonStyle.Secondary),
  );
  return {
    content: "## Select a Concept Room\nChoose a concept to enter or create its private discussion room.",
    components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(picker), back],
  };
}

export function roomConfirmScreen(itemId: string, itemTitle: string, conceptId: string, conceptLabel: string) {
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(`task:room-confirm:${itemId}:${conceptId}`).setLabel("Enter Room").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`task:detail:${itemId}`).setLabel("Cancel").setStyle(ButtonStyle.Secondary),
  );
  return {
    content: [
      `## ⚠️ Private Discussion Room: ${conceptLabel}`,
      `**Task:** ${itemTitle}`,
      `• All students and TAs in this room can see your Discord username, avatar, and messages.`,
      `• Registered TAs are notified privately of new questions in this room.`,
      `\nDo you want to enter this discussion room?`,
    ].join("\n"),
    components: [row],
  };
}

/** Threshold message after saving Stuck: count only when >= 5 reporters, plus any stored TA answer. */
export async function stuckNotice(conceptId: string): Promise<string> {
  const count = await getStuckCount(conceptId);
  const answer = await getLatestAnswerForConcept(conceptId);
  const countLine = count === null ? "Saved privately." : `🔴 **${count} others flagged this.**`;
  const answerLine = answer ? `\n\n**A TA already answered this topic:**\n${truncate(answer.body, 1_200)}` : "";
  return `${countLine} You can click **Ask / Join Room** to enter the discussion room.${answerLine}`;
}
