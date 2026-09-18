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
  getLatestAnswerForConcept,
  getMyStatus,
  getMyStatuses,
  getStuckCount,
} from "@classync/core";

/** Structural types so the bot never imports @prisma/client. */
export type StudentRef = { id: string; helperOptIn: boolean };
export type ItemRef = { id: string; guildId: string; title: string; kind: string; dueAt: Date | null };

const statusEmoji: Record<string, string> = { NONE: "⬜", IN_PROGRESS: "🔵", DONE: "✅", STUCK: "🔴" };

export function truncate(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}

export function consentScreen() {
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId("task:consent:agree").setLabel("I agree").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("task:consent:decline").setLabel("No thanks").setStyle(ButtonStyle.Secondary)
  );
  return {
    content:
      "**Before using Classync, please consent to data collection.**\n\n" +
      "We store:\n• Your Discord user ID\n• Your task statuses (only visible to you)\n• Any help requests you explicitly submit\n\n" +
      "If you opt in to help classmates, other students may be told you finished an item. " +
      "Your name is never shown unless you reveal it.\n\n" +
      "You can delete your data anytime via the **Privacy** button.",
    components: [row],
  };
}

function privacyRow(student: StudentRef) {
  const helper = student.helperOptIn
    ? new ButtonBuilder().setCustomId("helper:optout").setLabel("🤝 Help classmates: on").setStyle(ButtonStyle.Success)
    : new ButtonBuilder().setCustomId("helper:optin").setLabel("🤝 Help classmates: off").setStyle(ButtonStyle.Secondary);
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    helper,
    new ButtonBuilder().setCustomId("task:privacy").setLabel("🔒 Privacy / Delete my data").setStyle(ButtonStyle.Danger)
  );
}

export async function taskListScreen(guildId: string, student: StudentRef) {
  const items = await getItemsByGuild(guildId);
  if (items.length === 0) {
    return { content: "**📋 Your Tasks**\n\nNo tasks yet. Ask your TA to add one!", components: [privacyRow(student)] };
  }
  const states = new Map((await getMyStatuses(guildId, student.id)).map((s) => [s.itemId, s.state]));
  const lines = items.map((item) => {
    const state = states.get(item.id) ?? "NONE";
    const due = item.dueAt ? ` · Due: <t:${Math.floor(item.dueAt.getTime() / 1000)}:R>` : "";
    return `${statusEmoji[state] ?? "⬜"} **${item.title}**${due} \`[${state}]\``;
  });
  const picker = new StringSelectMenuBuilder()
    .setCustomId("task:choose")
    .setPlaceholder("Choose a task to update")
    .addOptions(
      items.map((item) =>
        new StringSelectMenuOptionBuilder()
          .setLabel(truncate(item.title, 100))
          .setDescription(`Status: ${states.get(item.id) ?? "NONE"}`)
          .setValue(item.id)
      )
    );
  return {
    content: `**📋 Your Tasks**\n\n${lines.join("\n")}\n\n*Choose a task below to update its private status.*`,
    components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(picker), privacyRow(student)],
  };
}

export async function taskDetailScreen(item: ItemRef, studentId: string, notice?: string) {
  const status = await getMyStatus(item.id, studentId);
  const state = status?.state ?? "NONE";
  const due = item.dueAt ? `<t:${Math.floor(item.dueAt.getTime() / 1000)}:F>` : "No due date";
  const statusRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(`task:status:${item.id}:IN_PROGRESS`).setLabel("In progress").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`task:status:${item.id}:DONE`).setLabel("Done").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`task:stuck:${item.id}`).setLabel("Stuck").setStyle(ButtonStyle.Danger)
  );
  const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(`task:help:${item.id}`).setLabel("Request TA help").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`task:back:${item.id}`).setLabel("Back").setStyle(ButtonStyle.Secondary)
  );
  return {
    content: [
      `**${item.title}**`,
      `Type: ${item.kind} · Due: ${due}`,
      `Your private status: ${statusEmoji[state] ?? "⬜"} \`${state}\``,
      notice ? `\n${notice}` : "",
    ].join("\n"),
    components: [statusRow, actionRow],
  };
}

export async function conceptPickerScreen(itemId: string) {
  const concepts = await getConceptsForItem(itemId);
  const options = concepts
    .slice(0, 24)
    .map((c) => new StringSelectMenuOptionBuilder().setLabel(truncate(c.label, 100)).setValue(c.id));
  options.push(new StringSelectMenuOptionBuilder().setLabel("✏️ Type a new one").setValue("new"));
  const picker = new StringSelectMenuBuilder()
    .setCustomId(`task:concept:${itemId}`)
    .setPlaceholder("What are you stuck on?")
    .addOptions(options);
  const back = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(`task:back:${itemId}`).setLabel("Back").setStyle(ButtonStyle.Secondary)
  );
  return {
    content: "What are you stuck on? Choose an existing label or type a new one. This is private.",
    components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(picker), back],
  };
}

/** Threshold message after saving Stuck: count only when >= 5 reporters, plus any stored TA answer. */
export async function stuckNotice(conceptId: string): Promise<string> {
  const count = await getStuckCount(conceptId);
  const answer = await getLatestAnswerForConcept(conceptId);
  const countLine = count === null ? "Saved privately." : `🔴 **${count} others flagged this.**`;
  const answerLine = answer ? `\n\n**A TA already answered this:**\n${truncate(answer.body, 1200)}` : "";
  return `${countLine}${answerLine}`;
}
