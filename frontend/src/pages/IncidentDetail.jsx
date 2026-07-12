import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle,
  Clock,
  Hash,
  Link2,
  Loader2,
  MapPin,
} from "lucide-react";
import { getIncident } from "../lib/api.js";
import { getCategoryStyle } from "../lib/categories.js";
import { formatDate, formatTime } from "../lib/format.js";
import IncidentCard from "../components/IncidentCard.jsx";

function DetailRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3">
      <Icon size={16} className="shrink-0 mt-0.5 text-slate-500" />
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500 mb-0.5">{label}</p>
        <p className="text-sm text-slate-200">{children}</p>
      </div>
    </div>
  );
}

export default function IncidentDetail() {
  const { caseNumber } = useParams();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [caseNumber]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["incident", caseNumber],
    queryFn: () => getIncident(caseNumber),
    retry: (failureCount, err) => !err.message.includes("404") && failureCount < 2,
  });

  async function copyLink() {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard API unavailable (insecure context / permission denied)
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } finally {
        ta.remove();
      }
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const notFound = isError && error?.message?.includes("404");

  return (
    <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
      >
        <ArrowLeft size={15} />
        Back to all incidents
      </Link>

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <Loader2 size={32} className="animate-spin mb-3 text-ucgold" />
          <p className="text-sm">Loading incident…</p>
        </div>
      )}

      {notFound && (
        <div className="text-center py-20 text-slate-500">
          <p className="text-lg mb-1">Incident not found</p>
          <p className="text-sm">
            No incident with case number <span className="font-mono">{caseNumber}</span> exists.
          </p>
        </div>
      )}

      {isError && !notFound && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          <AlertCircle size={16} className="shrink-0" />
          Failed to load incident. Is the backend running?
        </div>
      )}

      {data && (
        <>
          <div
            className="card p-6"
            style={{
              borderLeftWidth: "3px",
              borderLeftColor: getCategoryStyle(data.incident.category).dot,
            }}
          >
            {/* Category badge + copy link */}
            <div className="flex items-start justify-between gap-2 mb-4">
              <CategoryBadge category={data.incident.category} />
              <button
                onClick={copyLink}
                className="btn bg-surface-600 border border-surface-500 text-slate-400 hover:text-slate-100 hover:border-slate-400 text-xs"
              >
                {copied ? <Check size={13} /> : <Link2 size={13} />}
                {copied ? "Copied" : "Copy link"}
              </button>
            </div>

            <h1 className="text-xl font-bold text-slate-100 mb-5">
              {data.incident.incident_type}
            </h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DetailRow icon={Calendar} label="Date">
                {formatDate(data.incident.date, { year: "numeric" })}
              </DetailRow>
              <DetailRow icon={Clock} label="Time">
                {formatTime(data.incident.date, data.incident.time) || "Unknown"}
              </DetailRow>
              <DetailRow icon={MapPin} label="Location">
                {data.incident.location || "Not specified"}
              </DetailRow>
              <DetailRow icon={CheckCircle} label="Disposition">
                {data.incident.disposition || "Not specified"}
              </DetailRow>
              <DetailRow icon={Hash} label="Case number">
                <span className="font-mono">{data.incident.case_number}</span>
              </DetailRow>
            </div>
          </div>

          {data.related.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-slate-300 mb-3">
                More at this location{" "}
                <span className="text-slate-500 font-normal">(within 30 days)</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.related.map((inc) => (
                  <IncidentCard key={inc.id} incident={inc} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}

function CategoryBadge({ category }) {
  const style = getCategoryStyle(category);
  return (
    <span className={`badge ${style.bg} ${style.text} border ${style.border}`}>
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: style.dot }} />
      {category}
    </span>
  );
}
