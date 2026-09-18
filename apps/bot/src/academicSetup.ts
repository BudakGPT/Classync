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
  getOrCreateGuild,
  setAnnouncementChannel,
} from "@classync/core";

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
  params: { courseName: string; courseCode: string }
): Promise<{
  announcementChannel: TextChannel | null;
  taRole: Role;
  studentRole: Role;
  lecturerRole: Role;
}> {
  const discordGuild = await client.guilds.fetch(discordGuildId);
  const dbGuild = await getOrCreateGuild(discordGuildId, discordGuild.name);

  // Claim ownership if not yet claimed
  if (!dbGuild.ownerUserId) {
    await claimGuildOwnership(discordGuildId, callerUserId);
  }
  // Add caller as TA
  await addTaUser(discordGuildId, callerUserId);

  // 1. Create Academic Roles
  const lecturerRole = await ensureRole(discordGuild, "Dosen Pengampu", 0xe67e22, true);
  const taRole = await ensureRole(discordGuild, "Teaching Assistant", 0x3498db, true);
  const studentRole = await ensureRole(discordGuild, "Mahasiswa", 0x2ecc71, false);

  // Assign TA role to caller if present in guild
  const callerMember = await discordGuild.members.fetch(callerUserId).catch(() => null);
  if (callerMember) {
    await callerMember.roles.add(taRole).catch(() => undefined);
  }

  const everyoneId = discordGuild.roles.everyone.id;
  const botId = client.user?.id;

  // 2. Category: INFORMASI AKADEMIK
  const infoCategory = await discordGuild.channels.create({
    name: "📢 INFORMASI AKADEMIK",
    type: ChannelType.GuildCategory,
    permissionOverwrites: [
      { id: everyoneId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory] },
    ],
  });

  // Channel: #pengumuman-tugas (Announcement channel - only TAs/Lecturer can post)
  const announceChannel = await discordGuild.channels.create({
    name: "pengumuman-tugas",
    type: ChannelType.GuildText,
    parent: infoCategory.id,
    permissionOverwrites: [
      { id: everyoneId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory], deny: [PermissionFlagsBits.SendMessages] },
      ...(botId ? [{ id: botId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages] }] : []),
      { id: taRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
      { id: lecturerRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
    ],
  });

  // Save announcement channel in DB
  await setAnnouncementChannel(discordGuildId, announceChannel.id);

  // Channel: #jadwal-kuliah (Schedule)
  await discordGuild.channels.create({
    name: "jadwal-kuliah",
    type: ChannelType.GuildText,
    parent: infoCategory.id,
    permissionOverwrites: [
      { id: everyoneId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory], deny: [PermissionFlagsBits.SendMessages] },
      { id: taRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
      { id: lecturerRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
    ],
  });

  // 3. Category: DISKUSI KELAS
  const discussionCategory = await discordGuild.channels.create({
    name: "💬 DISKUSI KELAS",
    type: ChannelType.GuildCategory,
    permissionOverwrites: [
      { id: everyoneId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
    ],
  });

  // Channel: #tanya-jawab
  const qaChannel = await discordGuild.channels.create({
    name: "tanya-jawab",
    type: ChannelType.GuildText,
    parent: discussionCategory.id,
  });

  // Channel: #lounge
  await discordGuild.channels.create({
    name: "lounge",
    type: ChannelType.GuildText,
    parent: discussionCategory.id,
  });

  // 4. Category: STAFF & TA ONLY (Private)
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

  await discordGuild.channels.create({
    name: "ta-briefing",
    type: ChannelType.GuildText,
    parent: staffCategory.id,
  });

  await discordGuild.channels.create({
    name: "ta-bot-alerts",
    type: ChannelType.GuildText,
    parent: staffCategory.id,
  });

  // 5. Send Quick-Panel to #pengumuman-tugas and #tanya-jawab
  const panel = createQuickPanelEmbed(params.courseName, params.courseCode);
  await announceChannel.send(panel).catch(() => undefined);
  await qaChannel.send(panel).catch(() => undefined);

  return {
    announcementChannel: announceChannel,
    taRole,
    studentRole,
    lecturerRole,
  };
}
