"use client";

import { useMemo, useState } from "react";
import { CircleCheck, Clock, Search } from "lucide-react";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

/** Plain-data projection of AcademicRoster (dates pre-formatted by the server page). */
export interface RosterRow {
  id: string;
  npm: string;
  name: string;
  role: "STUDENT" | "TA";
  className: string | null;
  discordUserId: string | null;
  verifiedAtLabel: string | null;
}

type RoleTab = "STUDENT" | "TA";
type StatusFilter = "ALL" | "VERIFIED" | "UNVERIFIED";

const SELECT = "h-8 rounded-lg border border-line bg-surface px-2.5 text-[13px] text-ink outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100";

export function RosterTable({ rows }: { rows: RosterRow[] }) {
  const [tab, setTab] = useState<RoleTab>("STUDENT");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [query, setQuery] = useState("");

  const counts = useMemo(() => ({
    STUDENT: rows.filter((r) => r.role === "STUDENT").length,
    TA: rows.filter((r) => r.role === "TA").length,
  }), [rows]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (r.role !== tab) return false;
      if (status === "VERIFIED" && !r.verifiedAtLabel) return false;
      if (status === "UNVERIFIED" && r.verifiedAtLabel) return false;
      return !q || r.npm.toLowerCase().includes(q) || r.name.toLowerCase().includes(q) || (r.className?.toLowerCase().includes(q) ?? false);
    });
  }, [rows, tab, status, query]);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pb-4 pt-4">
        <div className="flex items-center gap-1 rounded-lg bg-subtle p-0.5" role="tablist">
          {(["STUDENT", "TA"] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={cn("rounded-md px-3 py-1 text-[13px] font-semibold transition", tab === t ? "bg-surface text-ink shadow-card" : "text-ink-3 hover:text-ink")}
            >
              {t === "STUDENT" ? "Students" : "TAs"} <span className="tabular text-ink-3">{counts[t]}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-3" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search NPM, name, class" className={cn(SELECT, "w-56 pl-8")} />
          </label>
          <select value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)} className={SELECT} aria-label="Verification status">
            <option value="ALL">All</option>
            <option value="VERIFIED">Verified</option>
            <option value="UNVERIFIED">Not verified</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto border-t border-line">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-subtle/60 text-[11px] uppercase tracking-wider text-ink-3">
            <tr>
              <th className="px-5 py-2.5 font-semibold">NPM</th>
              <th className="px-5 py-2.5 font-semibold">Name</th>
              <th className="px-5 py-2.5 font-semibold">Class</th>
              <th className="px-5 py-2.5 font-semibold">Verified</th>
              <th className="px-5 py-2.5 font-semibold">Discord user</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {visible.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-ink-3">No {tab === "STUDENT" ? "students" : "TAs"} match this filter.</td></tr>
            ) : (
              visible.map((r) => (
                <tr key={r.id} className="transition hover:bg-subtle/60">
                  <td className="px-5 py-2.5 font-mono font-semibold text-ink">{r.npm}</td>
                  <td className="px-5 py-2.5 font-medium text-ink">{r.name}</td>
                  <td className="px-5 py-2.5">{r.className ? <Badge tone="violet">{r.className}</Badge> : <span className="text-ink-3">—</span>}</td>
                  <td className="px-5 py-2.5">
                    {r.verifiedAtLabel
                      ? <Badge tone="emerald" icon={CircleCheck}>{r.verifiedAtLabel}</Badge>
                      : <Badge tone="amber" icon={Clock}>Pending</Badge>}
                  </td>
                  <td className="px-5 py-2.5 font-mono text-xs text-ink-3">{r.discordUserId ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
