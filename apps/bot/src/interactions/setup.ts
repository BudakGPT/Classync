import {
  ActionRowBuilder,
  ChannelType,
  EmbedBuilder,
  MessageFlags,
  ModalBuilder,
  PermissionFlagsBits,
  TextInputBuilder,
  TextInputStyle,
  type ChatInputCommandInteraction,
  type ModalSubmitInteraction,
} from "discord.js";
import {
  addTaUser,
  claimGuildOwnership,
  getGuildByDiscordId,
  getOrCreateGuild,
  removeTaUser,
  setAnnouncementChannel,
  transferGuildOwnership,
} from "@classync/core";
import { createQuickPanelEmbed, setupAcademicServer } from "../academicSetup.js";
import { webUrl } from "../config.js";

async function canManageSetup(interaction: ChatInputCommandInteraction | ModalSubmitInteraction): Promise<boolean> {
  if (!interaction.guildId || !interaction.guild) return false;
  let guild = await getGuildByDiscordId(interaction.guildId);

  if (!guild) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) return false;
    guild = await getOrCreateGuild(interaction.guildId, interaction.guild.name);
  }
  if (!guild.ownerUserId) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) return false;
    const result = await claimGuildOwnership(interaction.guildId, interaction.user.id);
    return result.guild.ownerUserId === interaction.user.id;
  }
  if (guild.ownerUserId === interaction.user.id) return true;

  if (interaction.guild.ownerId === interaction.user.id) {
    const ownerStillPresent = await interaction.guild.members.fetch(guild.ownerUserId).catch(() => null);
    if (!ownerStillPresent) {
      await transferGuildOwnership(interaction.guildId, interaction.user.id);
      return true;
    }
  }
  return false;
}

function buildSuccessEmbed(guildId: string, announceChannelId: string, courseName: string, courseCode: string) {
  return new EmbedBuilder()
    .setTitle("🎉 Setup Server Akademik Selesai!")
    .setDescription(
      `Server Discord telah berhasil disiapkan sebagai ruang kelas akademik untuk **${courseName} (${courseCode})**.\n\n` +
      `Seluruh channels, roles, kategori, dan panel pemanggilan interaktif telah dibuat.`
    )
    .setColor(0x2ecc71)
    .addFields(
      {
        name: "📢 Channel Pengumuman",
        value: `<#${announceChannelId}> (Khusus Dosen & TA)`,
        inline: true,
      },
      {
        name: "🏷️ Roles Akademik",
        value: "• `@Dosen Pengampu`\n• `@Teaching Assistant`\n• `@Mahasiswa`",
        inline: true,
      },
      {
        name: "💻 Dashboard TA Web",
        value: `[Buka Web Dashboard](${webUrl()}/g/${guildId})`,
        inline: true,
      },
      {
        name: "📌 Panel Pemanggilan Classync",
        value: "Panel tombol pemanggilan telah disematkan di `#pengumuman-tugas` dan `#tanya-jawab`. Mahasiswa dapat langsung menekan tombol tanpa perlu mengetik command.",
      }
    )
    .setFooter({ text: "Classync · Academic Server Provisioner" });
}

