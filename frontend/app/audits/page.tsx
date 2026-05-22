"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listAudits } from "../../lib/api";
import type { AuditListItem } from "../../lib/types";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";

function relativeTime(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return iso;
  const delta = Date.now() - t;
  const sec = Math.round(delta / 1000);
  const abs = Math.abs(sec);
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  if (abs < 60) return rtf.format(-sec, "second");
  const min = Math.round(sec / 60);
  if (Math.abs(min) < 60) return rtf.format(-min, "minute");
  const hr = Math.round(min / 60);
  if (Math.abs(hr) < 24) return rtf.format(-hr, "hour");
  const day = Math.round(hr / 24);
  return rtf.format(-day, "day");
}

export default function AuditsPage() {
  const [audits, setAudits] = useState<AuditListItem[]>([]);
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    listAudits().then(setAudits).catch((e) => setErr(e instanceof Error ? e.message : "Failed to load audits"));
  }, []);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Audits</CardTitle>
          <Button asChild variant="secondary" size="sm">
            <Link href="/">New scan</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {err ? (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Failed to load audits</AlertTitle>
              <AlertDescription>{err}</AlertDescription>
            </Alert>
          ) : null}
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dataset</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Samples</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Crit/High</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Open</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {audits.map((a) => (
                  <TableRow key={a.audit_id}>
                    <TableCell className="font-medium">{a.dataset_name}</TableCell>
                    <TableCell className="text-muted-foreground" title={a.created_at}>
                      {relativeTime(a.created_at)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{a.num_samples ?? "-"}</TableCell>
                    <TableCell>
                      {typeof a.risk_score === "number" ? (
                        <Badge
                          className={
                            a.risk_score >= 60
                              ? "bg-red-500/15 text-red-200 border-red-500/30"
                              : a.risk_score >= 30
                                ? "bg-orange-500/15 text-orange-200 border-orange-500/30"
                                : "bg-emerald-500/10 text-emerald-200 border-emerald-500/30"
                          }
                          variant="outline"
                        >
                          {a.risk_score.toFixed(1)}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {(a.critical_issues ?? 0).toString()}/{(a.high_issues ?? 0).toString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <Badge variant={a.status === "failed" ? "destructive" : a.status === "completed" ? "secondary" : "outline"}>{a.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/audits/${a.audit_id}`}>Open</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {audits.length === 0 ? (
                  <TableRow>
                    <TableCell className="py-10 text-muted-foreground" colSpan={7}>
                      No audits yet. Run a scan from the home page.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
