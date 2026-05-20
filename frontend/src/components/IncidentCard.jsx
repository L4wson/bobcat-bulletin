import { getCategoryStyle } from "../lib/categories.js";

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
}

export default function IncidentCard({ incident }) {
  const style = getCategoryStyle(incident.category);

  return (
    <div
      className="term-card px-4 py-3 group"
      style={{ borderLeftWidth: "2px", borderLeftColor: style.dot }}
    >
      {/* Row 1: category + date/time */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span
          className="term-badge text-xs tracking-widest"
          style={{ color: style.text, borderColor: style.border, background: style.bg }}
        >
          [{incident.category.toUpperCase()}]
        </span>
        <span className="text-term-dim text-xs font-mono tracking-wide shrink-0">
          {formatDate(incident.date)} {incident.time}
        </span>
      </div>

      {/* Row 2: incident type */}
      <div
        className="text-term-bright text-sm tracking-wide mb-2 group-hover:glow transition-all"
        style={{ textShadow: "0 0 4px rgba(255,153,0,0.4)" }}
      >
        &gt; {incident.incident_type.toUpperCase()}
      </div>

      {/* Location */}
      {incident.location && (
        <div className="text-term-base text-xs leading-snug mb-1 tracking-wide">
          LOC: {incident.location}
        </div>
      )}

      {/* Disposition */}
      {incident.disposition && (
        <div className="text-term-dim text-xs tracking-wide mb-2">
          DISP: {incident.disposition.toUpperCase()}
        </div>
      )}

      {/* Case number */}
      <div className="border-t border-term-muted pt-2 mt-2">
        <span className="text-term-muted text-xs font-mono tracking-widest">
          RPT# {incident.case_number}
        </span>
      </div>
    </div>
  );
}
