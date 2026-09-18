interface Props {
  band: "red" | "yellow" | "green";
  open: number;
  answered: number;
}

export function DifficultyBadge({ band, open, answered }: Props) {
  const colors = {
    red: "bg-red-900/50 text-red-300 border border-red-700",
    yellow: "bg-yellow-900/50 text-yellow-300 border border-yellow-700",
    green: "bg-green-900/50 text-green-300 border border-green-700",
  };
  const emoji = { red: "🔴", yellow: "🟡", green: "🟢" };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${colors[band]}`}>
      {emoji[band]} {open} open · {answered} answered
    </span>
  );
}
