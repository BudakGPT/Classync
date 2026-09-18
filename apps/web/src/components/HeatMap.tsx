import { jakartaDay } from "@classync/core";
import { cn } from "@/lib/utils";

interface HeatMapEntry {
  itemId: string;
  itemTitle: string;
  days: { date: string; count: number }[];
}

/** Colour steps: none, 1–2, 3–5, 6+ stuck reports on one day. */
const CELL = [
  "bg-subtle text-ink-3",
  "bg-amber-200 text-amber-900",
  "bg-orange-400 text-white",
  "bg-rose-500 text-white",
];

const cellClass = (count: number) => CELL[count === 0 ? 0 : count < 3 ? 1 : count < 6 ? 2 : 3];

/** W2 heat map: items × last 7 Jakarta days, cell = stuck reports that day (ItemStatus.updatedAt). */
export function HeatMap({ data }: { data: HeatMapEntry[] }) {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) days.push(jakartaDay(new Date(Date.now() - i * 24 * 60 * 60 * 1000)));

  const count = (entry: HeatMapEntry, day: string) => entry.days.find((d) => d.date === day)?.count ?? 0;

  return (
    <div className="overflow-x-auto px-5 pb-5 pt-4">
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="pb-2 pr-4 text-left font-medium text-ink-3">Task</th>
            {days.map((d) => (
              <th key={d} className="min-w-9 px-1 pb-2 text-center font-medium text-ink-3 tabular">
                {Number(d.slice(8, 10))}/{Number(d.slice(5, 7))}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((entry) => (
            <tr key={entry.itemId}>
              <td className="max-w-[200px] truncate py-1 pr-4 font-medium text-ink-2" title={entry.itemTitle}>
                {entry.itemTitle}
              </td>
              {days.map((day) => {
                const n = count(entry, day);
                return (
                  <td key={day} className="px-1 py-1">
                    <div
                      className={cn("grid size-8 place-items-center rounded-lg text-[11px] font-bold tabular", cellClass(n))}
                      title={`${n} stuck report${n === 1 ? "" : "s"}`}
                    >
                      {n > 0 ? n : ""}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 flex items-center gap-2 text-xs text-ink-3">
        <span>Fewer</span>
        {CELL.map((c) => <span key={c} className={cn("size-3.5 rounded", c.split(" ")[0])} />)}
        <span>More stuck reports</span>
      </div>
    </div>
  );
}
