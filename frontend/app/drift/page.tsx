"use client";

import { useEffect, useState } from "react";
import { DriftScatterPlot } from "../../components/DriftScatterPlot";
import { getDrift, listAudits } from "../../lib/api";

type DriftPoint = { x: number; y: number; split: string; sample_id: string };
type DriftPayload = { points?: DriftPoint[] };

export default function DriftRootPage() {
  const [points, setPoints] = useState<DriftPoint[]>([]);
  useEffect(() => {
    listAudits()
      .then((audits) => (audits[0] ? getDrift(audits[0].audit_id) : null))
      .then((payload) => {
        const p = ((payload as DriftPayload | null)?.points ?? []) as DriftPoint[];
        setPoints(p);
      })
      .catch(() => setPoints([]));
  }, []);
  if (!points.length) return <div className="text-sm text-slate-400">No drift points yet. Run an audit first.</div>;
  return (
    <div className="space-y-3">
      <div className="text-lg font-semibold">Drift</div>
      <DriftScatterPlot points={points} />
    </div>
  );
}