export async function handleSetupCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guildId || !interaction.guild) {
    await interaction.reply({ content: "Jalankan command ini di server kelas.", flags: MessageFlags.Ephemeral });
    return;
  }
  if (!await canManageSetup(interaction)) {
    await interaction.reply({
      content: "Hanya Classync Owner yang dapat mengelola setup server ini.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const subcommand = interaction.options.getSubcommand();

  if (subcommand === "form") {
    const modal = new ModalBuilder()
      .setCustomId("setup:academic-modal")
      .setTitle("Setup Server Akademik");

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("course_name")
          .setLabel("Nama Mata Kuliah")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("misal: Pemrograman Berorientasi Objek")
          .setRequired(true)
          .setMaxLength(80)
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("course_code")
          .setLabel("Kode / Kelas")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("misal: CS101-A")
          .setRequired(true)
          .setMaxLength(30)
      )
    );

    await interaction.showModal(modal);
    return;
  }

  if (subcommand === "auto") {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const courseName = interaction.options.getString("course_name") || interaction.guild.name;
    const courseCode = interaction.options.getString("course_code") || "KELAS-A";

    const result = await setupAcademicServer(interaction.client, interaction.guildId, interaction.user.id, {
      courseName,
      courseCode,
    });

    const dbGuild = await getGuildByDiscordId(interaction.guildId);
    const announceId = result.announcementChannel?.id ?? dbGuild?.announcementChannelId ?? "";
    const embed = buildSuccessEmbed(dbGuild?.id ?? "", announceId, courseName, courseCode);

    await interaction.editReply({ embeds: [embed] });
    return;
  }

  if (subcommand === "panel") {
    const channel = interaction.channel;
    if (!channel || channel.type !== ChannelType.GuildText) {
      await interaction.reply({ content: "Jalankan di text channel.", flags: MessageFlags.Ephemeral });
      return;
    }
    const panel = createQuickPanelEmbed(interaction.guild.name, "AKADEMIK");
    await channel.send(panel);
    await interaction.reply({ content: "Panel pemanggilan Classync berhasil dikirim ke channel ini.", flags: MessageFlags.Ephemeral });
    return;
  }

  if (subcommand === "channel") {
    const channel = interaction.options.getChannel("channel", true);
    if (channel.type !== ChannelType.GuildText && channel.type !== ChannelType.GuildAnnouncement) {
      await interaction.reply({ content: "Pilih text atau announcement channel.", flags: MessageFlags.Ephemeral });
      return;
    }
    await setAnnouncementChannel(interaction.guildId, channel.id);
    await interaction.reply({ content: `Channel pengumuman berhasil diatur ke <#${channel.id}>.`, flags: MessageFlags.Ephemeral });
    return;
  }

  if (subcommand === "list-ta") {
    const guild = await getGuildByDiscordId(interaction.guildId);
    const taList = guild?.taUserIds ?? [];
    await interaction.reply({
      content: taList.length > 0 ? `## Registered TAs\n${taList.map((id) => `<@${id}>`).join("\n")}` : "Belum ada TA yang didaftarkan.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (subcommand === "add-ta" || subcommand === "remove-ta") {
    const user = interaction.options.getUser("user", true);
    if (subcommand === "add-ta") await addTaUser(interaction.guildId, user.id);
    else await removeTaUser(interaction.guildId, user.id);
    await interaction.reply({ content: `${user.username} ${subcommand === "add-ta" ? "sekarang adalah" : "bukan lagi"} TA di server ini.`, flags: MessageFlags.Ephemeral });
    return;
  }

  if (subcommand === "transfer-owner") {
    const user = interaction.options.getUser("user", true);
    await transferGuildOwnership(interaction.guildId, user.id);
    await interaction.reply({ content: `${user.username} sekarang adalah Classync Owner.`, flags: MessageFlags.Ephemeral });
    return;
  }
}

export async function handleSetupModal(interaction: ModalSubmitInteraction): Promise<void> {
  if (interaction.customId !== "setup:academic-modal" || !interaction.guildId || !interaction.guild) return;
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const courseName = interaction.fields.getTextInputValue("course_name");
  const courseCode = interaction.fields.getTextInputValue("course_code");

  const result = await setupAcademicServer(interaction.client, interaction.guildId, interaction.user.id, {
    courseName,
    courseCode,
  });

  const dbGuild = await getGuildByDiscordId(interaction.guildId);
  const announceId = result.announcementChannel?.id ?? dbGuild?.announcementChannelId ?? "";
  const embed = buildSuccessEmbed(dbGuild?.id ?? "", announceId, courseName, courseCode);

  await interaction.editReply({ embeds: [embed] });
}
