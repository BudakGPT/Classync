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
  getJoinableTopicRoom,
  getMyStatus,
  getMyStatusMap,
  getStuckCount,
} from "@classync/core";

type StudentRef = { id: string };

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
      "Classync stores your Discord ID, your private task statuses, and any TA-help requests you explicitly send.",
      "Your statuses are visible only to you. You can delete your data anytime with **Privacy**. Messages you voluntarily post in a Discord discussion cannot be deleted by Classync.",
    ].join("\n\n"),
    components: [row],
  };
}

export async function taskListScreen(guildId: string, student: StudentRef) {
  const items = await getItemsByGuild(guildId);
  const privacyRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId("task:privacy").setLabel("Privacy / delete my data").setStyle(ButtonStyle.Danger),
  );
  if (items.length === 0) {
    return { content: "## Your tasks\nNo tasks yet. Ask a TA to add one.", components: [privacyRow] };
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
    content: `## Your tasks\n${lines.join("\n")}\n\nChoose a task below to update its private status.`,
    components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(picker), privacyRow],
  };
}

export async function taskDetailScreen(itemId: string, student: StudentRef, notice?: string) {
  const item = await getItemById(itemId);
  if (!item) return { content: "That task no longer exists.", components: [] };
  const status = await getMyStatus(item.id, student.id);
  const topicRoom = status?.conceptId ? await getJoinableTopicRoom(status.conceptId) : null;
  const state = status?.state ?? "NONE";
  const due = item.dueAt ? `<t:${Math.floor(item.dueAt.getTime() / 1000)}:F>` : "No due date";
  const statusRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(`task:stuck:${item.id}`).setLabel("Stuck").setStyle(ButtonStyle.Danger),
  );
  const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(`task:help:${item.id}`).setLabel("Request TA help").setStyle(ButtonStyle.Secondary),
    ...(topicRoom ? [new ButtonBuilder().setCustomId(`task:join:${item.id}:${topicRoom.id}`).setLabel("Join discussion").setStyle(ButtonStyle.Primary)] : []),
    new ButtonBuilder().setCustomId(`task:back:${item.id}`).setLabel("Back").setStyle(ButtonStyle.Secondary),
  );
  return {
    content: [
      `## ${item.title}`,
      `**Type:** ${item.kind}  |  **Due:** ${due}`,
      `**Your private status:** ${statusEmoji[state] ?? "⚪"} ${state}`,
      notice ? `\n${notice}` : "",
    ].join("\n"),
    components: [statusRow, actionRow],
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
    new ButtonBuilder().setCustomId(`task:back:${itemId}`).setLabel("Back").setStyle(ButtonStyle.Secondary),
  );
  return {
    content: "Choose an existing concept, or type a new one. This is private; a discussion room is optional if one becomes available.",
    components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(picker), back],
  };
}

export async function stuckNotice(conceptId: string): Promise<string> {
  const count = await getStuckCount(conceptId);
  const answer = await getLatestAnswerForConcept(conceptId);
  const topicRoom = count === null ? null : await getJoinableTopicRoom(conceptId);
  const countMessage = topicRoom ? "A discussion room is available for this topic." : "Saved privately.";
  const answerMessage = answer
    ? `\n\n**A TA already answered this:**\n${truncate(answer.body, 1_200)}`
    : "";
  return `${countMessage}${answerMessage}`;
}
