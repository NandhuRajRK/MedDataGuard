"use client";

import { useEffect, useState } from "react";
import { SampleDetailPanel } from "../../components/SampleDetailPanel";
import { SampleGrid } from "../../components/SampleGrid";
import { getLatestAudit } from "../../lib/utils";

export default function SamplesRootPage() {
  const [samples, setSamples] = useState<Array<Record<string, unknown>>>([]);
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null);
  useEffect(() => {
    getLatestAudit()
      .then((audit) => {
        const subset = (audit?.samples ?? []).slice(0, 24);
        setSamples(subset as Array<Record<string, unknown>>);
        setSelected((subset[0] as Record<string, unknown>) ?? null);
      })
      .catch(() => setSamples([]));
  }, []);
  return (
    <div className="space-y-4">
      <div className="text-lg font-semibold">Samples</div>
      <SampleGrid samples={samples} />
      <SampleDetailPanel sample={selected} />
    </div>
  );
}

