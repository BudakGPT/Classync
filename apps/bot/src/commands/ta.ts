import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { handleTaCommand } from "../interactions/ta.js";

export default {
  data: new SlashCommandBuilder()
    .setName("ta")
    .setDescription("TA-only Classync tools")
    .addSubcommand((sub) => sub.setName("add-item").setDescription("Add a task")
      .addStringOption((option) => option.setName("title").setDescription("Task title").setRequired(true))
      .addStringOption((option) => option.setName("due").setDescription("YYYY-MM-DD or YYYY-MM-DD HH:mm (Jakarta)"))
      .addStringOption((option) => option.setName("kind").setDescription("Task type").addChoices(
        { name: "Assignment", value: "ASSIGNMENT" }, { name: "Quiz", value: "QUIZ" },
        { name: "Exam", value: "EXAM" }, { name: "Reading", value: "READING" })))
    .addSubcommand((sub) => sub.setName("queue").setDescription("View TA-help requests and discussion rooms"))
    .addSubcommand((sub) => sub.setName("answer").setDescription("Answer a concept")
      .addStringOption((option) => option.setName("concept").setDescription("Concept").setRequired(true).setAutocomplete(true))
      .addStringOption((option) => option.setName("body").setDescription("Answer").setRequired(true)))
    .addSubcommand((sub) => sub.setName("archive-room").setDescription("Lock and archive a discussion room")
      .addStringOption((option) => option.setName("concept").setDescription("Concept").setRequired(true).setAutocomplete(true)))
    .addSubcommand((sub) => sub.setName("reopen-room").setDescription("Explicitly reopen a discussion room")
      .addStringOption((option) => option.setName("concept").setDescription("Concept").setRequired(true).setAutocomplete(true))),
  execute: handleTaCommand as (interaction: ChatInputCommandInteraction) => Promise<void>,
};
