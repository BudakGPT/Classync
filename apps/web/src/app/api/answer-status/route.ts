import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@classync/core";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const answer = await prisma.answer.findUnique({
    where: { id },
    select: { deliveredAt: true, deliveredCount: true },
  });

  if (!answer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    deliveredAt: answer.deliveredAt?.toISOString() ?? null,
    deliveredCount: answer.deliveredCount,
  });
}
