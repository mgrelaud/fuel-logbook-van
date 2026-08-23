import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { computeBlocs, formatDate, nf, type Plein } from "@/lib/conso";

export function ConsoChart({ pleins }: { pleins: Plein[] }) {
  const data = computeBlocs(pleins)
    .filter((b) => b.cloture && b.conso != null)
    .map((b) => ({
      date: formatDate(b.pleins[b.pleins.length - 1]!.date),
      conso: Number((b.conso as number).toFixed(2)),
    }));

  if (data.length < 2) {
    return (
      <div className="card-surface p-5 text-sm text-muted-foreground">
        Ajoutez au moins deux pleins avec distance pour voir l'évolution.
      </div>
    );
  }

  return (
    <div className="card-surface p-4">
      <h3 className="mb-3 text-sm font-medium text-muted-foreground">Évolution (L/100 km)</h3>
      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 8, bottom: 0, left: -20 }}>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
              tickLine={false}
              axisLine={false}
              minTickGap={20}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
              tickLine={false}
              axisLine={false}
              width={40}
              domain={["dataMin - 1", "dataMax + 1"]}
            />
            <Tooltip
              contentStyle={{
                background: "var(--color-popover)",
                border: "1px solid var(--color-border)",
                borderRadius: 12,
                fontSize: 12,
              }}
              labelStyle={{ color: "var(--color-muted-foreground)" }}
              formatter={(v: number) => [`${nf(v)} L/100 km`, ""]}
            />
            <Line
              type="monotone"
              dataKey="conso"
              stroke="var(--color-primary)"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "var(--color-primary)" }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
