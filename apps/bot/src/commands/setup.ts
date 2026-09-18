import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { handleSetupCommand } from "../interactions/setup.js";

export default {
  data: new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Konfigurasi server akademik Classync")
    .addSubcommand((sub) =>
      sub
        .setName("form")
        .setDescription("Buka form interaktif untuk setup lengkap server akademik")
    )
    .addSubcommand((sub) =>
      sub
        .setName("auto")
        .setDescription("Otomatis buat roles, categories, channels, dan panel akademik")
        .addStringOption((opt) =>
          opt.setName("course_name").setDescription("Nama mata kuliah (opsional)")
        )
        .addStringOption((opt) =>
          opt.setName("course_code").setDescription("Kode kelas (opsional)")
        )
        .addBooleanOption((opt) =>
          opt.setName("enable_auth").setDescription("Aktifkan gerbang verifikasi NPM (default: true)")
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("panel")
        .setDescription("Kirim panel interaktif pemanggilan Classync ke channel ini")
    )
    .addSubcommand((sub) =>
      sub
        .setName("channel")
        .setDescription("Set channel pengumuman tugas yang sudah ada")
        .addChannelOption((opt) =>
          opt.setName("channel").setDescription("Text atau announcement channel").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("add-ta")
        .setDescription("Berikan hak akses asisten dosen (TA)")
        .addUserOption((opt) =>
          opt.setName("user").setDescription("User yang dijadikan TA").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("remove-ta")
        .setDescription("Cabut hak akses asisten dosen (TA)")
        .addUserOption((opt) =>
          opt.setName("user").setDescription("User yang dicabut dari TA").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub.setName("list-ta").setDescription("Lihat daftar seluruh TA terdaftar")
    )
    .addSubcommand((sub) =>
      sub
        .setName("transfer-owner")
        .setDescription("Pindahkan kepemilikan server Classync")
        .addUserOption((opt) =>
          opt.setName("user").setDescription("Pemilik baru Classync").setRequired(true)
        )
    ),

  execute: handleSetupCommand as (interaction: ChatInputCommandInteraction) => Promise<void>,
};
