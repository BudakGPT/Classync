import { prisma } from "../src/db.js";

async function clearDatabase() {
  console.log("⏳ Sedang membersihkan seluruh data di database...");
  try {
    await prisma.$transaction([
      prisma.match.deleteMany(),
      prisma.answer.deleteMany(),
      prisma.helpRequest.deleteMany(),
      prisma.topicRoomMember.deleteMany(),
      prisma.topicRoom.deleteMany(),
      prisma.itemStatus.deleteMany(),
      prisma.concept.deleteMany(),
      prisma.academicRoster.deleteMany(),
      prisma.item.deleteMany(),
      prisma.student.deleteMany(),
      prisma.guild.deleteMany(),
    ]);
    console.log("✅ Database berhasil dibersihkan total (0 data tersisa).");
  } catch (error) {
    console.error("❌ Gagal membersihkan database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

clearDatabase();
