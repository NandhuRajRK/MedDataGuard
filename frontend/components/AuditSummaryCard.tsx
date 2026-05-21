import { RiskBadge } from "./RiskBadge";

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
    <div className="rounded border border-slate-800 bg-slate-950/40 p-4">
      <div className="text-sm font-semibold text-slate-100">{datasetName}</div>
      <div className="mt-1 text-xs text-slate-400">Audit ID: {auditId}</div>
      <div className="mt-3 flex items-center justify-between">
        <div className="text-sm text-slate-300">Samples: {numSamples}</div>
        <RiskBadge score={riskScore} />
      </div>
    </div>
  );
}

