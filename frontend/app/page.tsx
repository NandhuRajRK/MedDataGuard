"use client";

import { useState } from "react";
import { runScan } from "../lib/api";
import type { ScanRequest } from "../lib/types";

export default function HomePage() {
  const [form, setForm] = useState<ScanRequest>({
    dataset_name: "Demo Audit",
    images_path: "C:/Repository/MedDataGuard/demo_data/generated/images",
    masks_path: "C:/Repository/MedDataGuard/demo_data/generated/masks",
    metadata_csv_path: "C:/Repository/MedDataGuard/demo_data/generated/metadata.csv",
    train_split_path: "C:/Repository/MedDataGuard/demo_data/generated/splits/train.txt",
    val_split_path: "C:/Repository/MedDataGuard/demo_data/generated/splits/val.txt",
    test_split_path: "C:/Repository/MedDataGuard/demo_data/generated/splits/test.txt",
    mask_format: "single_channel_class_ids"
  });
  const [status, setStatus] = useState<string>("");
  const [auditId, setAuditId] = useState<string>("");
  const [err, setErr] = useState<string>("");

  async function submit() {
    setErr("");
    setStatus("Running scan…");
    try {
      const res = await runScan(form);
      setAuditId(res.audit_id);
      setStatus(`Completed: ${res.audit_id}`);
    } catch (e) {
      setStatus("");
      setErr(e instanceof Error ? e.message : "Unknown error");
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded border border-slate-800 bg-slate-950/40 p-4">
        <div className="text-lg font-semibold">Scan a dataset</div>
        <div className="mt-1 text-sm text-slate-400">For demo mode, generate data into `demo_data/generated` and scan using the default paths.</div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            <div className="text-xs text-slate-400">Dataset name</div>
            <input className="mt-1 w-full rounded border border-slate-800 bg-slate-950 px-2 py-1" value={form.dataset_name} onChange={(e) => setForm({ ...form, dataset_name: e.target.value })} />
          </label>
          <label className="text-sm">
            <div className="text-xs text-slate-400">Mask format</div>
            <select className="mt-1 w-full rounded border border-slate-800 bg-slate-950 px-2 py-1" value={form.mask_format} onChange={(e) => setForm({ ...form, mask_format: e.target.value as ScanRequest["mask_format"] })}>
              <option value="single_channel_class_ids">single_channel_class_ids</option>
              <option value="binary">binary</option>
              <option value="rgb_palette">rgb_palette</option>
            </select>
          </label>
          <label className="text-sm">
            <div className="text-xs text-slate-400">Images path</div>
            <input className="mt-1 w-full rounded border border-slate-800 bg-slate-950 px-2 py-1" value={form.images_path} onChange={(e) => setForm({ ...form, images_path: e.target.value })} />
          </label>
          <label className="text-sm">
            <div className="text-xs text-slate-400">Masks path</div>
            <input className="mt-1 w-full rounded border border-slate-800 bg-slate-950 px-2 py-1" value={form.masks_path} onChange={(e) => setForm({ ...form, masks_path: e.target.value })} />
          </label>
          <label className="text-sm">
            <div className="text-xs text-slate-400">Metadata CSV (optional)</div>
            <input className="mt-1 w-full rounded border border-slate-800 bg-slate-950 px-2 py-1" value={form.metadata_csv_path ?? ""} onChange={(e) => setForm({ ...form, metadata_csv_path: e.target.value || undefined })} />
          </label>
          <label className="text-sm">
            <div className="text-xs text-slate-400">Train split (optional)</div>
            <input className="mt-1 w-full rounded border border-slate-800 bg-slate-950 px-2 py-1" value={form.train_split_path ?? ""} onChange={(e) => setForm({ ...form, train_split_path: e.target.value || undefined })} />
          </label>
          <label className="text-sm">
            <div className="text-xs text-slate-400">Val split (optional)</div>
            <input className="mt-1 w-full rounded border border-slate-800 bg-slate-950 px-2 py-1" value={form.val_split_path ?? ""} onChange={(e) => setForm({ ...form, val_split_path: e.target.value || undefined })} />
          </label>
          <label className="text-sm">
            <div className="text-xs text-slate-400">Test split (optional)</div>
            <input className="mt-1 w-full rounded border border-slate-800 bg-slate-950 px-2 py-1" value={form.test_split_path ?? ""} onChange={(e) => setForm({ ...form, test_split_path: e.target.value || undefined })} />
          </label>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button className="rounded bg-slate-200 px-3 py-1.5 text-sm font-medium text-slate-950 hover:bg-white" onClick={submit}>
            Run scan
          </button>
          {status ? <div className="text-sm text-slate-300">{status}</div> : null}
          {auditId ? (
            <a className="text-sm text-sky-300 hover:text-sky-200" href={`/audits/${auditId}`}>
              View audit
            </a>
          ) : null}
        </div>
        {err ? <div className="mt-3 rounded border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">{err}</div> : null}
      </div>

      <div className="text-sm text-slate-400">
        Tip: these defaults are for local Windows backend runs. If using Docker backend, change paths to `/app/demo_data/generated/...`.
      </div>
    </div>
  );
}
