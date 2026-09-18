import {
  ChannelType,
  PermissionFlagsBits,
  type Guild,
  type Role,
} from "discord.js";
import { createQuickPanelEmbed, ensureRole } from "./academicSetup.js";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "");
}

export async function setupClassroomCategories(
  guild: Guild,
  classes: string[],
  roles: {
    taRole: Role;
    lecturerRole: Role;
    botId?: string;
  }
): Promise<void> {
  const everyoneId = guild.roles.everyone.id;

  for (const className of classes) {
    const classRole = await ensureRole(guild, className, 0x9b59b6, false);
    const categoryName = `📁 ${className.toUpperCase()}`;

    // Skip if category already exists
    let category = guild.channels.cache.find(
      (c) => c.type === ChannelType.GuildCategory && c.name.toLowerCase() === categoryName.toLowerCase()
    );

    if (!category) {
      category = await guild.channels.create({
        name: categoryName,
        type: ChannelType.GuildCategory,
        permissionOverwrites: [
          { id: everyoneId, deny: [PermissionFlagsBits.ViewChannel] },
          {
            id: classRole.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
          },
          {
            id: roles.taRole.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
          },
          {
            id: roles.lecturerRole.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
          },
          ...(roles.botId
            ? [
                {
                  id: roles.botId,
                  allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ManageChannels,
                    PermissionFlagsBits.ManageMessages,
                  ],
                },
              ]
            : []),
        ],
      });
    }

    const slug = slugify(className);

    // Channel 1: Announcement per class
    await guild.channels.create({
      name: `pengumuman-${slug}`,
      type: ChannelType.GuildText,
      parent: category.id,
      permissionOverwrites: [
        {
          id: everyoneId,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: classRole.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
          deny: [PermissionFlagsBits.SendMessages],
        },
        {
          id: roles.taRole.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
        },
        {
          id: roles.lecturerRole.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
        },
      ],
    });

    // Channel 2: Discussion per class
    const discussionChannel = await guild.channels.create({
      name: `diskusi-${slug}`,
      type: ChannelType.GuildText,
      parent: category.id,
    });

    const panel = createQuickPanelEmbed(guild.name, className);
    await discussionChannel.send(panel).catch(() => undefined);
  }
}
