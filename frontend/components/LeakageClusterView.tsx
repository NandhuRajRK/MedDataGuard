export function LeakageClusterView({ leakage }: { leakage: Record<string, unknown> }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-950/40 p-4">
      <div className="text-sm font-semibold text-slate-100">Leakage Clusters</div>
      <pre className="mt-3 overflow-auto text-xs text-slate-300">{JSON.stringify(leakage, null, 2)}</pre>
    </div>
  );
}

