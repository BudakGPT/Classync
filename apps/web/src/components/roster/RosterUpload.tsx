"use client";

import { useRef, useState, useTransition } from "react";
import { Download, Upload, type LucideIcon } from "lucide-react";
import { uploadRoster, type UploadResult } from "@/actions/roster";
import { Button } from "@/components/ui";
import { plural } from "@/lib/utils";

const TEMPLATE_CSV =
  "NPM,Nama,Kelas,Role\n" +
  "2206123451,Budi Santoso,Kelas A,Mahasiswa\n" +
  "2206123452,Siti Rahmawati,Kelas A,Mahasiswa\n" +
  "2206123453,Ahmad Fauzi,Kelas B,Mahasiswa\n" +
  "2106098765,Kevin Pratama,,TA\n";

type Phase = { kind: "idle" } | { kind: "done"; result: UploadResult } | { kind: "error"; message: string };

function downloadTemplate() {
  const url = URL.createObjectURL(new Blob([TEMPLATE_CSV], { type: "text/csv;charset=utf-8;" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: "classync_roster_template.csv" });
  a.click();
  URL.revokeObjectURL(url);
}

/** One upload card per default role. Posts the file to the `uploadRoster` server action. */
export function RosterUpload({ guildId, role, title, description, icon: Icon, withTemplate }: {
  guildId: string; role: "STUDENT" | "TA"; title: string; description: string; icon: LucideIcon; withTemplate?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [pending, startTransition] = useTransition();

  const onFile = (file: File | undefined) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("guildId", guildId);
    formData.append("defaultRole", role);
    formData.append("file", file);
    startTransition(async () => {
      try {
        setPhase({ kind: "done", result: await uploadRoster(formData) });
      } catch (err) {
        setPhase({ kind: "error", message: err instanceof Error ? err.message : "Upload failed." });
      } finally {
        if (inputRef.current) inputRef.current.value = "";
      }
    });
  };

  return (
    <div className="flex h-full flex-col justify-between gap-4 rounded-2xl border border-dashed border-line-strong bg-surface p-5">
      <div>
        <p className="inline-flex items-center gap-2 text-[14px] font-bold text-ink"><Icon className="size-4 text-brand-600" />{title}</p>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-3">{description}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" disabled={pending} onChange={(e) => onFile(e.target.files?.[0])} />
        <Button variant="primary" size="sm" icon={Upload} loading={pending} onClick={() => inputRef.current?.click()}>
          {pending ? "Importing…" : "Choose file"}
        </Button>
        {withTemplate && <Button variant="ghost" size="sm" icon={Download} onClick={downloadTemplate}>CSV template</Button>}
      </div>
      <UploadStatus phase={phase} />
    </div>
  );
}

function UploadStatus({ phase }: { phase: Phase }) {
  if (phase.kind === "idle") return <p className="text-xs text-ink-3">.xlsx, .xls or .csv, up to 2 MB. Rows are matched by NPM; re-uploading updates names and classes.</p>;
  if (phase.kind === "error") return <p className="text-xs font-semibold text-rose-600" aria-live="polite">{phase.message}</p>;
  const { added, updated, detectedClasses, parsedBy } = phase.result;
  return (
    <p className="text-xs font-semibold text-emerald-700" aria-live="polite">
      Imported {plural(added, "new row")}, {updated} updated
      {detectedClasses.length > 0 && ` · ${plural(detectedClasses.length, "class", "classes")}: ${detectedClasses.join(", ")}`}
      {" · "}columns detected by {parsedBy === "openrouter" ? "the LLM" : "header rules"}.
    </p>
  );
}
