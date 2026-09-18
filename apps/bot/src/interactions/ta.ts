import { EmbedBuilder, MessageFlags, type AutocompleteInteraction, type ChatInputCommandInteraction } from "discord.js";
import {
  createAnswer,
  createItem,
  getConceptById,
  getGuildByDiscordId,
  getTaQueue,
  isTa,
  markRequestsAnswered,
  parseJakartaDueAt,
} from "@classync/core";

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
  if (queue.length === 0) return void await interaction.editReply("No open TA-help requests right now.");
  const fields = await Promise.all(queue.slice(0, 10).map(async (entry) => ({
    name: `${entry.requesters.length} open · ${entry.label}`,
    value: `**${entry.item.title}**\nRequesters: ${(await Promise.all(entry.requesters.map((request) => requesterName(interaction, request.discordUserId)))).join(", ")}\nID: \`${entry.conceptId}\``,
  })));
  await interaction.editReply({ embeds: [new EmbedBuilder().setTitle("TA help queue").setColor(0xe74c3c).addFields(fields)] });
}

async function answer(interaction: ChatInputCommandInteraction): Promise<void> {
  const guild = await getGuildByDiscordId(interaction.guildId as string);
  const conceptId = interaction.options.getString("concept", true);
  const concept = await getConceptById(conceptId);
  if (!guild || !concept) return void await interaction.editReply("That concept is unavailable.");
  const queue = await getTaQueue(guild.id);
  if (!queue.some((entry) => entry.conceptId === conceptId)) return void await interaction.editReply("That concept does not belong to this server or has no open requests.");
  await createAnswer({ conceptId, authorUserId: interaction.user.id, body: interaction.options.getString("body", true) });
  await markRequestsAnswered(conceptId);
  await interaction.editReply("Answer saved. The delivery worker will DM requesters and pin it in the announcement channel shortly.");
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
  else await answer(interaction);
}

export async function handleTaAutocomplete(interaction: AutocompleteInteraction): Promise<void> {
  if (!await requireTa(interaction)) return void await interaction.respond([]);
  const guild = await getGuildByDiscordId(interaction.guildId as string);
  if (!guild) return void await interaction.respond([]);
  const needle = interaction.options.getFocused().toLowerCase();
  const choices = (await getTaQueue(guild.id))
    .filter((entry) => entry.label.includes(needle) || entry.item.title.toLowerCase().includes(needle))
    .slice(0, 25)
    .map((entry) => ({ name: `${entry.item.title} — ${entry.label}`, value: entry.conceptId }));
  await interaction.respond(choices);
}
