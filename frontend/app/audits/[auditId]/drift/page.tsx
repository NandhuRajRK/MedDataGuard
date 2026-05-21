"use client";

import { useEffect, useState } from "react";
import { getAudit } from "../../../../lib/api";
import type { Audit } from "../../../../lib/types";

export default function DriftPage({ params }: { params: { auditId: string } }) {
  const [audit, setAudit] = useState<Audit | null>(null);
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    getAudit(params.auditId).then(setAudit).catch((e) => setErr(e instanceof Error ? e.message : "Failed to load"));
  }, [params.auditId]);

  if (err) return <div className="rounded border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">{err}</div>;
  if (!audit) return <div className="text-sm text-slate-400">Loading…</div>;

  const drift = audit.drift ?? {};
  return (
    <div className="space-y-6">
      <div className="text-lg font-semibold">Drift</div>
      <div className="rounded border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-300">
        <div className="font-semibold text-slate-200">Raw drift payload</div>
        <pre className="mt-3 overflow-auto text-xs text-slate-300">{JSON.stringify(drift, null, 2)}</pre>
      </div>
    </div>
  );
}

