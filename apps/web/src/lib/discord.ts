/** Deep link into a Discord channel; the web never talks to Discord, it only links. */
export const channelUrl = (discordGuildId: string, channelId: string) =>
  `https://discord.com/channels/${discordGuildId}/${channelId}`;
