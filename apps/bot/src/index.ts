import "dotenv/config";
import { Client, Events, GatewayIntentBits, MessageFlags } from "discord.js";
import setup from "./commands/setup.js";
import ta from "./commands/ta.js";
import tasks from "./commands/tasks.js";
import { requiredEnv } from "./config.js";
import { handleReminderInteraction, handleTaskInteraction } from "./interactions/tasks.js";
import { handleTaAutocomplete } from "./interactions/ta.js";
import { startDeliverJob } from "./jobs/deliver.js";
import { startReminderJob } from "./jobs/reminders.js";

const commands = new Map([[setup.data.name, setup], [tasks.data.name, tasks], [ta.data.name, ta]]);
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Classync bot ready: ${readyClient.user.tag}`);
  startDeliverJob(readyClient);
  startReminderJob(readyClient);
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
      if (await handleTaskInteraction(interaction)) return;
      await handleReminderInteraction(interaction);
      return;
    }
    if (interaction.isStringSelectMenu() || interaction.isModalSubmit()) await handleTaskInteraction(interaction);
  } catch (error) {
    console.error("[interaction] Error", error);
    if (interaction.isRepliable()) {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: "Something went wrong. Please try again.", flags: MessageFlags.Ephemeral });
      } else {
        await interaction.reply({ content: "Something went wrong. Please try again.", flags: MessageFlags.Ephemeral });
      }
    }
  }
});

await client.login(requiredEnv("DISCORD_TOKEN"));
