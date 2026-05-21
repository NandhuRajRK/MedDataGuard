export function RiskBadge({ score }: { score: number }) {
  const cls =
    score >= 60 ? "bg-red-900/40 text-red-200 border-red-800" : score >= 30 ? "bg-orange-900/30 text-orange-200 border-orange-800" : "bg-emerald-900/30 text-emerald-200 border-emerald-800";
  return <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs ${cls}`}>Risk {score.toFixed(1)}/100</span>;
}

