import { CartesianGrid, Legend, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from "recharts";

type Point = { x: number; y: number; split: string; sample_id: string };

export function DriftScatterPlot({ points }: { points: Point[] }) {
  const bySplit = {
    train: points.filter((p) => p.split === "train"),
    val: points.filter((p) => p.split === "val"),
    test: points.filter((p) => p.split === "test"),
    unknown: points.filter((p) => !["train", "val", "test"].includes(p.split))
  };
  return (
    <div className="h-72 w-full rounded border border-slate-800 bg-slate-950/40 p-3">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart>
          <CartesianGrid stroke="#334155" />
          <XAxis type="number" dataKey="x" stroke="#94a3b8" />
          <YAxis type="number" dataKey="y" stroke="#94a3b8" />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} />
          <Legend />
          <Scatter name="train" data={bySplit.train} fill="#34d399" />
          <Scatter name="val" data={bySplit.val} fill="#fbbf24" />
          <Scatter name="test" data={bySplit.test} fill="#f97316" />
          <Scatter name="unknown" data={bySplit.unknown} fill="#94a3b8" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

