import "dotenv/config";
import {
  Client,
  Events,
  GatewayIntentBits,
  MessageFlags,
  Partials,
  type Interaction,
} from "discord.js";
import setup from "./commands/setup.js";
import ta from "./commands/ta.js";
import tasks from "./commands/tasks.js";
import { requiredEnv } from "./config.js";
import { handleHelperToggle } from "./interactions/helper.js";
import { handleMatchButton } from "./interactions/match.js";
import { handleDirectMessage } from "./interactions/relay.js";
import { handleReminderInteraction } from "./interactions/reminders.js";
import { handleSetupModal } from "./interactions/setup.js";
import { handleVerificationButton, handleVerificationModal } from "./interactions/verification.js";
import { handleTaAutocomplete } from "./interactions/ta.js";
import { handleTaskInteraction } from "./interactions/tasks.js";
import { startDeliverJob } from "./jobs/deliver.js";
import { startMatchExpiryJob } from "./jobs/matchExpiry.js";
import { startReminderJob } from "./jobs/reminders.js";
import { handleTopicRoomMessage } from "./notifications.js";

const commands = new Map([
  [setup.data.name, setup],
  [tasks.data.name, tasks],
  [ta.data.name, ta],
]);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
  ],
  // Required for messageCreate to fire in DMs (peer-match relay).
  partials: [Partials.Channel],
});

async function reportInteractionError(interaction: Interaction): Promise<void> {
  if (!interaction.isRepliable()) return;
  try {
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: "Something went wrong. Please try again.", flags: MessageFlags.Ephemeral });
    } else {
      await interaction.reply({ content: "Something went wrong. Please try again.", flags: MessageFlags.Ephemeral });
    }
  } catch (responseError) {
    console.error("[interaction] Could not send error response", responseError);
  }
}

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Classync bot ready: ${readyClient.user.tag}`);
  startDeliverJob(readyClient);
  startReminderJob(readyClient);
  startMatchExpiryJob(readyClient);
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isAutocomplete()) {
      if (interaction.commandName === "ta") await handleTaAutocomplete(interaction);
      return;
    }
    if (interaction.isChatInputCommand()) {
      const command = commands.get(interaction.commandName);
      if (command) await command.execute(interaction);
      return;
    }
    if (interaction.isButton()) {
      const prefix = interaction.customId.split(":")[0];
      if (prefix === "auth") return void await handleVerificationButton(interaction);
      if (prefix === "match") return void await handleMatchButton(interaction);
      if (prefix === "helper") return void await handleHelperToggle(interaction);
      if (await handleTaskInteraction(interaction)) return;
      await handleReminderInteraction(interaction);
      return;
    }
    if (interaction.isModalSubmit()) {
      if (await handleVerificationModal(interaction)) return;
      if (interaction.customId === "setup:academic-modal") {
        await handleSetupModal(interaction);
        return;
      }
      await handleTaskInteraction(interaction);
      return;
    }
    if (interaction.isStringSelectMenu()) {
      await handleTaskInteraction(interaction);
      return;
    }
  } catch (error) {
    console.error("[interaction] Error", error);
    await reportInteractionError(interaction);
  }
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  if (!message.guildId) {
    // DM: peer-match relay. Text is forwarded, never stored.
    await handleDirectMessage(client, message).catch((err) => {
      console.error("[messageCreate] Error relaying DM", err);
    });
    return;
  }
  await handleTopicRoomMessage(client, message).catch((err) => {
    console.error("[messageCreate] Error handling room message", err);
  });
});

client.on(Events.Error, (error) => console.error("[discord] Client error", error));

await client.login(requiredEnv("DISCORD_TOKEN"));
