import { RiskBadge } from "./RiskBadge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export function AuditSummaryCard({
  datasetName,
  auditId,
  riskScore,
  numSamples
}: {
  datasetName: string;
  auditId: string;
  riskScore: number;
  numSamples: number;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{datasetName}</CardTitle>
        <div className="text-xs text-muted-foreground">Audit ID: {auditId}</div>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-3 pt-0">
        <div className="text-sm text-muted-foreground">Samples: {numSamples}</div>
        <RiskBadge score={riskScore} />
      </CardContent>
    </Card>
  );
}
