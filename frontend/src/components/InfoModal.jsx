import { X } from "lucide-react";
import { useEffect } from "react";

function Row({ cmd, desc }) {
  return (
    <div className="flex gap-4 py-2 border-b border-term-muted last:border-0">
      <span className="text-term-bright text-xs font-mono tracking-wide shrink-0 w-36">{cmd}</span>
      <span className="text-term-base text-xs leading-relaxed">{desc}</span>
    </div>
  );
}

export default function InfoModal({ onClose }) {
  useEffect(() => {
    function handler(e) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg bg-term-bg border border-term-border shadow-2xl"
        style={{ boxShadow: "0 0 40px rgba(255,153,0,0.15)" }}
      >
        {/* Title bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-term-border bg-term-card">
          <span
            className="text-term-bright glow-sm tracking-widest"
            style={{ fontFamily: "VT323, monospace", fontSize: "1.3rem" }}
          >
            // TERMINAL HELP
          </span>
          <button onClick={onClose} className="text-term-dim hover:text-term-bright transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 py-4 max-h-[70vh] overflow-y-auto space-y-1">
          <div className="text-term-dim text-xs tracking-widest mb-3 prompt">COMMAND REFERENCE</div>

          <Row cmd="SEARCH BAR"       desc="Filter by incident type, location, disposition, or report number. Paste a 10-digit report number to find a specific record." />
          <Row cmd="[CATEGORY]"       desc="Click any category chip to show only that type. Click again or [ALL] to reset." />
          <Row cmd="[HIDE TYPES]"     desc="Open the exclusion list to hide specific incident types from results. Useful for removing routine Building/Area Check patrol entries." />
          <Row cmd="DATE RANGE"       desc="Use the two date fields to constrain results to a specific window. Both are optional." />
          <Row cmd="RPT# NUMBER"      desc="Each card shows the UCMPD case number. Search it directly to retrieve that exact incident." />
          <Row cmd="REFRESH"          desc="Pulls the latest data from UCMPD immediately. Otherwise the database syncs automatically every 6 hours." />
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-term-muted text-term-muted text-xs tracking-widest text-center">
          DATA SOURCE: UCMPD DAILY ACTIVITY LOGS · NOT AFFILIATED WITH UCMPD
        </div>
      </div>
    </div>
  );
}
