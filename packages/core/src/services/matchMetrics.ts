import { prisma } from "../db";

export interface PeerMetrics {
  peerResolvedCount: number | null;
  escalatedCount: number | null;
  medianMinutesToAccept: number | null;
}

const PRIVACY_FLOOR = 5;

/**
 * TA-facing aggregate for the dashboard. Counts only, never identities.
 * Every field is null when the guild has fewer than 5 matches (privacy floor).
 */
export async function getPeerMetrics(guildId: string): Promise<PeerMetrics> {
  const matches = await prisma.match.findMany({
    where: { item: { guildId } },
    select: { state: true, createdAt: true, acceptedAt: true },
  });
  if (matches.length < PRIVACY_FLOOR) {
    return { peerResolvedCount: null, escalatedCount: null, medianMinutesToAccept: null };
  }

  const minutes = matches
    .flatMap((m) => (m.acceptedAt ? [(m.acceptedAt.getTime() - m.createdAt.getTime()) / 60_000] : []))
    .sort((a, b) => a - b);

  return {
    peerResolvedCount: matches.filter((m) => m.state === "RESOLVED").length,
    escalatedCount: matches.filter((m) => m.state === "EXPIRED").length,
    medianMinutesToAccept: minutes.length === 0 ? null : median(minutes),
  };
}

function median(sorted: number[]): number {
  const mid = Math.floor(sorted.length / 2);
  const value = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  return Math.round(value * 10) / 10;
}
