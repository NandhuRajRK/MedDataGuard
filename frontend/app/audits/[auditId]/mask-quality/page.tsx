"use client";

import { useEffect, useMemo, useState } from "react";
import { getIssues } from "../../../../lib/api";
import type { Issue } from "../../../../lib/types";
import { IssueTable } from "../../../../components/IssueTable";

export default function MaskQualityPage({ params }: { params: { auditId: string } }) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    getIssues(params.auditId).then(setIssues).catch((e) => setErr(e instanceof Error ? e.message : "Failed to load"));
  }, [params.auditId]);

  const filtered = useMemo(() => issues.filter((i) => i.category === "mask_quality"), [issues]);
  if (err) return <div className="rounded border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">{err}</div>;
  return (
    <div className="space-y-4">
      <div className="text-lg font-semibold">Mask quality</div>
      <IssueTable issues={filtered} />
    </div>
  );
}

