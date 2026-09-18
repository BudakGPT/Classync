import { PrismaClient, ItemKind, StatusState, RequestState } from "@prisma/client";
import { subDays, subHours } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clean slate
  await prisma.match.deleteMany();
  await prisma.topicRoomMember.deleteMany();
  await prisma.topicRoom.deleteMany();
  await prisma.answer.deleteMany();
  await prisma.helpRequest.deleteMany();
  await prisma.itemStatus.deleteMany();
  await prisma.concept.deleteMany();
  await prisma.item.deleteMany();
  await prisma.student.deleteMany();
  await prisma.academicRoster.deleteMany();
  await prisma.guild.deleteMany();

  // === GUILD ===
  const guild = await prisma.guild.create({
    data: {
      discordGuildId: process.env.DISCORD_GUILD_ID ?? "000000000000000000",
      name: "IF2025 - Pemrograman Lanjut",
      announcementChannelId: process.env.SEED_ANNOUNCEMENT_CHANNEL_ID ?? "111111111111111111",
      taUserIds: [process.env.SEED_TA_DISCORD_ID ?? "999999999999999999"],
    },
  });

  // === ITEMS (3 items due in 1, 3, 6 days) ===
  const item1 = await prisma.item.create({
    data: {
      guildId: guild.id,
      title: "Tugas Besar 2 - Implementasi Graph",
      kind: ItemKind.ASSIGNMENT,
      dueAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day
      createdAt: subDays(new Date(), 5),
    },
  });

  const item2 = await prisma.item.create({
    data: {
      guildId: guild.id,
      title: "Quiz 3 - Complexity Analysis",
      kind: ItemKind.QUIZ,
      dueAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
      createdAt: subDays(new Date(), 3),
    },
  });

  const item3 = await prisma.item.create({
    data: {
      guildId: guild.id,
      title: "Reading - Chapter 8: Dynamic Programming",
      kind: ItemKind.READING,
      dueAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days
      createdAt: subDays(new Date(), 1),
    },
  });

  // === STUDENTS (12 total: 4 real team accounts + 8 fake) ===
  const realIds = [
    process.env.SEED_TA_DISCORD_ID ?? "991111111111111111",
    process.env.SEED_STUDENT_1_DISCORD_ID ?? "992222222222222222",
    process.env.SEED_STUDENT_2_DISCORD_ID ?? "993333333333333333",
    process.env.SEED_STUDENT_3_DISCORD_ID ?? "994444444444444444",
  ];

  const fakeIds = [
    "100000000000000001",
    "100000000000000002",
    "100000000000000003",
    "100000000000000004",
    "100000000000000005",
    "100000000000000006",
    "100000000000000007",
    "100000000000000008",
  ];

  const allIds = [...realIds, ...fakeIds];
  const students = await Promise.all(
    allIds.map((discordUserId) =>
      prisma.student.create({
        data: {
          guildId: guild.id,
          discordUserId,
          consentedAt: new Date(),
        },
      })
    )
  );

  // === CONCEPTS ===
  // Item 1: concept "soal nomor 2" with 6 STUCK reporters (≥5 threshold → shows count)
  const concept1 = await prisma.concept.create({
    data: {
      itemId: item1.id,
      label: "soal nomor 2",
    },
  });

  // Item 1: second concept already answered (for knowledge base demo)
  const concept2 = await prisma.concept.create({
    data: {
      itemId: item1.id,
      label: "cara submit file",
    },
  });

  // Item 2: concept with only 3 reporters (BELOW threshold → privacy floor demo)
  const concept3 = await prisma.concept.create({
    data: {
      itemId: item2.id,
      label: "install docker",
    },
  });

  // === ITEM STATUSES ===
  // concept1 ("soal nomor 2"): 6 students STUCK — spread over last 5 days for heat map
  const stuckStudents = students.slice(0, 6);
  await Promise.all(
    stuckStudents.map((student, i) =>
      prisma.itemStatus.create({
        data: {
          itemId: item1.id,
          studentId: student.id,
          state: StatusState.STUCK,
          conceptId: concept1.id,
          updatedAt: subDays(new Date(), i), // spread: day 0, 1, 2, 3, 4, 5
        },
      })
    )
  );

  // concept3 ("install docker"): 3 students STUCK — below threshold
  const dockerStudents = students.slice(6, 9);
  await Promise.all(
    dockerStudents.map((student) =>
      prisma.itemStatus.create({
        data: {
          itemId: item2.id,
          studentId: student.id,
          state: StatusState.STUCK,
          conceptId: concept3.id,
        },
      })
    )
  );

  // Item 1 silent-risk demo: the 5 students with no status on item 1 (indices 6, 7, 8, 10, 11)
  // were sent the 24 h reminder and never tapped anything → "5 quiet · 5 ignored a reminder".
  const quietStudents = [6, 7, 8, 10, 11].map((i) => students[i]);
  await Promise.all(
    quietStudents.map((student) =>
      prisma.itemStatus.create({
        data: {
          itemId: item1.id,
          studentId: student.id,
          state: StatusState.NONE,
          remindedAt: subHours(new Date(), 6),
        },
      })
    )
  );

  // Item 3: no statuses (empty state demo)

  // === HELP REQUESTS ===
  // concept1: 3 OPEN requests (including 1 real account so dashboard shows real name)
  const requesters = [students[0], students[1], students[2]]; // first is real TA account
  const requesterNames = ["Mahasiswa Satu", "Mahasiswa Dua", "Mahasiswa Tiga"];
  await Promise.all(
    requesters.map((student) =>
      prisma.helpRequest.create({
        data: {
          conceptId: concept1.id,
          studentId: student.id,
          state: RequestState.OPEN,
          displayName: requesterNames[requesters.indexOf(student)],
          createdAt: subHours(new Date(), requesters.indexOf(student) * 2),
        },
      })
    )
  );

  // === ANSWERED CONCEPT (for knowledge base) ===
  // concept2 ("cara submit file"): already answered + delivered
  await prisma.itemStatus.create({
    data: {
      itemId: item1.id,
      studentId: students[9].id,
      state: StatusState.STUCK,
      conceptId: concept2.id,
    },
  });

  const answeredRequest = await prisma.helpRequest.create({
    data: {
      conceptId: concept2.id,
      studentId: students[9].id,
      state: RequestState.ANSWERED,
      displayName: "Mahasiswa Sepuluh",
    },
  });

  await prisma.answer.create({
    data: {
      conceptId: concept2.id,
      authorUserId: process.env.SEED_TA_DISCORD_ID ?? "999999999999999999",
      body: "Untuk submit, zip semua file .java kalian lalu upload ke Google Classroom. Pastikan nama file: `NIM_Nama_TB2.zip`. Deadline jam 23:59 WIB ya!",
      deliveredAt: subHours(new Date(), 3),
      deliveredCount: 1,
    },
  });

  console.log("✅ Seed complete!");
  console.log(`   Guild: ${guild.name}`);
  console.log(`   Items: 3`);
  console.log(`   Students: ${allIds.length} (${realIds.length} real, ${fakeIds.length} fake)`);
  console.log(`   concept1 (soal nomor 2): 6 stuck, 3 open requests`);
  console.log(`   concept2 (cara submit): 1 stuck, 1 answered`);
  console.log(`   concept3 (install docker): 3 stuck (below privacy floor)`);
  console.log(`   item1 silent risk: 5 quiet, all 5 reminded (dashboard "Gone quiet" card)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
