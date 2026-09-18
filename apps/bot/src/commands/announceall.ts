import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { handleAnnounceAllCommand } from "../interactions/announce.js";

export default {
  data: new SlashCommandBuilder()
    .setName("announceall")
    .setDescription("Kirim rangkuman seluruh tugas aktif ke channel pengumuman"),
  execute: handleAnnounceAllCommand as (interaction: ChatInputCommandInteraction) => Promise<void>,
};
