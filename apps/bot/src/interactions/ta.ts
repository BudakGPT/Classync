import { EmbedBuilder, MessageFlags, type AutocompleteInteraction, type ChatInputCommandInteraction } from "discord.js";
import {
  createAnswer,
  createItem,
  getGuildByDiscordId,
  getTaAnswerableConcepts,
  getTaQueue,
  isTa,
  markRequestsAnswered,
  markTopicRoomAnswered,
  parseJakartaDueAt,
  setTopicRoomState,
} from "@classync/core";
import { threadUrl } from "../topicRooms.js";

const itemKinds = ["ASSIGNMENT", "QUIZ", "EXAM", "READING"] as const;

async function requireTa(interaction: ChatInputCommandInteraction | AutocompleteInteraction): Promise<boolean> {
  return interaction.guildId !== null && await isTa(interaction.guildId, interaction.user.id);
}

async function addItem(interaction: ChatInputCommandInteraction): Promise<void> {
  const guild = await getGuildByDiscordId(interaction.guildId as string);
  if (!guild) return void await interaction.editReply("Run `/setup channel` first.");
  const rawDue = interaction.options.getString("due");
  const parsedDue = rawDue ? parseJakartaDueAt(rawDue) : undefined;
  if (rawDue && parsedDue === null) return void await interaction.editReply("Use `YYYY-MM-DD` or `YYYY-MM-DD HH:mm` in Asia/Jakarta.");
  const dueAt = parsedDue ?? undefined;
  const rawKind = interaction.options.getString("kind") ?? "ASSIGNMENT";
  const kind = itemKinds.find((value) => value === rawKind);
  if (!kind) return void await interaction.editReply("Invalid task type.");
  const item = await createItem({ guildId: guild.id, title: interaction.options.getString("title", true), dueAt, kind });
  const due = dueAt ? `<t:${Math.floor(dueAt.getTime() / 1000)}:F>` : "No due date";
  await interaction.editReply(`Added **${item.title}** · ${kind} · ${due}`);
}

async function requesterName(interaction: ChatInputCommandInteraction, userId: string): Promise<string> {
  const member = await interaction.guild?.members.fetch(userId).catch(() => null);
  return member?.displayName ?? "Unavailable Discord user";
}

async function showQueue(interaction: ChatInputCommandInteraction): Promise<void> {
  const guild = await getGuildByDiscordId(interaction.guildId as string);
  if (!guild) return void await interaction.editReply("Run `/setup channel` first.");
  const queue = await getTaQueue(guild.id);
  if (queue.length === 0) return void await interaction.editReply("No open TA-help requests or discussion rooms right now.");
  const fields = await Promise.all(queue.slice(0, 10).map(async (entry) => ({
    name: `${entry.requesters.length} open help request${entry.requesters.length === 1 ? "" : "s"} · ${entry.label}`,
    value: [
      `**${entry.item.title}**`,
      entry.requesters.length > 0
        ? `Requesters: ${(await Promise.all(entry.requesters.map((request) => requesterName(interaction, request.discordUserId)))).join(", ")}`
        : "No private help requests.",
      entry.topicRoom?.threadId ? `Room: [${entry.topicRoom.state}](${threadUrl(interaction.guildId as string, entry.topicRoom.threadId)})` : "Room: not available",
      `ID: \`${entry.conceptId}\``,
    ].join("\n"),
  })));
  await interaction.editReply({ embeds: [new EmbedBuilder().setTitle("TA help queue").setColor(0xe74c3c).addFields(fields)] });
}

async function answer(interaction: ChatInputCommandInteraction): Promise<void> {
  const guild = await getGuildByDiscordId(interaction.guildId as string);
  const conceptId = interaction.options.getString("concept", true);
  if (!guild) return void await interaction.editReply("Run `/setup channel` first.");
  const concepts = await getTaAnswerableConcepts(guild.id);
  if (!concepts.some((concept) => concept.id === conceptId)) return void await interaction.editReply("That concept does not belong to this server.");
  await createAnswer({ conceptId, authorUserId: interaction.user.id, body: interaction.options.getString("body", true) });
  await markRequestsAnswered(conceptId);
  await markTopicRoomAnswered(conceptId);
  await interaction.editReply("Answer saved. The delivery worker will post it in the topic room and notify explicit help requesters.");
}

async function moderateRoom(interaction: ChatInputCommandInteraction, reopen: boolean): Promise<void> {
  const guild = await getGuildByDiscordId(interaction.guildId as string);
  if (!guild) return void await interaction.editReply("Run `/setup channel` first.");
  const conceptId = interaction.options.getString("concept", true);
  const concept = (await getTaAnswerableConcepts(guild.id)).find((value) => value.id === conceptId);
  if (!concept?.topicRoom?.threadId) return void await interaction.editReply("This concept has no discussion room.");
  const channel = await interaction.guild?.channels.fetch(concept.topicRoom.threadId).catch(() => null);
  if (!channel?.isThread()) return void await interaction.editReply("The configured discussion room is unavailable.");
  try {
    await channel.setArchived(!reopen);
    await channel.setLocked(!reopen);
    await setTopicRoomState(concept.topicRoom.id, reopen ? "OPEN" : "ARCHIVED");
    await interaction.editReply(reopen ? "Discussion room reopened." : "Discussion room locked and archived; it remains readable.");
  } catch {
    await interaction.editReply("I could not update this room. Check my Manage Threads permission.");
  }
}

export async function handleTaCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!await requireTa(interaction)) {
    await interaction.reply({ content: "TA access is required.", flags: MessageFlags.Ephemeral });
    return;
  }
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const command = interaction.options.getSubcommand();
  if (command === "add-item") await addItem(interaction);
  else if (command === "queue") await showQueue(interaction);
  else if (command === "answer") await answer(interaction);
  else await moderateRoom(interaction, command === "reopen-room");
}

export async function handleTaAutocomplete(interaction: AutocompleteInteraction): Promise<void> {
  if (!await requireTa(interaction)) return void await interaction.respond([]);
  const guild = await getGuildByDiscordId(interaction.guildId as string);
  if (!guild) return void await interaction.respond([]);
  const needle = interaction.options.getFocused().toLowerCase();
  const choices = (await getTaAnswerableConcepts(guild.id))
    .filter((entry) => entry.label.includes(needle) || entry.item.title.toLowerCase().includes(needle))
    .slice(0, 25)
    .map((entry) => ({ name: `${entry.item.title} — ${entry.label}`, value: entry.id }));
  await interaction.respond(choices);
}
