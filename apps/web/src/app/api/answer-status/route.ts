import { NextRequest, NextResponse } from "next/server";
import { getAnswerStatus } from "@classync/core";
import { taGuildOrNull } from "@/lib/session";

/** Polled by AnswerForm. TA-gated through the answer's guild. */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const status = await getAnswerStatus(id);
  if (!status) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const gate = await taGuildOrNull(status.guildId);
  if (!gate) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json({
    deliveredAt: status.deliveredAt?.toISOString() ?? null,
    deliveredCount: status.deliveredCount,
  });
}
