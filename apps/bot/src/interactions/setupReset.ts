import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  type ButtonInteraction,
} from "discord.js";
import { getGuildByDiscordId, resetGuildData } from "@classync/core";
import { setupAcademicServer } from "../academicSetup.js";
import { teardownAcademicChannels } from "../teardown.js";

/** Pending reset confirmation. Stored in-memory, keyed by `guildId:userId`. */
const pendingResets = new Map<string, { courseName: string; courseCode: string; enableAuth: boolean; expiresAt: number }>();

export function setPendingReset(guildId: string, userId: string, data: { courseName: string; courseCode: string; enableAuth: boolean }): void {
  pendingResets.set(`${guildId}:${userId}`, { ...data, expiresAt: Date.now() + 60_000 });
}

export function buildResetWarningEmbed(): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle("⚠️ Server Sudah Di-setup — Reset Diperlukan")
    .setDescription(
      "Server ini sudah memiliki setup Classync. Menjalankan setup ulang akan:\n\n" +
      "• **Menghapus semua channel & kategori** yang dibuat Classync\n" +
      "• **Menghapus roles akademik** (Dosen, TA, Mahasiswa, Verified, per-kelas)\n" +
      "• **Menghapus semua data dari database** (roster, tugas, jawaban, mahasiswa)\n" +
      "• **Dashboard web akan ter-reset** sepenuhnya\n\n" +
      "Data yang **TIDAK** terhapus: role bot, owner & daftar TA.\n\n" +
      "**Apakah Anda yakin ingin melanjutkan?**",
    )
    .setColor(0xe74c3c)
    .setFooter({ text: "Konfirmasi berlaku 60 detik" });
}

function buildFinalConfirmEmbed(): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle("🔴 KONFIRMASI AKHIR — Ini tidak dapat dibatalkan!")
    .setDescription(
      "Anda akan **menghapus seluruh data dan channel** Classync di server ini.\n\n" +
      "Tekan **YA, RESET & SETUP ULANG** untuk memproses, atau **Batalkan** untuk membatalkan.",
    )
    .setColor(0xff0000)
    .setFooter({ text: "Aksi ini permanen dan tidak dapat di-undo" });
}

export function confirmRow(stage: "first" | "final"): ActionRowBuilder<ButtonBuilder> {
  if (stage === "first") {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId("setup:reset-confirm").setLabel("⚠️ Lanjutkan Reset").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId("setup:reset-cancel").setLabel("Batalkan").setStyle(ButtonStyle.Secondary),
    );
  }
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId("setup:reset-final").setLabel("🔴 YA, RESET & SETUP ULANG").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId("setup:reset-cancel").setLabel("Batalkan").setStyle(ButtonStyle.Secondary),
  );
}

// ── Button handler ────────────────────────────────────────────────────

export async function handleSetupResetButton(interaction: ButtonInteraction): Promise<boolean> {
  if (!interaction.customId.startsWith("setup:reset")) return false;
  if (!interaction.guildId || !interaction.guild) return true;

  const key = `${interaction.guildId}:${interaction.user.id}`;

  if (interaction.customId === "setup:reset-cancel") {
    pendingResets.delete(key);
    await interaction.update({ content: "❌ Reset dibatalkan.", embeds: [], components: [] });
    return true;
  }

  if (interaction.customId === "setup:reset-confirm") {
    return handleFirstConfirm(interaction, key);
  }

  if (interaction.customId === "setup:reset-final") {
    return handleFinalConfirm(interaction, key);
  }

  return false;
}

async function handleFirstConfirm(interaction: ButtonInteraction, key: string): Promise<boolean> {
  const pending = pendingResets.get(key);
  if (!pending || Date.now() > pending.expiresAt) {
    pendingResets.delete(key);
    await interaction.update({ content: "⏰ Konfirmasi expired, jalankan `/setup` lagi.", embeds: [], components: [] });
    return true;
  }
  pending.expiresAt = Date.now() + 60_000;
  await interaction.update({ embeds: [buildFinalConfirmEmbed()], components: [confirmRow("final")] });
  return true;
}

async function handleFinalConfirm(interaction: ButtonInteraction, key: string): Promise<boolean> {
  const pending = pendingResets.get(key);
  if (!pending || Date.now() > pending.expiresAt) {
    pendingResets.delete(key);
    await interaction.update({ content: "⏰ Konfirmasi expired, jalankan `/setup` lagi.", embeds: [], components: [] });
    return true;
  }
  pendingResets.delete(key);
  await interaction.update({ content: "⏳ Resetting server…", embeds: [], components: [] });
  await executeResetAndSetup(interaction, pending.courseName, pending.courseCode, pending.enableAuth);
  return true;
}

async function executeResetAndSetup(
  interaction: ButtonInteraction,
  courseName: string,
  courseCode: string,
  enableAuth: boolean,
): Promise<void> {
  if (!interaction.guildId || !interaction.guild) return;

  const { deletedChannels, deletedRoles } = await teardownAcademicChannels(interaction.guild);
  await interaction.guild.channels.fetch();
  await resetGuildData(interaction.guildId);

  const result = await setupAcademicServer(interaction.client, interaction.guildId, interaction.user.id, {
    courseName, courseCode, enableAuth,
  });

  const dbGuild = await getGuildByDiscordId(interaction.guildId);
  const announceId = result.announcementChannel?.id ?? dbGuild?.announcementChannelId ?? "";

  const embed = new EmbedBuilder()
    .setTitle("🎉 Reset & Setup Ulang Selesai!")
    .setDescription(`Server berhasil di-reset dan di-setup ulang untuk **${courseName} (${courseCode})**.`)
    .setColor(0x2ecc71)
    .addFields(
      { name: "📢 Channel Pengumuman", value: `<#${announceId}>`, inline: true },
      { name: "🔄 Dihapus", value: `${deletedChannels} channel, ${deletedRoles} role`, inline: true },
    )
    .setFooter({ text: "Classync · Academic Server Provisioner" });

  await interaction.editReply({ content: null, embeds: [embed] });
}
