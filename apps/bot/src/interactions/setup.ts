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
import { buildResetWarningEmbed, confirmRow, setPendingReset } from "./setupReset.js";

// Re-export for index.ts
export { handleSetupResetButton } from "./setupReset.js";

// ── Permission check ──────────────────────────────────────────────────

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

// ── Detect existing setup ─────────────────────────────────────────────

function isAlreadySetUp(interaction: ChatInputCommandInteraction | ModalSubmitInteraction): boolean {
  const guild = interaction.guild;
  if (!guild) return false;
  return guild.channels.cache.some(
    (c) => c.type === ChannelType.GuildCategory && c.name.includes("INFORMASI AKADEMIK"),
  );
}

// ── Success embed ─────────────────────────────────────────────────────

function buildSuccessEmbed(guildId: string, announceChannelId: string, courseName: string, courseCode: string) {
  return new EmbedBuilder()
    .setTitle("🎉 Setup Server Akademik Selesai!")
    .setDescription(
      `Server Discord telah berhasil disiapkan untuk **${courseName} (${courseCode})**.` +
      `\n\nSeluruh channels, roles, dan panel pemanggilan interaktif telah dibuat.`
    )
    .setColor(0x2ecc71)
    .addFields(
      { name: "📢 Channel Pengumuman", value: `<#${announceChannelId}>`, inline: true },
      { name: "🏷️ Roles Akademik", value: "`@Dosen Pengampu` · `@Teaching Assistant` · `@Mahasiswa`", inline: true },
      { name: "💻 Dashboard TA Web", value: `[Buka](${webUrl()}/g/${guildId})`, inline: true },
    )
    .setFooter({ text: "Classync · Academic Server Provisioner" });
}

// ── Main /setup command handler ───────────────────────────────────────

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

  const sub = interaction.options.getSubcommand();

  if (sub === "form") return void await handleForm(interaction);
  if (sub === "auto") return void await handleAuto(interaction);
  if (sub === "panel") return void await handlePanel(interaction);
  if (sub === "channel") return void await handleChannel(interaction);
  if (sub === "list-ta") return void await handleListTa(interaction);
  if (sub === "add-ta" || sub === "remove-ta") return void await handleTaToggle(interaction, sub);
  if (sub === "transfer-owner") return void await handleTransferOwner(interaction);
}

// ── /setup form ───────────────────────────────────────────────────────

async function handleForm(interaction: ChatInputCommandInteraction): Promise<void> {
  if (isAlreadySetUp(interaction)) {
    return void await showResetConfirmation(interaction, interaction.guild!.name, "KELAS-A", true);
  }
  const modal = new ModalBuilder().setCustomId("setup:academic-modal").setTitle("Setup Server Akademik");
  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder().setCustomId("course_name").setLabel("Nama Mata Kuliah")
        .setStyle(TextInputStyle.Short).setPlaceholder("misal: Pemrograman Berorientasi Objek")
        .setRequired(true).setMaxLength(80),
    ),
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder().setCustomId("course_code").setLabel("Kode / Kelas")
        .setStyle(TextInputStyle.Short).setPlaceholder("misal: CS101-A")
        .setRequired(true).setMaxLength(30),
    ),
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder().setCustomId("auth_enabled").setLabel("Aktifkan Verifikasi Mahasiswa (NPM)?")
        .setStyle(TextInputStyle.Short).setPlaceholder("ya / tidak (default: ya)")
        .setRequired(false).setValue("ya").setMaxLength(10),
    ),
  );
  await interaction.showModal(modal);
}

// ── /setup auto ───────────────────────────────────────────────────────

