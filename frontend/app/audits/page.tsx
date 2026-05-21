"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listAudits } from "../../lib/api";
import type { AuditListItem } from "../../lib/types";

export default function AuditsPage() {
  const [audits, setAudits] = useState<AuditListItem[]>([]);
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    listAudits().then(setAudits).catch((e) => setErr(e instanceof Error ? e.message : "Failed to load audits"));
  }, []);

  return (
    <div className="space-y-4">
      <div className="text-lg font-semibold">Audits</div>
      {err ? <div className="rounded border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">{err}</div> : null}
      <div className="overflow-hidden rounded border border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900/40 text-xs text-slate-400">
            <tr>
              <th className="px-3 py-2">Dataset</th>
              <th className="px-3 py-2">Created</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Audit</th>
            </tr>
          </thead>
          <tbody>
            {audits.map((a) => (
              <tr key={a.audit_id} className="border-t border-slate-800">
                <td className="px-3 py-2">{a.dataset_name}</td>
                <td className="px-3 py-2 text-slate-300">{a.created_at}</td>
                <td className="px-3 py-2 text-slate-300">{a.status}</td>
                <td className="px-3 py-2">
                  <Link className="text-sky-300 hover:text-sky-200" href={`/audits/${a.audit_id}`}>
                    Open
                  </Link>
                </td>
              </tr>
            ))}
            {audits.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-slate-400" colSpan={4}>
                  No audits yet. Run a scan from the home page.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

