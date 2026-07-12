import { Link } from "react-router-dom";
import { MapPin, Clock, Hash, CheckCircle } from "lucide-react";
import { getCategoryStyle } from "../lib/categories.js";
import { formatDate, formatTime } from "../lib/format.js";

export default function IncidentCard({ incident }) {
  const style = getCategoryStyle(incident.category);

  return (
    <Link
      to={`/incident/${encodeURIComponent(incident.case_number)}`}
      className="card block p-4 hover:border-slate-500 transition-colors duration-150 group"
      style={{ borderLeftWidth: "3px", borderLeftColor: style.dot }}
    >
      {/* Top row: category badge + date/time */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <span
          className={`badge ${style.bg} ${style.text} border ${style.border}`}
        >
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: style.dot }} />
          {incident.category}
        </span>

        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono shrink-0">
          <span>{formatDate(incident.date)}</span>
          <span className="text-slate-600">·</span>
          <Clock size={11} />
          <span>{formatTime(incident.date, incident.time)}</span>
        </div>
      </div>

      {/* Incident type */}
      <h3 className="text-sm font-semibold text-slate-100 mb-1.5 group-hover:text-white transition-colors">
        {incident.incident_type}
      </h3>

      {/* Location */}
      {incident.location && (
        <div className="flex items-start gap-1.5 text-xs text-slate-400 mb-1.5">
          <MapPin size={12} className="shrink-0 mt-0.5 text-slate-500" />
          <span className="leading-snug">{incident.location}</span>
        </div>
      )}

      {/* Disposition */}
      {incident.disposition && (
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <CheckCircle size={11} className="shrink-0 text-slate-600" />
          <span>{incident.disposition}</span>
        </div>
      )}

      {/* Case number */}
      <div className="flex items-center gap-1 mt-2 pt-2 border-t border-surface-600">
        <Hash size={10} className="text-slate-600" />
        <span className="text-xs font-mono text-slate-600">{incident.case_number}</span>
      </div>
    </Link>
  );
}
