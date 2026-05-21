"use client";

import { useEffect, useState } from "react";
import { getReport } from "../../../../lib/api";

export default function ReportPage({ params }: { params: { auditId: string } }) {
  const [md, setMd] = useState<string>("");
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    getReport(params.auditId)
      .then((r) => setMd(r.markdown))
      .catch((e) => setErr(e instanceof Error ? e.message : "Failed to load report"));
  }, [params.auditId]);

  if (err) return <div className="rounded border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">{err}</div>;

  return (
    <div className="space-y-4">
      <div className="text-lg font-semibold">Report</div>
      <div className="rounded border border-slate-800 bg-slate-950/40 p-4">
        <pre className="overflow-auto whitespace-pre-wrap text-sm text-slate-200">{md || "Loading…"}</pre>
      </div>
    </div>
  );
}

