import {
  SlashCommandBuilder,
  MessageFlags,
  PermissionFlagsBits,
  type ChatInputCommandInteraction,
} from "discord.js";
import {
  getOrCreateGuild,
  setAnnouncementChannel,
  addTaUser,
} from "@classync/core";

export default {
  data: new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Configure Classync for this server")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName("channel")
        .setDescription("Set the announcement channel to monitor")
        .addChannelOption((opt) =>
          opt.setName("channel").setDescription("Announcement channel").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("add-ta")
        .setDescription("Grant TA access to a user")
        .addUserOption((opt) =>
          opt.setName("user").setDescription("User to add as TA").setRequired(true)
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guildId || !interaction.guild) {
      await interaction.reply({ content: "❌ Must be used in a server.", flags: MessageFlags.Ephemeral });
      return;
    }

    const sub = interaction.options.getSubcommand();

    if (sub === "channel") {
      const channel = interaction.options.getChannel("channel", true);
      await getOrCreateGuild(interaction.guildId, interaction.guild.name);
      await setAnnouncementChannel(interaction.guildId, channel.id);
      await addTaUser(interaction.guildId, interaction.user.id);
      await interaction.reply({
        content: `✅ Classync configured!\n📢 Monitoring: <#${channel.id}>\n👤 You are now a TA.`,
        flags: MessageFlags.Ephemeral,
      });
    } else if (sub === "add-ta") {
      const user = interaction.options.getUser("user", true);
      await addTaUser(interaction.guildId, user.id);
      await interaction.reply({
        content: `✅ <@${user.id}> is now a TA.`,
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
