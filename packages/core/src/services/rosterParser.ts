// Spreadsheet → RosterEntryInput[]. Column detection is heuristic by default; with an OpenRouter key
// the LLM is asked ONLY for the column mapping, from the header row plus masked sample cells.
// Real NPMs and names never leave the process (CLAUDE.md rule 6: no student identity to the LLM).
import * as XLSX from "xlsx";
import { z } from "zod";
import { completeJson, llmAvailable } from "../llm";
import type { RosterEntryInput } from "./roster";

export type RosterRoleInput = "STUDENT" | "TA";

export interface ParsedRoster {
  entries: RosterEntryInput[];
  detectedClasses: string[];
  totalStudents: number;
  totalTas: number;
  parsedBy: "openrouter" | "heuristic";
}

interface ColumnMap {
  npm: number;
  name: number;
  className: number | null;
  role: number | null;
}

const ColumnMapSchema = z.object({
  npm: z.number().int().min(0),
  name: z.number().int().min(0),
  className: z.number().int().min(0).nullable(),
  role: z.number().int().min(0).nullable(),
});

const NPM_HEADER = /\b(npm|nim|nrp|no\.?\s*mahasiswa|student\s*id|id)\b/i;
const NAME_HEADER = /(nama|name)/i;
const CLASS_HEADER = /(kelas|class|rombel|seksi|section)/i;
const ROLE_HEADER = /(role|peran|status|jabatan|keterangan|jenis)/i;
const SAMPLE_ROWS = 3;

export function cleanClass(raw?: string | null): string | null {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed) return null;
  if (/^[a-zA-Z]$/.test(trimmed)) return `Kelas ${trimmed.toUpperCase()}`;
  if (!/^kelas/i.test(trimmed) && /^[a-zA-Z0-9\s-]+$/.test(trimmed)) return `Kelas ${trimmed}`;
  return trimmed;
}

const cell = (v: unknown): string => String(v ?? "").trim();

function findHeaderRow(rows: unknown[][]): number {
  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    const text = rows[i].map(cell).join(" ");
    if (NPM_HEADER.test(text) || NAME_HEADER.test(text)) return i;
  }
  return 0;
}

function mapColumnsByHeuristics(headers: string[]): ColumnMap {
  const find = (re: RegExp) => headers.findIndex((h) => re.test(h));
  const npm = find(NPM_HEADER);
  const name = find(NAME_HEADER);
  if (npm === -1 || name === -1) return { npm: 0, name: 1, className: 2, role: null };
  const idx = (i: number) => (i === -1 ? null : i);
  return { npm, name, className: idx(find(CLASS_HEADER)), role: idx(find(ROLE_HEADER)) };
}

/** "2206123456" → "9999999999", "Budi S." → "aaaa a." — shape only, no identity. */
function maskCell(v: unknown): string {
  return cell(v).slice(0, 24).replace(/\d/g, "9").replace(/\p{L}/gu, "a");
}

async function mapColumnsByLlm(rows: unknown[][], headerIdx: number): Promise<ColumnMap | null> {
  const headers = rows[headerIdx].map(cell);
  const samples = rows.slice(headerIdx + 1, headerIdx + 1 + SAMPLE_ROWS).map((r) => r.map(maskCell));
  const result = await completeJson(
    ColumnMapSchema,
    "You map spreadsheet columns of an Indonesian university class roster. Cell values are masked " +
      "(digits→9, letters→a). Reply ONLY with JSON {\"npm\":i,\"name\":i,\"className\":i|null,\"role\":i|null} " +
      "using 0-based column indexes. npm = student number (NPM/NIM), name = full name, className = class/" +
      "section (Kelas/Rombel/Seksi), role = student vs TA/asdos column.",
    JSON.stringify({ headers, samples }),
  );
  if (!result || result.npm >= headers.length || result.name >= headers.length || result.npm === result.name) return null;
  const inRange = (i: number | null) => (i !== null && i < headers.length ? i : null);
  return { npm: result.npm, name: result.name, className: inRange(result.className), role: inRange(result.role) };
}

function roleFromCell(v: unknown, fallback: RosterRoleInput): RosterRoleInput {
  const text = cell(v).toLowerCase();
  if (!text) return fallback;
  if (/\b(ta|asdos|asisten|assistant)\b/.test(text)) return "TA";
  if (/(mahasiswa|student)/.test(text)) return "STUDENT";
  return fallback;
}

function rowsToEntries(rows: unknown[][], headerIdx: number, map: ColumnMap, defaultRole: RosterRoleInput): RosterEntryInput[] {
  const entries: RosterEntryInput[] = [];
  for (const row of rows.slice(headerIdx + 1)) {
    if (!row || row.length === 0) continue;
    const npm = cell(row[map.npm]).replace(/\s+/g, "");
    const name = cell(row[map.name]);
    if (!npm || !name || NAME_HEADER.test(name)) continue;
    entries.push({
      npm,
      name,
      role: map.role === null ? defaultRole : roleFromCell(row[map.role], defaultRole),
      className: map.className === null ? null : cleanClass(cell(row[map.className])),
    });
  }
  return entries;
}

function summarize(entries: RosterEntryInput[], parsedBy: ParsedRoster["parsedBy"]): ParsedRoster {
  const classes = new Set(entries.map((e) => e.className).filter((c): c is string => Boolean(c)));
  return {
    entries,
    detectedClasses: [...classes].sort(),
    totalStudents: entries.filter((e) => e.role !== "TA").length,
    totalTas: entries.filter((e) => e.role === "TA").length,
    parsedBy,
  };
}

/** Parse .xlsx/.xls/.csv bytes (first sheet). Works with no API key via header heuristics. */
export async function parseRosterFile(
  fileBuffer: Buffer | ArrayBuffer,
  options: { defaultRole?: RosterRoleInput } = {},
): Promise<ParsedRoster> {
  const defaultRole = options.defaultRole ?? "STUDENT";
  const workbook = XLSX.read(fileBuffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = sheet ? XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 }) : [];
  if (rows.length === 0) return summarize([], "heuristic");

  const headerIdx = findHeaderRow(rows);
  const llmMap = llmAvailable() ? await mapColumnsByLlm(rows, headerIdx) : null;
  if (llmMap) {
    const entries = rowsToEntries(rows, headerIdx, llmMap, defaultRole);
    if (entries.length > 0) return summarize(entries, "openrouter");
  }
  const heuristicMap = mapColumnsByHeuristics(rows[headerIdx].map((h) => cell(h).toLowerCase()));
  return summarize(rowsToEntries(rows, headerIdx, heuristicMap, defaultRole), "heuristic");
}
