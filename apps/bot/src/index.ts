import "dotenv/config";
import {
  Client,
  GatewayIntentBits,
  Collection,
  Events,
  MessageFlags,
  type InteractionReplyOptions,
} from "discord.js";
import { readdirSync } from "fs";
import { fileURLToPath, pathToFileURL } from "url";
import { join, dirname } from "path";
import cron from "node-cron";

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface Command {
  data: { name: string; toJSON: () => unknown };
  execute: (interaction: import("discord.js").Interaction) => Promise<void>;
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
});

const commands = new Collection<string, Command>();

// Load all commands
const commandsPath = join(__dirname, "commands");
for (const file of readdirSync(commandsPath).filter((f) => f.endsWith(".ts") || f.endsWith(".js"))) {
  const mod = await import(pathToFileURL(join(commandsPath, file)).href);
  commands.set(mod.default.data.name, mod.default);
}

client.once(Events.ClientReady, async (c) => {
  console.log(`✅ Bot ready: ${c.user.tag}`);

  // Start jobs
  const { startDeliverJob } = await import("./jobs/deliver");
  const { startReminderJob } = await import("./jobs/reminders");
  startDeliverJob(c);
  startReminderJob(c);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(`Error in /${interaction.commandName}:`, err);
    const msg: InteractionReplyOptions = {
      content: "❌ Something went wrong. Try again.",
      flags: MessageFlags.Ephemeral,
    };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(msg);
    } else {
      await interaction.reply(msg);
    }
  }
});

// Auto-ingest: messageCreate in announcement channel (Late MVP / B6).
// Disabled by default: it fires on every message and is the only feature that can fail
// on stage. `/ta add-item` is the scripted fallback. Set ENABLE_AUTO_INGEST=true to re-enable.
if (process.env.ENABLE_AUTO_INGEST === "true") {
  client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;
    const { handleAutoIngest } = await import("./interactions/autoIngest");
    await handleAutoIngest(client, message).catch(console.error);
  });
  console.log("📥 Auto-ingest ENABLED");
} else {
  console.log("📥 Auto-ingest disabled (set ENABLE_AUTO_INGEST=true to enable)");
}

await client.login(process.env.DISCORD_TOKEN);
