import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  type Client,
  type Guild,
  type TextChannel,
} from "discord.js";
import { getGuildByDiscordId, getItemsByGuild } from "@classync/core";

export type FailureReason =
  | "NO_CHANNEL"
  | "CHANNEL_NOT_FOUND"
  | "NOT_SENDABLE"
  | "NO_ACTIVE_TASKS"
  | "ERROR";

export type AnnounceResult =
  | { success: true; channelId: string; count?: number }
  | { success: false; reason: FailureReason; error?: string };

const KIND_LABELS: Record<string, string> = {
  ASSIGNMENT: "📝 Tugas / Assignment",
  QUIZ: "⚡ Kuis / Quiz",
  EXAM: "🎯 Ujian / Exam",
  READING: "📖 Bahan Bacaan",
};

export function createTaskAnnouncementEmbed(item: { title: string; kind: string; dueAt: Date | null }) {
  const kindLabel = KIND_LABELS[item.kind] ?? item.kind;
  const due = item.dueAt
    ? `<t:${Math.floor(item.dueAt.getTime() / 1000)}:F> (<t:${Math.floor(item.dueAt.getTime() / 1000)}:R>)`
    : "Tidak ada batas waktu (Ongoing)";

  const embed = new EmbedBuilder()
    .setTitle(`📢 Pengumuman Tugas Baru: ${item.title}`)
    .setDescription(
      `Tugas baru telah ditambahkan ke sistem akademik Classync.\n\n` +
      `Silakan periksa detail dan kelola status pengerjaan Anda melalui tombol di bawah secara privat.`
    )
    .setColor(0x5865f2)
    .addFields(
      { name: "🏷️ Jenis Tugas", value: kindLabel, inline: true },
      { name: "⏰ Batas Waktu (Deadline)", value: due, inline: true },
      {
        name: "💡 Panduan Mahasiswa",
        value: "Tekan **Buka Tugas Saya** untuk checklist privat, atau **Tanya / Diskusi** jika membutuhkan klarifikasi konsep dari rekan kelas & TA.",
      }
    )
    .setFooter({ text: "Classync · Academic Task Broadcasting" })
    .setTimestamp();

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId("task:panel-tasks").setLabel("📋 Buka Tugas Saya").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("task:panel-ask").setLabel("🙋 Tanya / Diskusi").setStyle(ButtonStyle.Success)
  );

  return { embeds: [embed], components: [row] };
}

export function createAllTasksAnnouncementEmbed(guildName: string, items: Array<{ title: string; kind: string; dueAt: Date | null }>) {
  const embed = new EmbedBuilder()
    .setTitle(`📢 Daftar Tugas & Aktivitas Aktif — ${guildName}`)
    .setDescription(
      `Berikut adalah rangkuman seluruh tugas dan aktivitas akademik yang **saat ini aktif** dan belum melewati deadline.\n\n` +
      `Kelola progres belajar Anda secara privat melalui tombol di bawah.`
    )
    .setColor(0x3498db)
    .setFooter({ text: `Total ${items.length} tugas aktif · Classync Task Tracker` })
    .setTimestamp();

  // Discord limit max 25 fields
  const displayItems = items.slice(0, 25);
  for (const item of displayItems) {
    const kindLabel = KIND_LABELS[item.kind] ?? item.kind;
    const due = item.dueAt
      ? `<t:${Math.floor(item.dueAt.getTime() / 1000)}:F> (<t:${Math.floor(item.dueAt.getTime() / 1000)}:R>)`
      : "Tidak ada deadline";
    embed.addFields({
      name: `📌 ${item.title}`,
      value: `• **Jenis:** ${kindLabel}\n• **Deadline:** ${due}`,
      inline: false,
    });
  }

  if (items.length > 25) {
    embed.addFields({
      name: "ℹ️ Tugas Lainnya",
      value: `*Dan ${items.length - 25} tugas lainnya. Buka menu tugas untuk melihat seluruh daftar.*`,
    });
  }

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId("task:panel-tasks").setLabel("📋 Buka Tugas Saya").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("task:panel-ask").setLabel("🙋 Tanya / Diskusi").setStyle(ButtonStyle.Success)
  );

  return { embeds: [embed], components: [row] };
}

async function resolveAnnouncementChannel(client: Client, discordGuildId: string): Promise<{ channel?: TextChannel; reason?: FailureReason }> {
  const dbGuild = await getGuildByDiscordId(discordGuildId);
  if (!dbGuild?.announcementChannelId) return { reason: "NO_CHANNEL" };

  const guild: Guild | null = await client.guilds.fetch(discordGuildId).catch(() => null);
  if (!guild) return { reason: "CHANNEL_NOT_FOUND" };

  const channel = await guild.channels.fetch(dbGuild.announcementChannelId).catch(() => null);
  if (!channel) return { reason: "CHANNEL_NOT_FOUND" };
  if (!channel.isSendable() || !("send" in channel)) return { reason: "NOT_SENDABLE" };

  return { channel: channel as TextChannel };
}

export async function announceTask(
  client: Client,
  discordGuildId: string,
  item: { title: string; kind: string; dueAt: Date | null }
): Promise<AnnounceResult> {
  const { channel, reason } = await resolveAnnouncementChannel(client, discordGuildId);
  if (!channel) return { success: false, reason: reason ?? "CHANNEL_NOT_FOUND" };

  try {
    const payload = createTaskAnnouncementEmbed(item);
    const message = await channel.send(payload);
    return { success: true, channelId: channel.id, count: 1 };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, reason: "ERROR", error: message };
  }
}

export async function announceAllActiveTasks(client: Client, discordGuildId: string): Promise<AnnounceResult> {
  const dbGuild = await getGuildByDiscordId(discordGuildId);
  if (!dbGuild) return { success: false, reason: "NO_CHANNEL" };

  const allItems = await getItemsByGuild(dbGuild.id);
  const now = Date.now();
  const activeItems = allItems.filter((i) => !i.dueAt || i.dueAt.getTime() > now);

  if (activeItems.length === 0) {
    return { success: false, reason: "NO_ACTIVE_TASKS" };
  }

  const { channel, reason } = await resolveAnnouncementChannel(client, discordGuildId);
  if (!channel) return { success: false, reason: reason ?? "CHANNEL_NOT_FOUND" };

  try {
    const payload = createAllTasksAnnouncementEmbed(channel.guild.name, activeItems);
    await channel.send(payload);
    return { success: true, channelId: channel.id, count: activeItems.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, reason: "ERROR", error: message };
  }
}
