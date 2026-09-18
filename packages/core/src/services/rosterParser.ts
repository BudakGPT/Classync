import * as XLSX from "xlsx";
import { z } from "zod";
import type { RosterEntryInput } from "./roster.js";

const RosterItemSchema = z.object({
  npm: z.coerce.string().min(1),
  name: z.coerce.string().min(1),
  role: z.enum(["STUDENT", "TA"]).default("STUDENT"),
  className: z.coerce.string().nullable().optional(),
});

const RosterListSchema = z.array(RosterItemSchema);

function cleanClass(c?: string | null): string | null {
  if (!c) return null;
  const trimmed = c.trim();
  if (!trimmed) return null;
  if (/^[a-zA-Z]$/.test(trimmed)) return `Kelas ${trimmed.toUpperCase()}`;
  if (!/^kelas/i.test(trimmed) && /^[a-zA-Z0-9\s\-]+$/.test(trimmed)) {
    return `Kelas ${trimmed}`;
  }
  return trimmed;
}

function parseWithHeuristics(rawRows: unknown[][], defaultRole: "STUDENT" | "TA"): RosterEntryInput[] {
  if (rawRows.length === 0) return [];
  let headerIdx = 0;
  for (let i = 0; i < Math.min(rawRows.length, 5); i++) {
    const rowStr = rawRows[i].map((c) => String(c ?? "").toLowerCase()).join(" ");
    if (rowStr.includes("npm") || rowStr.includes("nim") || rowStr.includes("nama") || rowStr.includes("name")) {
      headerIdx = i;
      break;
    }
  }

  const headers = rawRows[headerIdx].map((c) => String(c ?? "").trim().toLowerCase());
  let npmCol = headers.findIndex((h) => h.includes("npm") || h.includes("nim") || h.includes("id"));
  let nameCol = headers.findIndex((h) => h.includes("nama") || h.includes("name"));
  let classCol = headers.findIndex((h) => h.includes("kelas") || h.includes("class") || h.includes("rombel") || h.includes("seksi"));
  let roleCol = headers.findIndex((h) => h.includes("role") || h.includes("peran") || h.includes("status"));

  if (npmCol === -1 || nameCol === -1) {
    npmCol = 0;
    nameCol = 1;
    classCol = 2;
  }

  const results: RosterEntryInput[] = [];
  for (let i = headerIdx + 1; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || row.length === 0) continue;
    const rawNpm = String(row[npmCol] ?? "").trim();
    const rawName = String(row[nameCol] ?? "").trim();
    if (!rawNpm || !rawName || rawName.toLowerCase() === "nama") continue;

    let role = defaultRole;
    if (roleCol !== -1 && row[roleCol]) {
      const rStr = String(row[roleCol]).toLowerCase();
      if (rStr.includes("ta") || rStr.includes("asdos") || rStr.includes("asisten")) role = "TA";
      else if (rStr.includes("mahasiswa") || rStr.includes("student")) role = "STUDENT";
    }

    const rawClass = classCol !== -1 && row[classCol] ? cleanClass(String(row[classCol])) : null;
    results.push({
      npm: rawNpm.replace(/\s+/g, ""),
      name: rawName,
      role,
      className: rawClass,
    });
  }
  return results;
}

async function callOpenRouter(promptText: string): Promise<RosterEntryInput[] | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://classync.app",
        "X-Title": "Classync Roster Parser",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-lite-preview-02-05:free",
        messages: [
          {
            role: "system",
            content:
              "You are an academic roster parser. Extract students and TAs into a JSON array: " +
              '[{"npm":"string","name":"string","role":"STUDENT"|"TA","className":"string|null"}]. ' +
              "Standardize class names (e.g. 'A' -> 'Kelas A'). Reply ONLY with the JSON array.",
          },
          { role: "user", content: promptText },
        ],
        temperature: 0.1,
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return null;
    const parsed = RosterListSchema.safeParse(JSON.parse(jsonMatch[0]));
    if (!parsed.success) return null;

    return parsed.data.map((item) => ({
      npm: item.npm.trim().replace(/\s+/g, ""),
      name: item.name.trim(),
      role: item.role,
      className: cleanClass(item.className),
    }));
  } catch {
    return null;
  }
}

export async function parseRosterFile(
  fileBuffer: Buffer | ArrayBuffer,
  options: { defaultRole?: "STUDENT" | "TA" } = {}
): Promise<{
  entries: RosterEntryInput[];
  detectedClasses: string[];
  totalStudents: number;
  totalTas: number;
  parsedBy: "openrouter" | "heuristic";
}> {
  const defaultRole = options.defaultRole ?? "STUDENT";
  const workbook = XLSX.read(fileBuffer, { type: "buffer" });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });

  // 1. Try OpenRouter LLM first if file has data and API is available
  if (rawRows.length > 0 && process.env.OPENROUTER_API_KEY) {
    const sampleRows = rawRows.slice(0, 100);
    const prompt = `Spreadsheet rows:\n${JSON.stringify(sampleRows)}\nDefault role: ${defaultRole}`;
    const llmResult = await callOpenRouter(prompt);
    if (llmResult && llmResult.length > 0) {
      const classes = Array.from(new Set(llmResult.map((e) => e.className).filter((c): c is string => Boolean(c)))).sort();
      return {
        entries: llmResult,
        detectedClasses: classes,
        totalStudents: llmResult.filter((e) => e.role === "STUDENT").length,
        totalTas: llmResult.filter((e) => e.role === "TA").length,
        parsedBy: "openrouter",
      };
    }
  }

  // 2. Deterministic Heuristic Parser fallback
  const heuristicResult = parseWithHeuristics(rawRows, defaultRole);
  const classes = Array.from(new Set(heuristicResult.map((e) => e.className).filter((c): c is string => Boolean(c)))).sort();

  return {
    entries: heuristicResult,
    detectedClasses: classes,
    totalStudents: heuristicResult.filter((e) => e.role === "STUDENT").length,
    totalTas: heuristicResult.filter((e) => e.role === "TA").length,
    parsedBy: "heuristic",
  };
}
