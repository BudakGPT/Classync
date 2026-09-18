import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  prisma,
  parseRosterFile,
  saveRosterEntries,
  getRosterByGuild,
  getDistinctClasses,
} from "@classync/core";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const guildId = req.nextUrl.searchParams.get("guildId");
  if (!guildId) {
    return NextResponse.json({ error: "Missing guildId" }, { status: 400 });
  }

  const guild = await prisma.guild.findUnique({ where: { id: guildId } });
  if (!guild || !guild.taUserIds.includes(session.user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [roster, distinctClasses] = await Promise.all([
    getRosterByGuild(guild.id),
    getDistinctClasses(guild.id),
  ]);

  return NextResponse.json({
    authEnabled: guild.authEnabled,
    roster,
    distinctClasses,
    totalCount: roster.length,
    verifiedCount: roster.filter((r) => r.verifiedAt !== null).length,
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const guildId = formData.get("guildId") as string | null;
  const file = formData.get("file") as File | null;
  const defaultRole = (formData.get("defaultRole") as "STUDENT" | "TA") || "STUDENT";

  if (!guildId || !file) {
    return NextResponse.json({ error: "Missing guildId or file" }, { status: 400 });
  }

  const guild = await prisma.guild.findUnique({ where: { id: guildId } });
  if (!guild || !guild.taUserIds.includes(session.user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const parsed = await parseRosterFile(Buffer.from(arrayBuffer), { defaultRole });

  const saveResult = await saveRosterEntries(guild.id, parsed.entries);

  return NextResponse.json({
    success: true,
    added: saveResult.added,
    updated: saveResult.updated,
    total: saveResult.total,
    detectedClasses: parsed.detectedClasses,
    parsedBy: parsed.parsedBy,
    totalStudents: parsed.totalStudents,
    totalTas: parsed.totalTas,
  });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { guildId, authEnabled } = body;
  if (!guildId || typeof authEnabled !== "boolean") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const guild = await prisma.guild.findUnique({ where: { id: guildId } });
  if (!guild || !guild.taUserIds.includes(session.user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await prisma.guild.update({
    where: { id: guild.id },
    data: { authEnabled },
  });

  return NextResponse.json({ success: true, authEnabled: updated.authEnabled });
}
