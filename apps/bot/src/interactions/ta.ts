import { EmbedBuilder, MessageFlags, type AutocompleteInteraction, type ChatInputCommandInteraction } from "discord.js";
import {
  createAnswer,
  createItem,
  getGuildByDiscordId,
  getItemById,
  getItemsByGuild,
  getTaAnswerableConcepts,
  getTaQueue,
  isTa,
  markRequestsAnswered,
  parseJakartaDueAt,
} from "@classync/core";
import {
  channelUrl,
  closeAssignmentRooms,
  closeTopicRoomChannel,
  ensureItemCategory,
  reopenTopicRoomChannel,
} from "../topicRooms.js";

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
  await ensureItemCategory(interaction.client, guild.discordGuildId, item, guild.taUserIds).catch(() => null);

  const due = dueAt ? `<t:${Math.floor(dueAt.getTime() / 1000)}:F>` : "No due date";
  await interaction.editReply(`Added **${item.title}** · ${kind} · ${due} and provisioned category.`);
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

  const fields = await Promise.all(queue.slice(0, 10).map(async (entry) => {
    const memberCount = entry.topicRoom?.members ? (entry.topicRoom.members as unknown[]).length : 0;
    const roomInfo = entry.topicRoom?.channelId
      ? `Room: [${entry.topicRoom.state}](${channelUrl(interaction.guildId as string, entry.topicRoom.channelId)}) (${memberCount} member${memberCount === 1 ? "" : "s"})`
      : "Room: not created";

    return {
      name: `${entry.requesters.length} open help request${entry.requesters.length === 1 ? "" : "s"} · ${entry.label}`,
      value: [
        `**${entry.item.title}**`,
        entry.requesters.length > 0
          ? `Requesters: ${(await Promise.all(entry.requesters.map((req) => requesterName(interaction, req.discordUserId)))).join(", ")}`
          : "No private help requests.",
        roomInfo,
        `ID: \`${entry.conceptId}\``,
      ].join("\n"),
    };
  }));

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
  await interaction.editReply("Answer saved. Delivery worker will post it into the discussion channel and notify explicit help requesters. Room remains open for discussion.");
}

async function closeRoom(interaction: ChatInputCommandInteraction): Promise<void> {
  const guild = await getGuildByDiscordId(interaction.guildId as string);
  if (!guild) return void await interaction.editReply("Run `/setup channel` first.");
  const conceptId = interaction.options.getString("concept", true);
  const concept = (await getTaAnswerableConcepts(guild.id)).find((val) => val.id === conceptId);
  if (!concept?.topicRoom) return void await interaction.editReply("This concept has no discussion room.");

  const item = await getItemById(concept.itemId);
  if (item?.dueAt && Date.now() < item.dueAt.getTime()) {
    await interaction.editReply(`Cannot close room before the task due date (<t:${Math.floor(item.dueAt.getTime() / 1000)}:R>).`);
    return;
  }

  await closeTopicRoomChannel(interaction.client, guild.discordGuildId, concept.topicRoom.id, interaction.user.id);
  await interaction.editReply(`Discussion room for **${concept.label}** closed. It remains read-only as a knowledge base.`);
}

async function reopenRoom(interaction: ChatInputCommandInteraction): Promise<void> {
  const guild = await getGuildByDiscordId(interaction.guildId as string);
  if (!guild) return void await interaction.editReply("Run `/setup channel` first.");
  const conceptId = interaction.options.getString("concept", true);
  const concept = (await getTaAnswerableConcepts(guild.id)).find((val) => val.id === conceptId);
  if (!concept?.topicRoom) return void await interaction.editReply("This concept has no discussion room.");

  await reopenTopicRoomChannel(interaction.client, guild.discordGuildId, concept.topicRoom.id);
  await interaction.editReply(`Discussion room for **${concept.label}** reopened.`);
}

async function closeTaskRooms(interaction: ChatInputCommandInteraction): Promise<void> {
  const guild = await getGuildByDiscordId(interaction.guildId as string);
  if (!guild) return void await interaction.editReply("Run `/setup channel` first.");
  const itemId = interaction.options.getString("item", true);
  const item = await getItemById(itemId);
  if (!item || item.guildId !== guild.id) return void await interaction.editReply("Task not found.");

  if (item.dueAt && Date.now() < item.dueAt.getTime()) {
    await interaction.editReply(`Cannot close rooms before the task due date (<t:${Math.floor(item.dueAt.getTime() / 1000)}:R>).`);
    return;
  }

  const deleteDiscord = interaction.options.getBoolean("delete_discord") ?? false;
  const result = await closeAssignmentRooms(interaction.client, guild.discordGuildId, item, interaction.user.id, deleteDiscord);

  if (result.deletedDiscord) {
    await interaction.editReply(`Deleted ${result.closedCount} room channel(s) and the category for **${item.title}**.`);
  } else {
    await interaction.editReply(`Closed ${result.closedCount} room channel(s) for **${item.title}** (read-only).`);
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
  else if (command === "close-room") await closeRoom(interaction);
  else if (command === "reopen-room") await reopenRoom(interaction);
  else if (command === "close-task-rooms") await closeTaskRooms(interaction);
}

export async function handleTaAutocomplete(interaction: AutocompleteInteraction): Promise<void> {
  if (!await requireTa(interaction)) return void await interaction.respond([]);
  const guild = await getGuildByDiscordId(interaction.guildId as string);
  if (!guild) return void await interaction.respond([]);
  const subcommand = interaction.options.getSubcommand(false);
  const needle = interaction.options.getFocused().toLowerCase();

  if (subcommand === "close-task-rooms") {
    const items = await getItemsByGuild(guild.id);
    const choices = items
      .filter((item) => item.title.toLowerCase().includes(needle))
      .slice(0, 25)
      .map((item) => ({ name: item.title, value: item.id }));
    await interaction.respond(choices);
    return;
  }

  const choices = (await getTaAnswerableConcepts(guild.id))
    .filter((entry) => entry.label.includes(needle) || entry.item.title.toLowerCase().includes(needle))
    .slice(0, 25)
    .map((entry) => ({ name: `${entry.item.title} — ${entry.label}`, value: entry.id }));
  await interaction.respond(choices);
}
