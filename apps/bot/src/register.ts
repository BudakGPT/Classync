import "dotenv/config";
import { REST, Routes } from "discord.js";
import announceall from "./commands/announceall.js";
import setup from "./commands/setup.js";
import ta from "./commands/ta.js";
import tasks from "./commands/tasks.js";
import { requiredEnv } from "./config.js";

const token = requiredEnv("DISCORD_TOKEN");
const clientId = requiredEnv("DISCORD_CLIENT_ID");
const guildId = requiredEnv("DISCORD_GUILD_ID");
const commands = [setup, tasks, ta, announceall].map((command) => command.data.toJSON());

await new REST().setToken(token).put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
console.log(`Registered ${commands.length} Classync commands to guild ${guildId}.`);
