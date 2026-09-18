import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  CategoryChannel,
  ChannelType,
  EmbedBuilder,
  OverwriteResolvable,
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
    .setColor(0x136afb)
    .addFields(
      { name: "📋 Daftar Tugas Saya", value: "Buka checklist tugas dan kelola status pengerjaan secara privat." },
      { name: "🙋 Tanya / Diskusi Konsep", value: "Masuk ke private concept room bersama rekan sekelas & TA." },
      { name: "🧑‍🏫 Antrean Asisten Dosen", value: "Khusus TA & Dosen untuk meninjau pertanyaan mahasiswa." }
    )
    .setFooter({ text: "Classync · Academic Discussion & Support" });

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId("task:panel-tasks").setLabel("📋 Buka Tugas Saya").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("task:panel-ask").setLabel("🙋 Tanya / Diskusi Konsep").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("task:panel-ta").setLabel("🧑‍🏫 Menu TA").setStyle(ButtonStyle.Secondary)
  );

  return { embeds: [embed], components: [row] };
}

export async function ensureRole(guild: Guild, name: string, color: number, mentionable: boolean): Promise<Role> {
  const existing = guild.roles.cache.find((r) => r.name.toLowerCase() === name.toLowerCase());
  if (existing) return existing;
  return guild.roles.create({ name, color, mentionable, reason: "Classync Academic Setup" });
}

async function ensureCategory(guild: Guild, name: string, overwrites?: OverwriteResolvable[]): Promise<CategoryChannel> {
  const existing = guild.channels.cache.find(
    (c): c is CategoryChannel => c.type === ChannelType.GuildCategory && c.name.toLowerCase() === name.toLowerCase()
  );
  if (existing) return existing;
  return guild.channels.create({ name, type: ChannelType.GuildCategory, ...(overwrites ? { permissionOverwrites: overwrites } : {}) });
}

async function ensureTextChannel(guild: Guild, name: string, parentId: string, overwrites?: OverwriteResolvable[]): Promise<TextChannel> {
  const existing = guild.channels.cache.find(
    (c): c is TextChannel => c.type === ChannelType.GuildText && c.parentId === parentId && c.name.toLowerCase() === name.toLowerCase()
  );
  if (existing) return existing;
  return guild.channels.create({ name, type: ChannelType.GuildText, parent: parentId, ...(overwrites ? { permissionOverwrites: overwrites } : {}) });
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

  if (!dbGuild.ownerUserId) await claimGuildOwnership(discordGuildId, callerUserId);
  await addTaUser(discordGuildId, callerUserId);

  const lecturerRole = await ensureRole(discordGuild, "Dosen Pengampu", 0xe67e22, true);
  const taRole = await ensureRole(discordGuild, "Teaching Assistant", 0x3498db, true);
  const studentRole = await ensureRole(discordGuild, "Mahasiswa", 0x2ecc71, false);

  const callerMember = await discordGuild.members.fetch(callerUserId).catch(() => null);
  if (callerMember) await callerMember.roles.add(taRole).catch(() => undefined);

  const everyoneId = discordGuild.roles.everyone.id;
  const botId = client.user?.id;

  const authActive = params.enableAuth ?? dbGuild.authEnabled;
  let verifiedRole: Role | undefined;

  if (authActive) {
    verifiedRole = await ensureRole(discordGuild, "Verified", 0x1abc9c, false);
    const verifyChannel = await setupVerificationChannel(discordGuild, verifiedRole, botId);
    await setGuildAuth(discordGuildId, { authEnabled: true, verifiedRoleId: verifiedRole.id, authChannelId: verifyChannel.id });
  }

  const infoCategory = await ensureCategory(
    discordGuild,
    "📢 INFORMASI AKADEMIK",
    authActive && verifiedRole
      ? [{ id: everyoneId, deny: [PermissionFlagsBits.ViewChannel] }, { id: verifiedRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory] }]
      : [{ id: everyoneId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory] }]
  );

  const announceChannel = await ensureTextChannel(discordGuild, "pengumuman-tugas", infoCategory.id, [
    { id: everyoneId, deny: [PermissionFlagsBits.SendMessages] },
    ...(botId ? [{ id: botId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages] }] : []),
    { id: taRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
    { id: lecturerRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
  ]);
  await setAnnouncementChannel(discordGuildId, announceChannel.id);

  await ensureTextChannel(discordGuild, "jadwal-kuliah", infoCategory.id, [
    { id: everyoneId, deny: [PermissionFlagsBits.SendMessages] },
    { id: taRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
    { id: lecturerRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
  ]);

  const discussionCategory = await ensureCategory(
    discordGuild,
    "💬 DISKUSI UMUM",
    authActive && verifiedRole
      ? [{ id: everyoneId, deny: [PermissionFlagsBits.ViewChannel] }, { id: verifiedRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }]
      : [{ id: everyoneId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }]
  );

  const qaChannel = await ensureTextChannel(discordGuild, "tanya-jawab", discussionCategory.id);
  await ensureTextChannel(discordGuild, "lounge", discussionCategory.id);

  const staffCategory = await ensureCategory(discordGuild, "🔒 RUANG TA & DOSEN", [
    { id: everyoneId, deny: [PermissionFlagsBits.ViewChannel] },
    ...(botId ? [{ id: botId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] }] : []),
    { id: taRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
    { id: lecturerRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
  ]);

  await ensureTextChannel(discordGuild, "ta-briefing", staffCategory.id);
  await ensureTextChannel(discordGuild, "ta-bot-alerts", staffCategory.id);

  const distinctClasses = await getDistinctClasses(dbGuild.id);
  if (distinctClasses.length > 0) {
    await setupClassroomCategories(discordGuild, distinctClasses, { taRole, lecturerRole, botId });
  }

  const panel = createQuickPanelEmbed(params.courseName, params.courseCode);
  const announceMsgs = await announceChannel.messages.fetch({ limit: 5 }).catch(() => null);
  if (!announceMsgs?.some((m) => m.embeds.some((e) => e.title?.includes("Panel Akademik")))) {
    await announceChannel.send(panel).catch(() => undefined);
  }

  const qaMsgs = await qaChannel.messages.fetch({ limit: 5 }).catch(() => null);
  if (!qaMsgs?.some((m) => m.embeds.some((e) => e.title?.includes("Panel Akademik")))) {
    await qaChannel.send(panel).catch(() => undefined);
  }

  return { announcementChannel: announceChannel, taRole, studentRole, lecturerRole, verifiedRole };
}
