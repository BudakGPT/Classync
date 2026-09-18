import { CircleCheck, GraduationCap, IdCard, Layers, ShieldCheck, UserRoundCog } from "lucide-react";
import { getDistinctClasses, getRosterByGuild } from "@classync/core";
import { AuthToggle } from "@/components/roster/AuthToggle";
import { RosterTable, type RosterRow } from "@/components/roster/RosterTable";
import { RosterUpload } from "@/components/roster/RosterUpload";
import { Card, CardHeader, EmptyState, PageHeader, StatCard } from "@/components/ui";
import { fmtDateTime } from "@/lib/format";
import { requireTaGuild } from "@/lib/session";

interface Props {
  params: Promise<{ guildId: string }>;
}

/** Roster + NPM verification gate: upload the class list, toggle the gate, see who has verified. */
export default async function RosterPage({ params }: Props) {
  const { guildId } = await params;
  const { guild } = await requireTaGuild(guildId);
  const [roster, classes] = await Promise.all([getRosterByGuild(guild.id), getDistinctClasses(guild.id)]);

  const rows: RosterRow[] = roster.map((r) => ({
    id: r.id,
    npm: r.npm,
    name: r.name,
    role: r.role,
    className: r.className,
    discordUserId: r.discordUserId,
    verifiedAtLabel: r.verifiedAt ? fmtDateTime(r.verifiedAt) : null,
  }));
  const students = rows.filter((r) => r.role === "STUDENT").length;
  const verified = rows.filter((r) => r.verifiedAtLabel !== null).length;

  return (
    <>
      <PageHeader
        title="Roster"
        subtitle="Upload the official class list. With the gate on, new members only see #verifikasi until their NPM matches a row here."
      />

      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700"><ShieldCheck className="size-[18px]" /></span>
            <div className="min-w-0">
              <h2 className="text-[15px] font-bold text-ink">NPM verification gate</h2>
              <p className="mt-0.5 max-w-2xl text-[13px] leading-relaxed text-ink-3">
                When on, the next <code className="font-mono">/setup</code> in Discord creates <code className="font-mono">@Verified</code>, <code className="font-mono">#verifikasi</code>
                and one private category per class. Verified members get the class role and the nickname <code className="font-mono">NPM - Name</code>.
              </p>
            </div>
          </div>
          <AuthToggle guildId={guild.id} enabled={guild.authEnabled} />
        </div>
      </Card>

      <section className="mt-4 grid grid-cols-2 gap-4 xl:grid-cols-4" aria-label="Roster totals">
        <StatCard label="Students" value={students} icon={GraduationCap} />
        <StatCard label="TAs" value={rows.length - students} icon={UserRoundCog} tone="sky" />
        <StatCard label="Verified" value={verified} icon={CircleCheck} tone="emerald" footer={rows.length > 0 ? `${Math.round((verified / rows.length) * 100)}% linked to Discord` : undefined} />
        <StatCard label="Classes" value={classes.length} icon={Layers} tone="violet" footer={classes.length > 0 ? classes.join(", ") : "None detected yet"} />
      </section>

      <section className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2" aria-label="Upload">
        <RosterUpload
          guildId={guild.id}
          role="STUDENT"
          title="Import students"
          description="Columns NPM, Name and Class (Kelas A, Rombel 2, …) in any order; headers are detected automatically."
          iconKey="student"
          withTemplate
        />
        <RosterUpload
          guildId={guild.id}
          role="TA"
          title="Import TAs"
          description="Columns NPM and Name. A TA who verifies in Discord gets @Teaching Assistant and dashboard access."
          iconKey="ta"
        />
      </section>

      <Card className="mt-6 overflow-hidden">
        <CardHeader icon={IdCard} title="Roster" subtitle="Names here come from the file a TA uploaded, never from student activity." />
        {rows.length === 0 ? (
          <EmptyState icon={IdCard} title="No roster yet" description="Upload a spreadsheet above. Rows appear here immediately; verification status updates as students claim their NPM." />
        ) : (
          <RosterTable rows={rows} />
        )}
      </Card>
    </>
  );
}
