import { formatDistanceToNowStrict } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

/** Every timestamp is stored UTC and shown in Asia/Jakarta (CLAUDE.md rule 10). */
const ZONE = "Asia/Jakarta";

/** "21 Sep 2026, 23:59" */
export const fmtDateTime = (d: Date | string) => formatInTimeZone(new Date(d), ZONE, "d MMM yyyy, HH:mm");

/** "21 Sep" */
export const fmtDay = (d: Date | string) => formatInTimeZone(new Date(d), ZONE, "d MMM");

/** "Mon 21 Sep" */
export const fmtWeekday = (d: Date | string) => formatInTimeZone(new Date(d), ZONE, "EEE d MMM");

/** "3 hours ago" / "in 2 days" */
export const fmtRelative = (d: Date | string) => formatDistanceToNowStrict(new Date(d), { addSuffix: true });

export const isPast = (d: Date | string | null) => d !== null && new Date(d).getTime() < Date.now();

/** Due label: "No due date", "Overdue · 21 Sep 2026, 23:59" or "Due in 2 days · 21 Sep 2026, 23:59". */
export function dueLabel(d: Date | string | null): string {
  if (d === null) return "No due date";
  return `${isPast(d) ? "Overdue" : `Due ${fmtRelative(d)}`} · ${fmtDateTime(d)}`;
}
