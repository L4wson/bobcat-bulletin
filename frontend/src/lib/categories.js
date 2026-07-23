export const CATEGORY_COLORS = {
  Medical:      { bg: "bg-red-500/15",    text: "text-red-400",    border: "border-red-500/40",    dot: "#ef4444" },
  Traffic:      { bg: "bg-orange-500/15", text: "text-orange-400", border: "border-orange-500/40", dot: "#f97316" },
  Theft:        { bg: "bg-yellow-500/15", text: "text-yellow-400", border: "border-yellow-500/40", dot: "#eab308" },
  Welfare:      { bg: "bg-purple-500/15", text: "text-purple-400", border: "border-purple-500/40", dot: "#a855f7" },
  Alarm:        { bg: "bg-blue-500/15",   text: "text-blue-400",   border: "border-blue-500/40",   dot: "#3b82f6" },
  Patrol:       { bg: "bg-green-500/15",  text: "text-green-400",  border: "border-green-500/40",  dot: "#22c55e" },
  Assault:      { bg: "bg-rose-500/15",   text: "text-rose-400",   border: "border-rose-500/40",   dot: "#f43f5e" },
  Disturbance:  { bg: "bg-pink-500/15",   text: "text-pink-400",   border: "border-pink-500/40",   dot: "#ec4899" },
  Suspicious:   { bg: "bg-indigo-500/15", text: "text-indigo-400", border: "border-indigo-500/40", dot: "#6366f1" },
  Vandalism:    { bg: "bg-amber-500/15",  text: "text-amber-400",  border: "border-amber-500/40",  dot: "#f59e0b" },
  "Drug/Alcohol": { bg: "bg-cyan-500/15", text: "text-cyan-400",   border: "border-cyan-500/40",   dot: "#06b6d4" },
  "Lost/Found": { bg: "bg-teal-500/15",   text: "text-teal-400",   border: "border-teal-500/40",   dot: "#14b8a6" },
  "Blue Light": { bg: "bg-sky-500/15",    text: "text-sky-400",    border: "border-sky-500/40",    dot: "#0ea5e9" },
  Flagdown:     { bg: "bg-lime-500/15",   text: "text-lime-400",   border: "border-lime-500/40",   dot: "#84cc16" },
  Assistance:   { bg: "bg-violet-500/15", text: "text-violet-400", border: "border-violet-500/40", dot: "#8b5cf6" },
  Other:        { bg: "bg-slate-500/15",  text: "text-slate-400",  border: "border-slate-500/40",  dot: "#64748b" },
};

export function getCategoryStyle(category) {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS.Other;
}
