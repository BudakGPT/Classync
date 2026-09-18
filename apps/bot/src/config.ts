import dotenv from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// npm workspace scripts run from apps/bot, while the shared environment lives at repo root.
const moduleDirectory = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(moduleDirectory, "../../../.env") });

export function requiredEnv(name: "DISCORD_TOKEN" | "DISCORD_CLIENT_ID" | "DISCORD_GUILD_ID"): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

/** Public dashboard origin used in embeds. Falls back to the local dev server. */
export function webUrl(): string {
  return (process.env.WEB_URL?.trim() || "http://localhost:3000").replace(/\/+$/, "");
}
