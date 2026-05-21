"use client";

import { useEffect, useState } from "react";
import { IssueTable } from "../../components/IssueTable";
import { getIssues, listAudits } from "../../lib/api";
import type { Issue } from "../../lib/types";

export default function ImageQualityRootPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  useEffect(() => {
    listAudits()
      .then((audits) => (audits[0] ? getIssues(audits[0].audit_id) : []))
      .then((all) => setIssues(all.filter((i) => i.category === "image_quality")))
      .catch(() => setIssues([]));
  }, []);
  return (
    <div className="space-y-3">
      <div className="text-lg font-semibold">Image Quality</div>
      <IssueTable issues={issues} />
    </div>
  );
}

