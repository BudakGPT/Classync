import {
  ActionRowBuilder,
  EmbedBuilder,
  MessageFlags,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  type ButtonInteraction,
  type ModalSubmitInteraction,
} from "discord.js";
import { verifyRosterMember } from "@classync/core";

export async function handleVerificationButton(interaction: ButtonInteraction): Promise<boolean> {
  if (interaction.customId !== "auth:verify") return false;

  const modal = new ModalBuilder()
    .setCustomId("auth:modal")
    .setTitle("Verifikasi Mahasiswa / Asdos");

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId("npm")
        .setLabel("Nomor Pokok Mahasiswa (NPM / NIM)")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("Contoh: 2206123456")
        .setRequired(true)
        .setMinLength(4)
        .setMaxLength(30)
    )
  );

  await interaction.showModal(modal);
  return true;
}

export async function handleVerificationModal(interaction: ModalSubmitInteraction): Promise<boolean> {
  if (interaction.customId !== "auth:modal" || !interaction.guildId || !interaction.guild) {
    return false;
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const rawNpm = interaction.fields.getTextInputValue("npm");
  const cleanNpm = rawNpm.trim();

  const result = await verifyRosterMember(interaction.guildId, cleanNpm, interaction.user.id);

  if (!result.success) {
    if (result.reason === "NOT_FOUND") {
      await interaction.editReply({
        content: `❌ **NPM Tidak Ditemukan**\nNPM \`${cleanNpm}\` tidak terdaftar dalam database kelas ini. Pastikan Anda mengetik NPM dengan benar, atau hubungi Dosen Pengampu / Teaching Assistant untuk ditambahkan.`,
      });
      return true;
    }
    if (result.reason === "ALREADY_CLAIMED") {
      await interaction.editReply({
        content: `⚠️ **NPM Sudah Terverifikasi**\nNPM \`${cleanNpm}\` telah diverifikasi oleh akun Discord lain (<@${result.claimedBy}>). Satu NPM hanya dapat diklaim oleh satu akun Discord. Hubungi TA jika ada kendala.`,
      });
      return true;
    }
    if (result.reason === "DISCORD_ALREADY_VERIFIED") {
      await interaction.editReply({
        content: `⚠️ **Akun Anda Sudah Terdaftar**\nAkun Discord Anda telah terhubung dengan NPM lain di kelas ini. Anda tidak dapat mengklaim lebih dari satu identitas.`,
      });
      return true;
    }
    await interaction.editReply({ content: "Gagal melakukan verifikasi." });
    return true;
  }

  const { entry } = result;
  const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);

  if (member) {
    // 1. Assign @Verified role
    const verifiedRole = interaction.guild.roles.cache.find(
      (r) => r.name.toLowerCase() === "verified"
    );
    if (verifiedRole) await member.roles.add(verifiedRole).catch(() => undefined);

    // 2. Assign role based on role in roster
    if (entry.role === "TA") {
      const taRole = interaction.guild.roles.cache.find(
        (r) => r.name.toLowerCase() === "teaching assistant"
      );
      if (taRole) await member.roles.add(taRole).catch(() => undefined);
    } else {
      const studentRole = interaction.guild.roles.cache.find(
        (r) => r.name.toLowerCase() === "mahasiswa"
      );
      if (studentRole) await member.roles.add(studentRole).catch(() => undefined);

      // 3. Assign class section role if present (e.g. @Kelas A)
      if (entry.className) {
        const classRole = interaction.guild.roles.cache.find(
          (r) => r.name.toLowerCase() === entry.className?.toLowerCase()
        );
        if (classRole) await member.roles.add(classRole).catch(() => undefined);
      }
    }

    // 4. Update server nickname to "NPM - Nama Lengkap"
    const newNick = `${entry.npm} - ${entry.name}`.slice(0, 32);
    await member.setNickname(newNick).catch(() => undefined);
  }

  const embed = new EmbedBuilder()
    .setTitle("🎉 Verifikasi Identitas Berhasil!")
    .setDescription(
      `Selamat datang di server akademik, **${entry.name}**!\n\n` +
      `Identitas Anda telah berhasil dicocokkan dengan database akademik kelas.`
    )
    .setColor(0x2ecc71)
    .addFields(
      { name: "🆔 NPM / NIM", value: `\`${entry.npm}\``, inline: true },
      { name: "🏷️ Peran", value: entry.role === "TA" ? "🧑‍🏫 Teaching Assistant" : "🧑‍🎓 Mahasiswa", inline: true },
      ...(entry.className ? [{ name: "📚 Kelas", value: entry.className, inline: true }] : [])
    )
    .setFooter({ text: "Seluruh ruang diskusi dan materi kelas telah dibuka untuk Anda." });

  await interaction.editReply({ embeds: [embed] });
  return true;
}
