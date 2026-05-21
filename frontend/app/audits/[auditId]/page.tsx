"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getAudit, getIssues } from "../../../lib/api";
import type { Audit, Issue } from "../../../lib/types";
import { MetricCard } from "../../../components/MetricCard";
import { RiskBadge } from "../../../components/RiskBadge";
import { IssueTable } from "../../../components/IssueTable";

export default function AuditDetailPage({ params }: { params: { auditId: string } }) {
  const auditId = params.auditId;
  const [audit, setAudit] = useState<Audit | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    getAudit(auditId)
      .then(setAudit)
      .catch((e) => setErr(e instanceof Error ? e.message : "Failed to load audit"));
    getIssues(auditId)
      .then(setIssues)
      .catch(() => {});
  }, [auditId]);

  const riskScore = audit?.summary?.risk_score ?? 0;
  const issueCounts = audit?.summary?.issue_counts ?? {};
  const zeroSamples = (audit?.summary?.num_samples ?? 0) === 0;

  const topIssues = useMemo(() => issues.slice(0, 30), [issues]);

  if (err) return <div className="rounded border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">{err}</div>;
  if (!audit) return <div className="text-sm text-slate-400">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-lg font-semibold">{audit.dataset_name}</div>
          <div className="text-sm text-slate-400">Audit ID: {audit.audit_id}</div>
          <div className="text-sm text-slate-400">Created: {audit.created_at}</div>
        </div>
        <RiskBadge score={riskScore} />
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label="Images" value={String(audit.summary.num_images)} />
        <MetricCard label="Masks" value={String(audit.summary.num_masks)} />
        <MetricCard label="Samples" value={String(audit.summary.num_samples)} />
        <MetricCard label="Critical/High" value={`${issueCounts["critical"] ?? 0}/${issueCounts["high"] ?? 0}`} />
      </div>

      {zeroSamples ? (
        <div className="rounded border border-amber-800 bg-amber-950/30 p-3 text-sm text-amber-200">
          Scan returned zero samples. This usually means dataset paths are invalid for the backend runtime.
          Use `C:/...` absolute paths for local Windows backend, or `/app/...` paths for Docker backend.
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3 text-sm">
        <Link className="rounded border border-slate-800 bg-slate-950/40 px-3 py-1.5 text-slate-200 hover:bg-slate-950" href={`/audits/${auditId}/leakage`}>
          Leakage
        </Link>
        <Link className="rounded border border-slate-800 bg-slate-950/40 px-3 py-1.5 text-slate-200 hover:bg-slate-950" href={`/audits/${auditId}/samples`}>
          Samples
        </Link>
        <Link className="rounded border border-slate-800 bg-slate-950/40 px-3 py-1.5 text-slate-200 hover:bg-slate-950" href={`/audits/${auditId}/image-quality`}>
          Image quality
        </Link>
        <Link className="rounded border border-slate-800 bg-slate-950/40 px-3 py-1.5 text-slate-200 hover:bg-slate-950" href={`/audits/${auditId}/mask-quality`}>
          Mask quality
        </Link>
        <Link className="rounded border border-slate-800 bg-slate-950/40 px-3 py-1.5 text-slate-200 hover:bg-slate-950" href={`/audits/${auditId}/drift`}>
          Drift
        </Link>
        <Link className="rounded border border-slate-800 bg-slate-950/40 px-3 py-1.5 text-slate-200 hover:bg-slate-950" href={`/audits/${auditId}/report`}>
          Report
        </Link>
      </div>

      <div className="space-y-3">
        <div className="text-sm font-semibold">Issues (top)</div>
        <IssueTable issues={topIssues} />
      </div>
    </div>
  );
}
