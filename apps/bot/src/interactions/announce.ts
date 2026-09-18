import { MessageFlags, type ChatInputCommandInteraction } from "discord.js";
import { isTa } from "@classync/core";
import { announceAllActiveTasks } from "../announcements.js";

export async function handleAnnounceAllCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guildId) {
    await interaction.reply({ content: "Jalankan command ini di dalam server kelas.", flags: MessageFlags.Ephemeral });
    return;
  }

  const taCheck = await isTa(interaction.guildId, interaction.user.id);
  if (!taCheck) {
    await interaction.reply({ content: "Hanya Asisten Dosen (TA) yang dapat menjalankan command ini.", flags: MessageFlags.Ephemeral });
    return;
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const result = await announceAllActiveTasks(interaction.client, interaction.guildId);

  if (result.success) {
    await interaction.editReply(`✅ Berhasil menyiarkan pengumuman **${result.count} tugas aktif** ke <#${result.channelId}>.`);
    return;
  }

  if (result.reason === "NO_ACTIVE_TASKS") {
    await interaction.editReply("ℹ️ Tidak ada tugas aktif di server ini (semua tugas sudah melewati deadline atau belum ada tugas yang dibuat).");
    return;
  }
  if (result.reason === "NO_CHANNEL") {
    await interaction.editReply("⚠️ Channel pengumuman belum dikonfigurasi. Jalankan `/setup channel` atau `/setup auto` terlebih dahulu.");
    return;
  }
  if (result.reason === "CHANNEL_NOT_FOUND") {
    await interaction.editReply("⚠️ Channel pengumuman tidak ditemukan di Discord. Periksa kembali atau setel ulang dengan `/setup channel`.");
    return;
  }
  if (result.reason === "NOT_SENDABLE") {
    await interaction.editReply("⚠️ Bot tidak memiliki izin atau channel pengumuman tidak dapat menerima pesan teks.");
    return;
  }

  await interaction.editReply(`❌ Terjadi kesalahan saat mengirim pengumuman: ${result.error ?? "Unknown error"}`);
}
