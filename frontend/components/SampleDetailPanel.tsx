export function SampleDetailPanel({ sample }: { sample: Record<string, unknown> | null }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-950/40 p-4">
      <div className="text-sm font-semibold text-slate-100">Sample Detail</div>
      <pre className="mt-3 overflow-auto text-xs text-slate-300">{JSON.stringify(sample ?? {}, null, 2)}</pre>
    </div>
  );
}

