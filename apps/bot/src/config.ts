export function requiredEnv(name: "DISCORD_TOKEN" | "DISCORD_CLIENT_ID" | "DISCORD_GUILD_ID"): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}
