import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  PermissionFlagsBits,
  type Guild,
  type Role,
  type TextChannel,
} from "discord.js";

export function createVerificationEmbed(guildName: string) {
  const embed = new EmbedBuilder()
    .setTitle(`🔐 Verifikasi Identitas Mahasiswa & Asdos — ${guildName}`)
    .setDescription(
      `Selamat datang di server Discord kelas **${guildName}**!\n\n` +
      `Untuk menjaga keamanan, privasi akademik, dan pembagian ruang kelas otomatis, Anda diwajibkan melakukan verifikasi identitas menggunakan **NPM / NIM** yang terdaftar di Sistem Akademik.\n\n` +
      `**Setelah Terverifikasi:**\n` +
      `• Role **@Verified** & **@Mahasiswa** / **@Teaching Assistant** akan diberikan secara otomatis.\n` +
      `• Channel diskusi umum dan channel khusus kelas Anda (misal: *Kelas A*, *Kelas B*) akan otomatis terbuka.\n` +
      `• Nickname Discord Anda di server ini akan disesuaikan menjadi format \`NPM - Nama Lengkap\`.\n\n` +
      `Silakan klik tombol di bawah untuk memulai verifikasi.`
    )
    .setColor(0x1abc9c)
    .setFooter({ text: "Classync Identity Verification Gate · 1 Akun = 1 NPM" });

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("auth:verify")
      .setLabel("🔐 Verifikasi Identitas (NPM)")
      .setStyle(ButtonStyle.Success)
  );

  return { embeds: [embed], components: [row] };
}

export async function setupVerificationChannel(
  guild: Guild,
  verifiedRole: Role,
  botId?: string
): Promise<TextChannel> {
  const everyoneId = guild.roles.everyone.id;

  // 1. Create or find verification category
  let authCategory = guild.channels.cache.find(
    (c) => c.type === ChannelType.GuildCategory && c.name.includes("GERBANG VERIFIKASI")
  );

  if (!authCategory) {
    authCategory = await guild.channels.create({
      name: "🔐 GERBANG VERIFIKASI",
      type: ChannelType.GuildCategory,
      permissionOverwrites: [
        {
          id: everyoneId,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
          deny: [PermissionFlagsBits.SendMessages],
        },
      ],
    });
  }

  // 2. Create #verifikasi channel
  const verifyChannel = await guild.channels.create({
    name: "verifikasi",
    type: ChannelType.GuildText,
    parent: authCategory.id,
    permissionOverwrites: [
      {
        id: everyoneId,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
        deny: [PermissionFlagsBits.SendMessages],
      },
      ...(botId
        ? [
            {
              id: botId,
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ManageMessages,
              ],
            },
          ]
        : []),
    ],
  });

  const panel = createVerificationEmbed(guild.name);
  await verifyChannel.send(panel).catch(() => undefined);

  return verifyChannel;
}
