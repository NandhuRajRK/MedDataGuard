"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import { getAudit } from "../../../../lib/api";
import type { Audit } from "../../../../lib/types";
import { Alert, AlertDescription, AlertTitle } from "../../../../components/ui/alert";
import { Badge } from "../../../../components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../components/ui/table";

type SampleRow = {
  sample_id?: string;
  split?: string;
  image_path?: string;
  mask_path?: string;
};

export default function SamplesPage({ params }: { params: { auditId: string } }) {
  const [audit, setAudit] = useState<Audit | null>(null);
  const [err, setErr] = useState<string>("");
  const sp = useSearchParams();
  const highlight = sp.get("sample") ?? "";
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});

  useEffect(() => {
    getAudit(params.auditId).then(setAudit).catch((e) => setErr(e instanceof Error ? e.message : "Failed to load"));
  }, [params.auditId]);

  useEffect(() => {
    if (!highlight) return;
    const el = rowRefs.current[highlight];
    if (el) el.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [highlight, audit?.audit_id]);

  const samples = useMemo(() => (audit?.samples ?? []) as SampleRow[], [audit]);

  if (err)
    return (
      <Alert variant="destructive">
        <AlertTitle>Failed to load samples</AlertTitle>
        <AlertDescription>{err}</AlertDescription>
      </Alert>
    );
  if (!audit) return <div className="text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Samples</CardTitle>
          <CardDescription>Showing first {samples.length} samples (MVP). Click from Issues to deep-link a sample.</CardDescription>
        </CardHeader>
        <CardContent>
          {highlight ? (
            <div className="mb-4 flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Highlighted:</span>
              <Badge variant="outline">{highlight}</Badge>
            </div>
          ) : null}

          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sample</TableHead>
                  <TableHead>Split</TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead>Mask</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {samples.map((s) => {
                  const sid = String(s.sample_id ?? "");
                  const isHit = highlight && sid === highlight;
                  return (
                    <TableRow
                      key={sid}
                      ref={(el) => {
                        rowRefs.current[sid] = el;
                      }}
                      className={isHit ? "bg-emerald-500/10" : undefined}
                    >
                      <TableCell className="font-medium">{sid}</TableCell>
                      <TableCell className="text-muted-foreground">{String(s.split ?? "")}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{String(s.image_path ?? "")}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{String(s.mask_path ?? "")}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

