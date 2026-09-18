interface HeatMapEntry {
  itemId: string;
  itemTitle: string;
  days: { date: string; count: number }[];
}

interface Props {
  data: HeatMapEntry[];
}

export function HeatMap({ data }: Props) {
  // Build list of last 7 days
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    days.push(d.toISOString().slice(0, 10));
  }

  function getCount(entry: HeatMapEntry, day: string) {
    return entry.days.find((d) => d.date === day)?.count ?? 0;
  }

  function cellColor(count: number) {
    if (count === 0) return "bg-gray-800";
    if (count < 3) return "bg-yellow-800";
    if (count < 6) return "bg-orange-700";
    return "bg-red-600";
  }

  return (
    <div className="overflow-x-auto">
      <table className="text-xs w-full">
        <thead>
          <tr>
            <th className="text-left text-gray-500 pr-4 pb-1 font-normal">Task</th>
            {days.map((d) => (
              <th key={d} className="text-gray-500 font-normal pb-1 px-1 min-w-[36px]">
                {d.slice(5)} {/* MM-DD */}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((entry) => (
            <tr key={entry.itemId}>
              <td className="pr-4 py-1 text-gray-300 truncate max-w-[160px]" title={entry.itemTitle}>
                {entry.itemTitle}
              </td>
              {days.map((day) => {
                const count = getCount(entry, day);
                return (
                  <td key={day} className="px-1 py-1">
                    <div
                      className={`w-8 h-8 rounded flex items-center justify-center text-white font-bold ${cellColor(count)}`}
                      title={`${count} stuck`}
                    >
                      {count > 0 ? count : ""}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex gap-3 mt-2 text-xs text-gray-500 items-center">
        <span>Low</span>
        <div className="flex gap-1">
          {["bg-gray-800","bg-yellow-800","bg-orange-700","bg-red-600"].map((c) => (
            <div key={c} className={`w-4 h-4 rounded ${c}`} />
          ))}
        </div>
        <span>High stuck reports</span>
      </div>
    </div>
  );
}
