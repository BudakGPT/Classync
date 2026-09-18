import {
  ChannelType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import {
  addTaUser,
  claimGuildOwnership,
  getGuildByDiscordId,
  getOrCreateGuild,
  removeTaUser,
  setAnnouncementChannel,
  setHelpForumChannel,
  transferGuildOwnership,
} from "@classync/core";

async function canManageSetup(interaction: ChatInputCommandInteraction): Promise<boolean> {
  if (!interaction.guildId || !interaction.guild) return false;
  let guild = await getGuildByDiscordId(interaction.guildId);
  const subcommand = interaction.options.getSubcommand();
  if (!guild) {
    if (subcommand !== "channel" || !interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) return false;
    guild = await getOrCreateGuild(interaction.guildId, interaction.guild.name);
  }
  if (!guild.ownerUserId) {
    if (subcommand !== "channel" || !interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) return false;
    const result = await claimGuildOwnership(interaction.guildId, interaction.user.id);
    return result.guild.ownerUserId === interaction.user.id;
  }
  if (guild.ownerUserId === interaction.user.id) return true;

  // Recovery is deliberately limited to the Discord server owner after the stored owner has left.
  if (interaction.guild.ownerId === interaction.user.id) {
    const ownerStillPresent = await interaction.guild.members.fetch(guild.ownerUserId).catch(() => null);
    if (!ownerStillPresent) {
      await transferGuildOwnership(interaction.guildId, interaction.user.id);
      console.warn(`[setup] Ownership of ${interaction.guildId} recovered by Discord server owner ${interaction.user.id}`);
      return true;
    }
  }
  return false;
}

export default {
  data: new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Configure Classync for this server")
    .addSubcommand((sub) => sub.setName("channel").setDescription("Set the announcement channel")
      .addChannelOption((option) => option.setName("channel").setDescription("Announcement channel").setRequired(true)))
    .addSubcommand((sub) => sub.setName("forum").setDescription("Set the discussion forum or thread channel")
      .addChannelOption((option) => option.setName("channel").setDescription("Forum, text, or announcement channel").setRequired(true)))
    .addSubcommand((sub) => sub.setName("create-forum").setDescription("Create and configure #classync-help"))
    .addSubcommand((sub) => sub.setName("add-ta").setDescription("Grant TA access")
      .addUserOption((option) => option.setName("user").setDescription("TA user").setRequired(true)))
    .addSubcommand((sub) => sub.setName("remove-ta").setDescription("Remove TA access")
      .addUserOption((option) => option.setName("user").setDescription("TA user").setRequired(true)))
    .addSubcommand((sub) => sub.setName("list-ta").setDescription("List registered TAs"))
    .addSubcommand((sub) => sub.setName("transfer-owner").setDescription("Transfer Classync ownership")
      .addUserOption((option) => option.setName("user").setDescription("New Classync Owner").setRequired(true))),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guildId || !interaction.guild) {
      await interaction.reply({ content: "Run this command in the class server.", flags: MessageFlags.Ephemeral });
      return;
    }
    if (!await canManageSetup(interaction)) {
      await interaction.reply({
        content: "Only the Classync Owner can manage setup. Before ownership is claimed, `/setup channel` requires Manage Server.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const subcommand = interaction.options.getSubcommand();
    if (subcommand === "list-ta") {
      const guild = await getGuildByDiscordId(interaction.guildId);
      const taList = guild?.taUserIds ?? [];
      await interaction.reply({
        content: taList.length > 0 ? `## Registered TAs\n${taList.map((id) => `<@${id}>`).join("\n")}` : "No TAs have been registered yet.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    if (subcommand === "add-ta" || subcommand === "remove-ta") {
      const user = interaction.options.getUser("user", true);
      if (subcommand === "add-ta") await addTaUser(interaction.guildId, user.id);
      else await removeTaUser(interaction.guildId, user.id);
      await interaction.reply({ content: `${user.username} ${subcommand === "add-ta" ? "can now use" : "can no longer use"} /ta.`, flags: MessageFlags.Ephemeral });
      return;
    }
    if (subcommand === "transfer-owner") {
      const user = interaction.options.getUser("user", true);
      await transferGuildOwnership(interaction.guildId, user.id);
      await interaction.reply({ content: `${user.username} is now the Classync Owner.`, flags: MessageFlags.Ephemeral });
      return;
    }
    if (subcommand === "create-forum") {
      const channel = await interaction.guild.channels.create({ name: "classync-help", type: ChannelType.GuildForum, reason: "Classync topic rooms" }).catch(() => null);
      if (!channel) {
        await interaction.reply({ content: "I could not create the forum. Grant me Manage Channels, or use `/setup forum` with an existing channel.", flags: MessageFlags.Ephemeral });
        return;
      }
      await setHelpForumChannel(interaction.guildId, channel.id);
      await interaction.reply({ content: `Discussion forum configured: <#${channel.id}>.`, flags: MessageFlags.Ephemeral });
      return;
    }

    const channel = interaction.options.getChannel("channel", true);
    if (subcommand === "channel") {
      if (channel.type !== ChannelType.GuildText && channel.type !== ChannelType.GuildAnnouncement) {
        await interaction.reply({ content: "Choose a text or announcement channel.", flags: MessageFlags.Ephemeral });
        return;
      }
      await setAnnouncementChannel(interaction.guildId, channel.id);
      await interaction.reply({ content: `Announcements configured: <#${channel.id}>. You are the Classync Owner; use \`/setup add-ta\` to assign TAs.`, flags: MessageFlags.Ephemeral });
      return;
    }
    if (channel.type !== ChannelType.GuildForum && channel.type !== ChannelType.GuildText && channel.type !== ChannelType.GuildAnnouncement) {
      await interaction.reply({ content: "Choose a forum channel, or a text/announcement channel for thread fallback.", flags: MessageFlags.Ephemeral });
      return;
    }
    await setHelpForumChannel(interaction.guildId, channel.id);
    await interaction.reply({ content: `Discussion rooms configured in <#${channel.id}>.`, flags: MessageFlags.Ephemeral });
  },
};
