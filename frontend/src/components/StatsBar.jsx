import { useQuery } from "@tanstack/react-query";
import { getStats } from "../lib/api.js";
import { Activity, Calendar, TrendingUp, Clock } from "lucide-react";

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="card px-4 py-3 flex items-center gap-3">
      <div
        className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
        style={{ background: accent + "22" }}
      >
        <Icon size={15} style={{ color: accent }} />
      </div>
      <div>
        <div className="text-lg font-bold font-mono leading-none text-slate-100">
          {value ?? "—"}
        </div>
        <div className="text-xs text-slate-500 mt-0.5">{label}</div>
      </div>
    </div>
  );
}

export default function StatsBar() {
  const { data } = useQuery({ queryKey: ["stats"], queryFn: getStats });

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard icon={Activity}    label="Total Incidents"   value={data?.total?.toLocaleString()}      accent="#FDB71A" />
      <StatCard icon={Calendar}    label="This Month"        value={data?.this_month?.toLocaleString()}  accent="#6366f1" />
      <StatCard icon={Clock}       label="This Week"         value={data?.this_week?.toLocaleString()}   accent="#22c55e" />
      <StatCard icon={TrendingUp}  label="Top Category"      value={data?.top_category}                  accent="#ef4444" />
    </div>
  );
}
