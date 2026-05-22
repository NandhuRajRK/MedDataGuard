import type { Issue } from "../lib/types";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

function severityBadge(sev: Issue["severity"]) {
  switch (sev) {
    case "critical":
      return <Badge variant="destructive">critical</Badge>;
    case "high":
      return <Badge className="bg-orange-500/15 text-orange-200 border-orange-500/30">high</Badge>;
    case "medium":
      return <Badge className="bg-yellow-500/15 text-yellow-100 border-yellow-500/30">medium</Badge>;
    case "low":
      return <Badge variant="secondary">low</Badge>;
    default:
      return <Badge variant="outline">info</Badge>;
  }
}

export function IssueTable({ issues, onRowClick }: { issues: Issue[]; onRowClick?: (issue: Issue) => void }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Severity</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Message</TableHead>
            <TableHead>Split</TableHead>
            <TableHead>Sample</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {issues.map((i) => (
            <TableRow
              key={i.issue_id}
              className={onRowClick ? "cursor-pointer" : undefined}
              onClick={onRowClick ? () => onRowClick(i) : undefined}
            >
              <TableCell className="font-medium">{severityBadge(i.severity)}</TableCell>
              <TableCell className="text-foreground">{i.category}</TableCell>
              <TableCell className="text-foreground">{i.message}</TableCell>
              <TableCell className="text-muted-foreground">{i.split ?? ""}</TableCell>
              <TableCell className="text-muted-foreground">{i.sample_id ?? ""}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
