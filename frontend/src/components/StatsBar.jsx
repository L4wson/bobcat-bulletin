import { useQuery } from "@tanstack/react-query";
import { getStats } from "../lib/api.js";

function StatBlock({ label, value }) {
  return (
    <div className="term-card px-4 py-3">
      <div className="text-term-dim text-xs tracking-widest mb-1 uppercase">{label}</div>
      <div
        className="text-term-bright glow"
        style={{ fontFamily: "VT323, monospace", fontSize: "2rem", lineHeight: 1 }}
      >
        {value ?? "---"}
      </div>
    </div>
  );
}

export default function StatsBar() {
  const { data } = useQuery({ queryKey: ["stats"], queryFn: getStats });

  return (
    <div>
      <div className="text-term-dim text-xs tracking-widest mb-2 prompt">SYSTEM STATUS</div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <StatBlock label="TOTAL INCIDENTS" value={data?.total?.toLocaleString()} />
        <StatBlock label="THIS MONTH"      value={data?.this_month?.toLocaleString()} />
        <StatBlock label="THIS WEEK"       value={data?.this_week?.toLocaleString()} />
        <StatBlock label="TOP CATEGORY"    value={data?.top_category?.toUpperCase()} />
      </div>
    </div>
  );
}
