import {
  MessageFlags,
  ChannelType,
  PermissionFlagsBits,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { addTaUser, getOrCreateGuild, setAnnouncementChannel } from "@classync/core";

export default {
  data: new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Configure Classync for this server")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) => sub.setName("channel").setDescription("Set the announcement channel")
      .addChannelOption((option) => option.setName("channel").setDescription("Announcement channel").setRequired(true)))
    .addSubcommand((sub) => sub.setName("add-ta").setDescription("Grant TA access")
      .addUserOption((option) => option.setName("user").setDescription("TA user").setRequired(true))),
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guildId || !interaction.guild || !interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      await interaction.reply({ content: "Manage Server permission is required.", flags: MessageFlags.Ephemeral });
      return;
    }
    await getOrCreateGuild(interaction.guildId, interaction.guild.name);
    if (interaction.options.getSubcommand() === "add-ta") {
      const user = interaction.options.getUser("user", true);
      await addTaUser(interaction.guildId, user.id);
      await interaction.reply({ content: `${user.username} can now use /ta.`, flags: MessageFlags.Ephemeral });
      return;
    }
    const channel = interaction.options.getChannel("channel", true);
    if (channel.type !== ChannelType.GuildText && channel.type !== ChannelType.GuildAnnouncement) {
      await interaction.reply({ content: "Choose a text channel.", flags: MessageFlags.Ephemeral });
      return;
    }
    await setAnnouncementChannel(interaction.guildId, channel.id);
    await addTaUser(interaction.guildId, interaction.user.id);
    await interaction.reply({ content: `Configured announcements: <#${channel.id}>. You are now a TA.`, flags: MessageFlags.Ephemeral });
  },
};
