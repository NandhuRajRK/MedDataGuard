"use client";

import { useEffect, useState } from "react";
import { getAudit } from "../../../../lib/api";
import type { Audit } from "../../../../lib/types";

type SampleRow = {
  sample_id?: string;
  split?: string;
  image_path?: string;
  mask_path?: string;
};

export default function SamplesPage({ params }: { params: { auditId: string } }) {
  const [audit, setAudit] = useState<Audit | null>(null);
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    getAudit(params.auditId).then(setAudit).catch((e) => setErr(e instanceof Error ? e.message : "Failed to load"));
  }, [params.auditId]);

  if (err) return <div className="rounded border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">{err}</div>;
  if (!audit) return <div className="text-sm text-slate-400">Loading…</div>;

  const samples = (audit.samples ?? []) as SampleRow[];
  return (
    <div className="space-y-4">
      <div className="text-lg font-semibold">Samples</div>
      <div className="rounded border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-300">
        Showing first {samples.length} samples (MVP).
      </div>
      <div className="overflow-hidden rounded border border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900/40 text-xs text-slate-400">
            <tr>
              <th className="px-3 py-2">Sample</th>
              <th className="px-3 py-2">Split</th>
              <th className="px-3 py-2">Image</th>
              <th className="px-3 py-2">Mask</th>
            </tr>
          </thead>
          <tbody>
            {samples.map((s) => (
              <tr key={String(s.sample_id ?? "")} className="border-t border-slate-800">
                <td className="px-3 py-2 text-slate-200">{String(s.sample_id ?? "")}</td>
                <td className="px-3 py-2 text-slate-300">{String(s.split ?? "")}</td>
                <td className="px-3 py-2 text-xs text-slate-400">{String(s.image_path ?? "")}</td>
                <td className="px-3 py-2 text-xs text-slate-400">{String(s.mask_path ?? "")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
