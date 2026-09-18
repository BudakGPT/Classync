import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  PermissionFlagsBits,
  type Client,
  type Guild,
  type Role,
  type TextChannel,
} from "discord.js";
import {
  addTaUser,
  claimGuildOwnership,
  getDistinctClasses,
  getOrCreateGuild,
  setAnnouncementChannel,
  setGuildAuth,
} from "@classync/core";
import { setupVerificationChannel } from "./verificationGate.js";
import { setupClassroomCategories } from "./classCategories.js";

export function createQuickPanelEmbed(courseName: string, courseCode: string) {
  const embed = new EmbedBuilder()
    .setTitle(`🎓 Classync — Panel Akademik: ${courseName}`)
    .setDescription(
      `Selamat datang di ruang belajar terintegrasi untuk kelas **${courseCode}**.\n\n` +
      `Gunakan tombol interaktif di bawah untuk mengakses tugas, berdiskusi di private room, atau bantuan asisten dosen.`
    )
    .setColor(0x5865f2)
    .addFields(
      {
        name: "📋 Daftar Tugas Saya",
        value: "Buka checklist tugas dan kelola status pengerjaan secara privat (hanya Anda yang melihat).",
      },
      {
        name: "🙋 Tanya / Diskusi Konsep",
        value: "Masuk ke private concept room bersama teman sekelas & TA untuk berdiskusi topik tugas.",
      },
      {
        name: "🧑‍🏫 Antrean Asisten Dosen",
        value: "Khusus TA & Dosen untuk meninjau pertanyaan mahasiswa yang membutuhkan klarifikasi.",
      }
    )
    .setFooter({ text: "Classync · Academic Discussion & Support" });

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("task:panel-tasks")
      .setLabel("📋 Buka Tugas Saya")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("task:panel-ask")
      .setLabel("🙋 Tanya / Diskusi Konsep")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId("task:panel-ta")
      .setLabel("🧑‍🏫 Menu TA")
      .setStyle(ButtonStyle.Secondary)
  );

  return { embeds: [embed], components: [row] };
}

export async function ensureRole(guild: Guild, name: string, color: number, mentionable: boolean): Promise<Role> {
  const existing = guild.roles.cache.find((r) => r.name.toLowerCase() === name.toLowerCase());
  if (existing) return existing;
  return guild.roles.create({
    name,
    color,
    mentionable,
    reason: "Classync Academic Setup",
  });
}

export async function setupAcademicServer(
  client: Client,
  discordGuildId: string,
  callerUserId: string,
  params: { courseName: string; courseCode: string; enableAuth?: boolean }
): Promise<{
  announcementChannel: TextChannel | null;
  taRole: Role;
  studentRole: Role;
  lecturerRole: Role;
  verifiedRole?: Role;
}> {
  const discordGuild = await client.guilds.fetch(discordGuildId);
  const dbGuild = await getOrCreateGuild(discordGuildId, discordGuild.name);

  if (!dbGuild.ownerUserId) {
    await claimGuildOwnership(discordGuildId, callerUserId);
  }
  await addTaUser(discordGuildId, callerUserId);

  // 1. Roles
  const lecturerRole = await ensureRole(discordGuild, "Dosen Pengampu", 0xe67e22, true);
  const taRole = await ensureRole(discordGuild, "Teaching Assistant", 0x3498db, true);
  const studentRole = await ensureRole(discordGuild, "Mahasiswa", 0x2ecc71, false);

  const callerMember = await discordGuild.members.fetch(callerUserId).catch(() => null);
  if (callerMember) await callerMember.roles.add(taRole).catch(() => undefined);

  const everyoneId = discordGuild.roles.everyone.id;
  const botId = client.user?.id;

  // 2. Auth Verification Gate (if enabled)
  const authActive = params.enableAuth ?? dbGuild.authEnabled;
  let verifiedRole: Role | undefined;

  if (authActive) {
    verifiedRole = await ensureRole(discordGuild, "Verified", 0x1abc9c, false);
    const verifyChannel = await setupVerificationChannel(discordGuild, verifiedRole, botId);
    await setGuildAuth(discordGuildId, {
      authEnabled: true,
      verifiedRoleId: verifiedRole.id,
      authChannelId: verifyChannel.id,
    });
  }

  // 3. Category: INFORMASI AKADEMIK
  const infoCategory = await discordGuild.channels.create({
    name: "📢 INFORMASI AKADEMIK",
    type: ChannelType.GuildCategory,
    permissionOverwrites: authActive && verifiedRole
      ? [
          { id: everyoneId, deny: [PermissionFlagsBits.ViewChannel] },
          { id: verifiedRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory] },
        ]
      : [{ id: everyoneId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory] }],
  });

  const announceChannel = await discordGuild.channels.create({
    name: "pengumuman-tugas",
    type: ChannelType.GuildText,
    parent: infoCategory.id,
    permissionOverwrites: [
      { id: everyoneId, deny: [PermissionFlagsBits.SendMessages] },
      ...(botId ? [{ id: botId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages] }] : []),
      { id: taRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
      { id: lecturerRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
    ],
  });
  await setAnnouncementChannel(discordGuildId, announceChannel.id);

  await discordGuild.channels.create({
    name: "jadwal-kuliah",
    type: ChannelType.GuildText,
    parent: infoCategory.id,
    permissionOverwrites: [
      { id: everyoneId, deny: [PermissionFlagsBits.SendMessages] },
      { id: taRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
      { id: lecturerRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
    ],
  });

  // 4. Category: DISKUSI KELAS
  const discussionCategory = await discordGuild.channels.create({
    name: "💬 DISKUSI UMUM",
    type: ChannelType.GuildCategory,
    permissionOverwrites: authActive && verifiedRole
      ? [
          { id: everyoneId, deny: [PermissionFlagsBits.ViewChannel] },
          { id: verifiedRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
        ]
      : [{ id: everyoneId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }],
  });

  const qaChannel = await discordGuild.channels.create({
    name: "tanya-jawab",
    type: ChannelType.GuildText,
    parent: discussionCategory.id,
  });

  await discordGuild.channels.create({
    name: "lounge",
    type: ChannelType.GuildText,
    parent: discussionCategory.id,
  });

  // 5. Category: RUANG TA & DOSEN
  const staffCategory = await discordGuild.channels.create({
    name: "🔒 RUANG TA & DOSEN",
    type: ChannelType.GuildCategory,
    permissionOverwrites: [
      { id: everyoneId, deny: [PermissionFlagsBits.ViewChannel] },
      ...(botId ? [{ id: botId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] }] : []),
      { id: taRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
      { id: lecturerRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
    ],
  });

  await discordGuild.channels.create({ name: "ta-briefing", type: ChannelType.GuildText, parent: staffCategory.id });
  await discordGuild.channels.create({ name: "ta-bot-alerts", type: ChannelType.GuildText, parent: staffCategory.id });

  // 6. Per-class Categories (from uploaded Roster)
  const distinctClasses = await getDistinctClasses(dbGuild.id);
  if (distinctClasses.length > 0) {
    await setupClassroomCategories(discordGuild, distinctClasses, { taRole, lecturerRole, botId });
  }

  // 7. Send Quick-Panels
  const panel = createQuickPanelEmbed(params.courseName, params.courseCode);
  await announceChannel.send(panel).catch(() => undefined);
  await qaChannel.send(panel).catch(() => undefined);

  return { announcementChannel: announceChannel, taRole, studentRole, lecturerRole, verifiedRole };
}
