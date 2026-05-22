"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, CircleDot, Info } from "lucide-react";

import { getApiBase, getConfig, runScan, setApiBaseOverride } from "../lib/api";
import type { ScanRequest } from "../lib/types";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/ui/tooltip";

export default function HomePage() {
  const [mode, setMode] = useState<"local" | "docker">("local");
  const [form, setForm] = useState<ScanRequest>(() => ({
    dataset_name: "Demo Audit",
    images_path: "C:/Repository/MedDataGuard/demo_data/generated/images",
    masks_path: "C:/Repository/MedDataGuard/demo_data/generated/masks",
    metadata_csv_path: "C:/Repository/MedDataGuard/demo_data/generated/metadata.csv",
    train_split_path: "C:/Repository/MedDataGuard/demo_data/generated/splits/train.txt",
    val_split_path: "C:/Repository/MedDataGuard/demo_data/generated/splits/val.txt",
    test_split_path: "C:/Repository/MedDataGuard/demo_data/generated/splits/test.txt",
    mask_format: "single_channel_class_ids"
  }));

  const [status, setStatus] = useState<string>("");
  const [auditId, setAuditId] = useState<string>("");
  const [err, setErr] = useState<string>("");
  const [stepIdx, setStepIdx] = useState<number>(-1);
  const [scanRoots, setScanRoots] = useState<string[] | null>(null);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [apiBaseValue, setApiBaseValue] = useState<string>("");

  const steps = useMemo(
    () => ["Index files", "Validate pairs", "Compute hashes", "Leakage checks", "Drift checks", "Render report"],
    []
  );

  useEffect(() => {
    getConfig()
      .then((c) => setScanRoots(c.scan_roots))
      .catch(() => setScanRoots(null));
    setApiBaseValue(getApiBase());
  }, []);

  useEffect(() => {
    if (mode === "docker") {
      setForm((f) => ({
        ...f,
        images_path: "/app/demo_data/generated/images",
        masks_path: "/app/demo_data/generated/masks",
        metadata_csv_path: "/app/demo_data/generated/metadata.csv",
        train_split_path: "/app/demo_data/generated/splits/train.txt",
        val_split_path: "/app/demo_data/generated/splits/val.txt",
        test_split_path: "/app/demo_data/generated/splits/test.txt"
      }));
    } else {
      setForm((f) => ({
        ...f,
        images_path: "C:/Repository/MedDataGuard/demo_data/generated/images",
        masks_path: "C:/Repository/MedDataGuard/demo_data/generated/masks",
        metadata_csv_path: "C:/Repository/MedDataGuard/demo_data/generated/metadata.csv",
        train_split_path: "C:/Repository/MedDataGuard/demo_data/generated/splits/train.txt",
        val_split_path: "C:/Repository/MedDataGuard/demo_data/generated/splits/val.txt",
        test_split_path: "C:/Repository/MedDataGuard/demo_data/generated/splits/test.txt"
      }));
    }
  }, [mode]);

  const pathHint = useMemo(() => {
    if (!scanRoots?.length) return "Paths must be under the backend allowlisted scan roots (BACKEND_SCAN_ROOTS).";
    return `Paths must be under allowed scan roots: ${scanRoots.join(", ")}`;
  }, [scanRoots]);

  const bestEffortRootMismatch = useMemo(() => {
    if (!scanRoots?.length) return false;
    const p = (form.images_path || "").replaceAll("\\", "/");
    return !scanRoots.some((r) => p.includes(r.replaceAll("\\", "/")));
  }, [form.images_path, scanRoots]);

  async function pickFolderAndSet(field: "images_path" | "masks_path") {
    // Browsers generally do not expose absolute filesystem paths for security reasons.
    // This is a best-effort UX helper: we use the directory name as a hint and users can edit as needed.
    try {
      const picker = (window as unknown as { showDirectoryPicker?: () => Promise<{ name: string }> }).showDirectoryPicker;
      if (!picker) {
        setErr("Folder picker is not available in this browser. Please paste the path manually.");
        return;
      }
      const handle = await picker();
      const hint = mode === "docker" ? `/app/${handle.name}` : handle.name;
      setForm((f) => ({ ...f, [field]: hint }));
      setStatus("Picked folder name (edit to full path if needed)");
      window.setTimeout(() => setStatus(""), 2000);
    } catch {
      // user canceled
    }
  }

  async function submit() {
    setErr("");
    setAuditId("");
    setStepIdx(0);
    setStatus("Running scan…");

    let alive = true;
    const t = window.setInterval(() => {
      setStepIdx((i) => {
        if (!alive) return i;
        const next = i + 1;
        return next >= steps.length ? steps.length - 1 : next;
      });
    }, 1200);

    try {
      const res = await runScan(form);
      setAuditId(res.audit_id);
      setStepIdx(steps.length);
      setStatus("Scan completed");
    } catch (e) {
      setStatus("");
      const msg = e instanceof Error ? e.message : "Unknown error";
      if (msg.includes("failed: 404")) {
        setErr(`${msg}. Check NEXT_PUBLIC_API_BASE_URL (or the API base override) points to the backend, e.g. http://localhost:8000`);
      } else {
        setErr(msg);
      }
      setStepIdx(-1);
    } finally {
      alive = false;
      window.clearInterval(t);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>New dataset scan</CardTitle>
          <CardDescription>Start with images + masks. Add metadata/splits only if you have them.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">Path mode</div>
            <Tabs value={mode} onValueChange={(v) => setMode(v as "local" | "docker")}>
              <TabsList>
                <TabsTrigger value="local">Local</TabsTrigger>
                <TabsTrigger value="docker">Docker</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dataset_name">Dataset name</Label>
              <Input id="dataset_name" value={form.dataset_name} onChange={(e) => setForm({ ...form, dataset_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mask_format">Mask format</Label>
              <select
                id="mask_format"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={form.mask_format}
                onChange={(e) => setForm({ ...form, mask_format: e.target.value as ScanRequest["mask_format"] })}
              >
                <option value="single_channel_class_ids">single_channel_class_ids</option>
                <option value="binary">binary</option>
                <option value="rgb_palette">rgb_palette</option>
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="images_path">Images path</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                        <Info className="h-3.5 w-3.5" /> Path rules
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>{pathHint}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex gap-2">
                <Input id="images_path" value={form.images_path} onChange={(e) => setForm({ ...form, images_path: e.target.value })} />
                <Button type="button" variant="secondary" onClick={() => pickFolderAndSet("images_path")}>
                  Browse
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="masks_path">Masks path</Label>
              <div className="flex gap-2">
                <Input id="masks_path" value={form.masks_path} onChange={(e) => setForm({ ...form, masks_path: e.target.value })} />
                <Button type="button" variant="secondary" onClick={() => pickFolderAndSet("masks_path")}>
                  Browse
                </Button>
              </div>
            </div>
          </div>

          {bestEffortRootMismatch ? (
            <Alert>
              <AlertTitle>Heads up</AlertTitle>
              <AlertDescription>
                This images path doesn’t look like it’s under the configured scan roots. If the backend rejects it, update <code>BACKEND_SCAN_ROOTS</code> or choose a path under an allowed root.
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <div className="text-sm font-medium">Advanced options</div>
              <div className="text-xs text-muted-foreground">Metadata and split files (optional).</div>
            </div>
            <Switch checked={showAdvanced} onCheckedChange={setShowAdvanced} />
          </div>

          {showAdvanced ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="metadata_csv_path">Metadata CSV</Label>
                <Input
                  id="metadata_csv_path"
                  placeholder={mode === "docker" ? "/app/demo_data/generated/metadata.csv" : "C:/.../metadata.csv"}
                  value={form.metadata_csv_path ?? ""}
                  onChange={(e) => setForm({ ...form, metadata_csv_path: e.target.value || undefined })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="train_split_path">Train split</Label>
                <Input
                  id="train_split_path"
                  placeholder={mode === "docker" ? "/app/demo_data/generated/splits/train.txt" : "C:/.../splits/train.txt"}
                  value={form.train_split_path ?? ""}
                  onChange={(e) => setForm({ ...form, train_split_path: e.target.value || undefined })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="val_split_path">Val split</Label>
                <Input
                  id="val_split_path"
                  placeholder={mode === "docker" ? "/app/demo_data/generated/splits/val.txt" : "C:/.../splits/val.txt"}
                  value={form.val_split_path ?? ""}
                  onChange={(e) => setForm({ ...form, val_split_path: e.target.value || undefined })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="test_split_path">Test split</Label>
                <Input
                  id="test_split_path"
                  placeholder={mode === "docker" ? "/app/demo_data/generated/splits/test.txt" : "C:/.../splits/test.txt"}
                  value={form.test_split_path ?? ""}
                  onChange={(e) => setForm({ ...form, test_split_path: e.target.value || undefined })}
                />
              </div>
            </div>
          ) : null}

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="api_base">API base (override)</Label>
              <div className="flex gap-2">
                <Input
                  id="api_base"
                  value={apiBaseValue}
                  onChange={(e) => setApiBaseValue(e.target.value)}
                  placeholder="http://localhost:8000"
                />
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => {
                    setApiBaseOverride(apiBaseValue);
                    setStatus("Saved API base override");
                    window.setTimeout(() => setStatus(""), 1500);
                  }}
                >
                  Save
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                If you see <code>POST /scan failed: 404</code>, this is usually pointing at the wrong server (e.g. frontend port).
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button onClick={submit}>Run scan</Button>
            {status ? <div className="text-sm text-muted-foreground">{status}</div> : null}
          </div>
          {auditId ? (
            <Button asChild variant="secondary">
              <Link href={`/audits/${auditId}`}>Open audit</Link>
            </Button>
          ) : null}
        </CardFooter>
      </Card>

      {stepIdx >= 0 ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Scan progress</CardTitle>
            <CardDescription>High-level phases (backend runs synchronously in MVP).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {steps.map((s, idx) => {
              const done = stepIdx > idx;
              const active = stepIdx === idx;
              return (
                <div key={s} className="flex items-center justify-between rounded-md border px-3 py-2">
                  <div className="flex items-center gap-2">
                    {done ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <CircleDot className="h-4 w-4 text-muted-foreground" />}
                    <div className={active ? "text-sm font-medium" : "text-sm"}>{s}</div>
                  </div>
                  {active ? (
                    <Badge variant="secondary">running</Badge>
                  ) : done ? (
                    <Badge className="bg-emerald-500/10 text-emerald-200 border-emerald-500/30">done</Badge>
                  ) : (
                    <Badge variant="outline">pending</Badge>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : null}

      {err ? (
        <Alert variant="destructive">
          <AlertTitle>Scan failed</AlertTitle>
          <AlertDescription>{err}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
