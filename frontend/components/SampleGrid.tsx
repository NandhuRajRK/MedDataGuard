export function SampleGrid({ samples }: { samples: Array<Record<string, unknown>> }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {samples.map((sample) => (
        <div key={String(sample.sample_id)} className="rounded border border-slate-800 bg-slate-950/40 p-3">
          <div className="text-sm font-medium text-slate-200">{String(sample.sample_id)}</div>
          <div className="mt-1 text-xs text-slate-400">Split: {String(sample.split ?? "unknown")}</div>
        </div>
      ))}
    </div>
  );
}

