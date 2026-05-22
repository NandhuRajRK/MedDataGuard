"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Info } from "lucide-react";

import { getAudit, getIssues } from "../../../lib/api";
import type { Audit, Issue } from "../../../lib/types";
import { IssueTable } from "../../../components/IssueTable";
import { MetricCard } from "../../../components/MetricCard";
import { RiskBadge } from "../../../components/RiskBadge";
import { Alert, AlertDescription, AlertTitle } from "../../../components/ui/alert";
import { Badge } from "../../../components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../../components/ui/tooltip";

export default function AuditDetailPage({ params }: { params: { auditId: string } }) {
  const auditId = params.auditId;
  const [audit, setAudit] = useState<Audit | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [err, setErr] = useState<string>("");
  const [q, setQ] = useState<string>("");
  const [sev, setSev] = useState<string>("all");
  const [split, setSplit] = useState<string>("all");
  const [cat, setCat] = useState<string>("all");
  const router = useRouter();

  useEffect(() => {
    getAudit(auditId)
      .then(setAudit)
      .catch((e) => setErr(e instanceof Error ? e.message : "Failed to load audit"));
    getIssues(auditId)
      .then(setIssues)
      .catch(() => {});
  }, [auditId]);

  const riskScore = audit?.summary?.risk_score ?? 0;
  const issueCounts = audit?.summary?.issue_counts ?? {};
  const zeroSamples = (audit?.summary?.num_samples ?? 0) === 0;

  const categories = useMemo(() => Array.from(new Set(issues.map((i) => i.category))).sort(), [issues]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const res = issues.filter((i) => {
      if (sev !== "all" && i.severity !== sev) return false;
      if (split !== "all" && (i.split ?? "") !== split) return false;
      if (cat !== "all" && i.category !== cat) return false;
      if (!needle) return true;
      return (
        (i.message ?? "").toLowerCase().includes(needle) ||
        (i.sample_id ?? "").toLowerCase().includes(needle) ||
        (i.category ?? "").toLowerCase().includes(needle)
      );
    });
    const severityRank: Record<Issue["severity"], number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
    res.sort((a, b) => (severityRank[a.severity] ?? 99) - (severityRank[b.severity] ?? 99));
    return res;
  }, [issues, q, sev, split, cat]);

  const topDrivers = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const i of issues) {
      if (i.severity === "info") continue;
      counts[i.category] = (counts[i.category] ?? 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [issues]);

  if (err)
    return (
      <Alert variant="destructive">
        <AlertTitle>Failed to load audit</AlertTitle>
        <AlertDescription>{err}</AlertDescription>
      </Alert>
    );
  if (!audit) return <div className="text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle>{audit.dataset_name}</CardTitle>
            <CardDescription>
              Audit ID: <code>{audit.audit_id}</code> • Created: <code>{audit.created_at}</code>
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <RiskBadge score={riskScore} />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="text-muted-foreground hover:text-foreground">
                    <Info className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  Risk score is a heuristic summary of issue severity counts. ~0–29 low, 30–59 medium, 60+ high.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <MetricCard label="Images" value={String(audit.summary.num_images)} />
            <MetricCard label="Masks" value={String(audit.summary.num_masks)} />
            <MetricCard label="Samples" value={String(audit.summary.num_samples)} />
            <MetricCard label="Critical/High" value={`${issueCounts["critical"] ?? 0}/${issueCounts["high"] ?? 0}`} />
          </div>

          {topDrivers.length ? (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted-foreground">Top drivers:</span>
              {topDrivers.map(([k, v]) => (
                <Badge key={k} variant="outline">
                  {k}: {v}
                </Badge>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {zeroSamples ? (
        <Alert>
          <AlertTitle>Zero samples</AlertTitle>
          <AlertDescription>
            Scan returned zero samples. This usually means dataset paths are invalid for the backend runtime. Use <code>C:/...</code> paths for local Windows backend, or <code>/app/...</code> paths for Docker backend.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Issues</CardTitle>
          <CardDescription>Filter and click a row to jump to the sample list.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="issue_q">Search</Label>
              <Input id="issue_q" placeholder="message, category, sample id…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="issue_sev">Severity</Label>
              <select
                id="issue_sev"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={sev}
                onChange={(e) => setSev(e.target.value)}
              >
                <option value="all">All</option>
                <option value="critical">critical</option>
                <option value="high">high</option>
                <option value="medium">medium</option>
                <option value="low">low</option>
                <option value="info">info</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="issue_split">Split</Label>
              <select
                id="issue_split"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={split}
                onChange={(e) => setSplit(e.target.value)}
              >
                <option value="all">All</option>
                <option value="train">train</option>
                <option value="val">val</option>
                <option value="test">test</option>
                <option value="unknown">unknown</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="issue_cat">Category</Label>
              <select
                id="issue_cat"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={cat}
                onChange={(e) => setCat(e.target.value)}
              >
                <option value="all">All</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">{filtered.length} issues</div>
          <IssueTable
            issues={filtered.slice(0, 200)}
            onRowClick={(i) => {
              if (!i.sample_id) return;
              router.push(`/audits/${auditId}/samples?sample=${encodeURIComponent(i.sample_id)}`);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

