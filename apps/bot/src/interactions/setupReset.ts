import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  type ButtonInteraction,
} from "discord.js";
import { getGuildByDiscordId } from "@classync/core";
import { setupAcademicServer } from "../academicSetup.js";
import { teardownAcademicChannels } from "../teardown.js";

/** Pending reset confirmation. Stored in-memory, keyed by `guildId:userId`. */
const pendingResets = new Map<string, { courseName: string; courseCode: string; enableAuth: boolean; expiresAt: number }>();

export function setPendingReset(guildId: string, userId: string, data: { courseName: string; courseCode: string; enableAuth: boolean }): void {
  pendingResets.set(`${guildId}:${userId}`, { ...data, expiresAt: Date.now() + 60_000 });
}

export function buildResetWarningEmbed(courseName?: string, courseCode?: string): EmbedBuilder {
  const target = courseName && courseCode ? ` untuk **${courseName} (${courseCode})**` : "";
  return new EmbedBuilder()
    .setTitle("⚠️ Server Sudah Memiliki Setup Akademik")
    .setDescription(
      `Server ini sudah memiliki channel dan kategori Classync.\n\n` +
      `Menjalankan setup ulang${target} akan:\n` +
      `• **Membersihkan channel & kategori lama** yang dibuat Classync\n` +
      `• **Membuat ulang struktur channel resmi** (#pengumuman-tugas, #tanya-jawab, dll)\n` +
      `• **Memperbarui role akademik & per-kelas**\n\n` +
      `🛡️ **Data Database Tetap Aman:**\n` +
      `Seluruh data roster mahasiswa, tugas, jawaban, dan akun di database **TIDAK akan dihapus**.\n\n` +
      `Apakah Anda ingin memperbarui struktur channel server ini?`
    )
    .setColor(0xe67e22)
    .setFooter({ text: "Konfirmasi berlaku 60 detik" });
}

function buildFinalConfirmEmbed(): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle("🔄 Konfirmasi Pembaruan Struktur Server")
    .setDescription(
      "Bot akan menata ulang channel dan role Classync di server ini.\n\n" +
      "✅ Data roster mahasiswa dan tugas di database tetap tersimpan dengan aman.\n\n" +
      "Tekan **YA, PERBARUI STRUKTUR** untuk melanjutkan, atau **Batalkan**."
    )
    .setColor(0x3498db)
    .setFooter({ text: "Aksi ini aman bagi data database Anda" });
}

export function confirmRow(stage: "first" | "final"): ActionRowBuilder<ButtonBuilder> {
  if (stage === "first") {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId("setup:reset-confirm").setLabel("🔄 Lanjutkan Pembaruan").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("setup:reset-cancel").setLabel("Batalkan").setStyle(ButtonStyle.Secondary)
    );
  }
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId("setup:reset-final").setLabel("✅ YA, PERBARUI STRUKTUR").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("setup:reset-cancel").setLabel("Batalkan").setStyle(ButtonStyle.Secondary)
  );
}

// ── Button handler ────────────────────────────────────────────────────

export async function handleSetupResetButton(interaction: ButtonInteraction): Promise<boolean> {
  if (!interaction.customId.startsWith("setup:reset")) return false;
  if (!interaction.guildId || !interaction.guild) return true;

  const key = `${interaction.guildId}:${interaction.user.id}`;

  if (interaction.customId === "setup:reset-cancel") {
    pendingResets.delete(key);
    await interaction.update({ content: "❌ Pembaruan setup dibatalkan.", embeds: [], components: [] });
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
  await interaction.update({ content: "⏳ Menata ulang channel & role server…", embeds: [], components: [] });
  await executeResetAndSetup(interaction, pending.courseName, pending.courseCode, pending.enableAuth);
  return true;
}

async function executeResetAndSetup(
  interaction: ButtonInteraction,
  courseName: string,
  courseCode: string,
  enableAuth: boolean
): Promise<void> {
  if (!interaction.guildId || !interaction.guild) return;

  try {
    // Preserve current channel so interaction reply does not fail
    const { deletedChannels, deletedRoles } = await teardownAcademicChannels(
      interaction.guild,
      interaction.channelId ?? undefined
    );
    await interaction.guild.channels.fetch();

    // Database is intentionally NOT reset per user request; all roster & task data is preserved.
    const result = await setupAcademicServer(interaction.client, interaction.guildId, interaction.user.id, {
      courseName,
      courseCode,
      enableAuth,
    });

    const dbGuild = await getGuildByDiscordId(interaction.guildId);
    const announceId = result.announcementChannel?.id ?? dbGuild?.announcementChannelId ?? "";

    const embed = new EmbedBuilder()
      .setTitle("🎉 Setup Server Berhasil Diperbarui!")
      .setDescription(
        `Struktur server akademik telah diperbarui untuk **${courseName} (${courseCode})**.\n\n` +
        `✅ **Data Database Aman:** Roster mahasiswa dan tugas tetap tersimpan lengkap.`
      )
      .setColor(0x2ecc71)
      .addFields(
        { name: "📢 Channel Pengumuman", value: `<#${announceId}>`, inline: true },
        { name: "🔄 Penataan Channel", value: `${deletedChannels} channel diperbarui, ${deletedRoles} role disesuaikan`, inline: true }
      )
      .setFooter({ text: "Classync · Academic Server Provisioner" });

    await interaction.editReply({ content: null, embeds: [embed] }).catch(async () => {
      // Fallback if the channel was closed: announce in announcement channel
      if (result.announcementChannel) {
        await result.announcementChannel.send({ embeds: [embed] }).catch(() => null);
      }
    });
  } catch (error) {
    console.error("[setupReset] Error during setup refresh:", error);
    const msg = error instanceof Error ? error.message : String(error);
    await interaction.editReply({
      content: `❌ Terjadi kendala saat menata ulang server: ${msg}`,
      embeds: [],
      components: [],
    }).catch(() => null);
  }
}
