import "dotenv/config";
import {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
  Events,
  MessageFlags,
  type Interaction,
  type InteractionReplyOptions,
} from "discord.js";
import { readdirSync } from "fs";
import { fileURLToPath, pathToFileURL } from "url";
import { join, dirname } from "path";
import { handleComponent } from "./interactions/router";
import { handleDirectMessage } from "./interactions/relay";
import { handleAutoIngest } from "./interactions/autoIngest";

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
  // Required for messageCreate to fire in DMs (peer-match relay).
  partials: [Partials.Channel],
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
  const { startMatchExpiryJob } = await import("./jobs/matchExpiry");
  startDeliverJob(c);
  startReminderJob(c);
  startMatchExpiryJob(c);
});

async function reportInteractionError(interaction: Interaction): Promise<void> {
  if (!interaction.isRepliable()) return;
  const msg: InteractionReplyOptions = { content: "❌ Something went wrong. Try again.", flags: MessageFlags.Ephemeral };
  try {
    if (interaction.replied || interaction.deferred) await interaction.followUp(msg);
    else await interaction.reply(msg);
  } catch (err) {
    console.error("[interaction] Could not send error response:", err);
  }
}

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      const command = commands.get(interaction.commandName);
      if (command) await command.execute(interaction);
      return;
    }
    await handleComponent(interaction);
  } catch (err) {
    console.error("[interaction] Error:", err);
    await reportInteractionError(interaction);
  }
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  if (!message.guildId) {
    // DM: peer-match relay
    await handleDirectMessage(client, message).catch(console.error);
    return;
  }
  // Auto-ingest: messageCreate in announcement channel (Late MVP / B6)
  await handleAutoIngest(client, message).catch(console.error);
});

await client.login(process.env.DISCORD_TOKEN);
