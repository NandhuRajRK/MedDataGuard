"use client";

import { useEffect, useMemo, useState } from "react";
import { AuditSummaryCard } from "../../components/AuditSummaryCard";
import { DistributionChart } from "../../components/DistributionChart";
import { getLatestAudit } from "../../lib/utils";
import type { Audit } from "../../lib/types";

export default function DashboardPage() {
  const [audit, setAudit] = useState<Audit | null>(null);
  useEffect(() => {
    getLatestAudit().then(setAudit).catch(() => setAudit(null));
  }, []);

  const issueData = useMemo(() => {
    const counts = audit?.summary.issue_counts ?? {};
    return Object.keys(counts).map((key) => ({ name: key, value: counts[key] }));
  }, [audit]);

  if (!audit) return <div className="text-sm text-slate-400">No audit found. Run a scan from Home.</div>;

  return (
    <div className="space-y-4">
      <div className="text-lg font-semibold">Dashboard</div>
      <AuditSummaryCard datasetName={audit.dataset_name} auditId={audit.audit_id} riskScore={audit.summary.risk_score} numSamples={audit.summary.num_samples} />
      <DistributionChart data={issueData} />
    </div>
  );
}

