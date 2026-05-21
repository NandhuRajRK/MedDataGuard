"use client";

import { useEffect, useState } from "react";
import { getReport, listAudits } from "../../lib/api";

export default function ReportRootPage() {
  const [md, setMd] = useState<string>("");
  useEffect(() => {
    listAudits()
      .then((audits) => (audits[0] ? getReport(audits[0].audit_id) : null))
      .then((res) => setMd(res?.markdown ?? "No report yet."))
      .catch(() => setMd("No report yet."));
  }, []);
  return (
    <div className="space-y-3">
      <div className="text-lg font-semibold">Report</div>
      <div className="rounded border border-slate-800 bg-slate-950/40 p-4">
        <pre className="overflow-auto whitespace-pre-wrap text-sm text-slate-200">{md}</pre>
      </div>
    </div>
  );
}

