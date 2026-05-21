import type { Issue } from "../lib/types";

function severityColor(sev: Issue["severity"]) {
  switch (sev) {
    case "critical":
      return "text-red-300";
    case "high":
      return "text-orange-300";
    case "medium":
      return "text-yellow-300";
    case "low":
      return "text-slate-300";
    default:
      return "text-slate-400";
  }
}

export function IssueTable({ issues }: { issues: Issue[] }) {
  return (
    <div className="overflow-hidden rounded border border-slate-800">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-900/40 text-xs text-slate-400">
          <tr>
            <th className="px-3 py-2">Severity</th>
            <th className="px-3 py-2">Category</th>
            <th className="px-3 py-2">Message</th>
            <th className="px-3 py-2">Split</th>
            <th className="px-3 py-2">Sample</th>
          </tr>
        </thead>
        <tbody>
          {issues.map((i) => (
            <tr key={i.issue_id} className="border-t border-slate-800">
              <td className={`px-3 py-2 font-medium ${severityColor(i.severity)}`}>{i.severity}</td>
              <td className="px-3 py-2 text-slate-200">{i.category}</td>
              <td className="px-3 py-2 text-slate-200">{i.message}</td>
              <td className="px-3 py-2 text-slate-300">{i.split ?? ""}</td>
              <td className="px-3 py-2 text-slate-300">{i.sample_id ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

