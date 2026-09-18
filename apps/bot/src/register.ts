import "dotenv/config";
import { REST, Routes } from "discord.js";
import { readdirSync } from "fs";
import { fileURLToPath, pathToFileURL } from "url";
import { join, dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rest = new REST().setToken(process.env.DISCORD_TOKEN!);

const commandsPath = join(__dirname, "commands");
const body: unknown[] = [];

for (const file of readdirSync(commandsPath).filter((f) => f.endsWith(".ts") || f.endsWith(".js"))) {
  const mod = await import(pathToFileURL(join(commandsPath, file)).href);
  body.push(mod.default.data.toJSON());
}

// Register per-guild (instant) — never global
const guildId = process.env.DISCORD_GUILD_ID!;
const clientId = process.env.DISCORD_CLIENT_ID!;

await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body });
console.log(`✅ Registered ${body.length} commands to guild ${guildId}`);
