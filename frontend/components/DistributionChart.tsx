import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function DistributionChart({ data }: { data: Array<{ name: string; value: number }> }) {
  return (
    <div className="h-64 w-full rounded border border-slate-800 bg-slate-950/40 p-3">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="name" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip />
          <Bar dataKey="value" fill="#38bdf8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

