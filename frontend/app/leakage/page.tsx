"use client";

import { useEffect, useState } from "react";
import { LeakageClusterView } from "../../components/LeakageClusterView";
import { getLeakage, listAudits } from "../../lib/api";

export default function LeakageRootPage() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  useEffect(() => {
    listAudits()
      .then((audits) => (audits[0] ? getLeakage(audits[0].audit_id) : null))
      .then((payload) => setData(payload))
      .catch(() => setData(null));
  }, []);
  if (!data) return <div className="text-sm text-slate-400">No leakage data yet. Run an audit first.</div>;
  return <LeakageClusterView leakage={data} />;
}