async function handleAuto(interaction: ChatInputCommandInteraction): Promise<void> {
  const courseName = interaction.options.getString("course_name") || interaction.guild!.name;
  const courseCode = interaction.options.getString("course_code") || "KELAS-A";
  const enableAuthOpt = interaction.options.getBoolean("enable_auth");

  if (isAlreadySetUp(interaction)) {
    return void await showResetConfirmation(interaction, courseName, courseCode, enableAuthOpt ?? true);
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const result = await setupAcademicServer(interaction.client, interaction.guildId!, interaction.user.id, {
    courseName, courseCode, enableAuth: enableAuthOpt ?? undefined,
  });

  const dbGuild = await getGuildByDiscordId(interaction.guildId!);
  const announceId = result.announcementChannel?.id ?? dbGuild?.announcementChannelId ?? "";
  await interaction.editReply({ embeds: [buildSuccessEmbed(dbGuild?.id ?? "", announceId, courseName, courseCode)] });
}

// ── Modal handler (from /setup form) ──────────────────────────────────

export async function handleSetupModal(interaction: ModalSubmitInteraction): Promise<void> {
  if (interaction.customId !== "setup:academic-modal" || !interaction.guildId || !interaction.guild) return;
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const courseName = interaction.fields.getTextInputValue("course_name");
  const courseCode = interaction.fields.getTextInputValue("course_code");
  let enableAuth = true;
  try {
    const v = interaction.fields.getTextInputValue("auth_enabled")?.toLowerCase().trim();
    if (v === "tidak" || v === "no" || v === "false") enableAuth = false;
  } catch { /* optional field */ }

  const result = await setupAcademicServer(interaction.client, interaction.guildId, interaction.user.id, {
    courseName, courseCode, enableAuth,
  });

  const dbGuild = await getGuildByDiscordId(interaction.guildId);
  const announceId = result.announcementChannel?.id ?? dbGuild?.announcementChannelId ?? "";
  await interaction.editReply({ embeds: [buildSuccessEmbed(dbGuild?.id ?? "", announceId, courseName, courseCode)] });
}

// ── Reset confirmation trigger ────────────────────────────────────────

async function showResetConfirmation(
  interaction: ChatInputCommandInteraction,
  courseName: string,
  courseCode: string,
  enableAuth: boolean,
): Promise<void> {
  setPendingReset(interaction.guildId!, interaction.user.id, { courseName, courseCode, enableAuth });
  await interaction.reply({
    embeds: [buildResetWarningEmbed()],
    components: [confirmRow("first")],
    flags: MessageFlags.Ephemeral,
  });
}

// ── Other subcommands ─────────────────────────────────────────────────

async function handlePanel(interaction: ChatInputCommandInteraction): Promise<void> {
  const channel = interaction.channel;
  if (!channel || channel.type !== ChannelType.GuildText) {
    await interaction.reply({ content: "Jalankan di text channel.", flags: MessageFlags.Ephemeral });
    return;
  }
  await channel.send(createQuickPanelEmbed(interaction.guild?.name ?? "", "AKADEMIK"));
  await interaction.reply({ content: "✅ Panel pemanggilan dikirim.", flags: MessageFlags.Ephemeral });
}

async function handleChannel(interaction: ChatInputCommandInteraction): Promise<void> {
  const channel = interaction.options.getChannel("channel", true);
  if (channel.type !== ChannelType.GuildText && channel.type !== ChannelType.GuildAnnouncement) {
    await interaction.reply({ content: "Pilih text atau announcement channel.", flags: MessageFlags.Ephemeral });
    return;
  }
  await setAnnouncementChannel(interaction.guildId!, channel.id);
  await interaction.reply({ content: `Channel pengumuman → <#${channel.id}>.`, flags: MessageFlags.Ephemeral });
}

async function handleListTa(interaction: ChatInputCommandInteraction): Promise<void> {
  const guild = await getGuildByDiscordId(interaction.guildId!);
  const list = guild?.taUserIds ?? [];
  await interaction.reply({
    content: list.length > 0 ? `## Registered TAs\n${list.map((id) => `<@${id}>`).join("\n")}` : "Belum ada TA.",
    flags: MessageFlags.Ephemeral,
  });
}

async function handleTaToggle(interaction: ChatInputCommandInteraction, sub: "add-ta" | "remove-ta"): Promise<void> {
  const user = interaction.options.getUser("user", true);
  if (sub === "add-ta") await addTaUser(interaction.guildId!, user.id);
  else await removeTaUser(interaction.guildId!, user.id);
  const verb = sub === "add-ta" ? "sekarang adalah" : "bukan lagi";
  await interaction.reply({ content: `${user.username} ${verb} TA.`, flags: MessageFlags.Ephemeral });
}

async function handleTransferOwner(interaction: ChatInputCommandInteraction): Promise<void> {
  const user = interaction.options.getUser("user", true);
  await transferGuildOwnership(interaction.guildId!, user.id);
  await interaction.reply({ content: `${user.username} sekarang Classync Owner.`, flags: MessageFlags.Ephemeral });
}
