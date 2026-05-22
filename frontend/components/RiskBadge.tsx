import { Badge } from "./ui/badge";

function variantForRisk(score: number) {
  if (score >= 60) return "destructive" as const;
  if (score >= 30) return "secondary" as const;
  return "outline" as const;
}

export function RiskBadge({ score }: { score: number }) {
  return (
    <Badge
      variant={variantForRisk(score)}
      className={score >= 30 && score < 60 ? "bg-orange-500/15 text-orange-200 border-orange-500/30" : score < 30 ? "bg-emerald-500/10 text-emerald-200 border-emerald-500/30" : ""}
    >
      Risk {score.toFixed(1)}/100
    </Badge>
  );
}
