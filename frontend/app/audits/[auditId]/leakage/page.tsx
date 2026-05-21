"use client";

import { useEffect, useState } from "react";
import { getAudit } from "../../../../lib/api";
import type { Audit } from "../../../../lib/types";

type LeakagePayload = {
  exact_cross_split_pairs?: unknown[];
  near_duplicate_cross_split_pairs?: unknown[];
  metadata_group_leakage?: { leaky_groups?: unknown[] };
};

export default function LeakagePage({ params }: { params: { auditId: string } }) {
  const [audit, setAudit] = useState<Audit | null>(null);
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    getAudit(params.auditId).then(setAudit).catch((e) => setErr(e instanceof Error ? e.message : "Failed to load"));
  }, [params.auditId]);

  if (err) return <div className="rounded border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">{err}</div>;
  if (!audit) return <div className="text-sm text-slate-400">Loading…</div>;

  const leakage: LeakagePayload = (audit.leakage ?? {}) as LeakagePayload;
  const exactPairs = leakage.exact_cross_split_pairs ?? [];
  const nearPairs = leakage.near_duplicate_cross_split_pairs ?? [];
  const groups = leakage.metadata_group_leakage?.leaky_groups ?? [];

  return (
    <div className="space-y-6">
      <div className="text-lg font-semibold">Leakage</div>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded border border-slate-800 bg-slate-950/40 p-3">
          <div className="text-xs text-slate-400">Exact cross-split duplicates</div>
          <div className="mt-1 text-lg font-semibold">{exactPairs.length}</div>
        </div>
        <div className="rounded border border-slate-800 bg-slate-950/40 p-3">
          <div className="text-xs text-slate-400">Near-duplicate pairs (pHash)</div>
          <div className="mt-1 text-lg font-semibold">{nearPairs.length}</div>
        </div>
        <div className="rounded border border-slate-800 bg-slate-950/40 p-3">
          <div className="text-xs text-slate-400">Metadata group leakage</div>
          <div className="mt-1 text-lg font-semibold">{groups.length}</div>
        </div>
      </div>
      <div className="rounded border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-300">
        <div className="font-semibold text-slate-200">Raw leakage payload</div>
        <pre className="mt-3 overflow-auto text-xs text-slate-300">{JSON.stringify(leakage, null, 2)}</pre>
      </div>
    </div>
  );
}
