import { X, Search, Filter, EyeOff, RefreshCw, Hash, Calendar } from "lucide-react";
import { useEffect } from "react";

function Section({ icon: Icon, title, children }) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 shrink-0 w-7 h-7 rounded-lg bg-surface-600 border border-surface-500 flex items-center justify-center">
        <Icon size={14} className="text-ucgold" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-slate-100 mb-1">{title}</h3>
        <p className="text-xs text-slate-400 leading-relaxed">{children}</p>
      </div>
    </div>
  );
}

export default function InfoModal({ onClose }) {
  useEffect(() => {
    function handler(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md bg-surface-800 border border-surface-500 rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-600">
          <div>
            <h2 className="text-base font-bold text-slate-100">How to use Bobcat Bulletin</h2>
            <p className="text-xs text-slate-500 mt-0.5">UC Merced campus activity at a glance</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 transition-colors p-1 rounded hover:bg-surface-600"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-5 max-h-[70vh] overflow-y-auto">
          <Section icon={Search} title="Search">
            Type anything into the search bar to filter by incident type, location, disposition, or
            report number. Searching a 10-digit number like{" "}
            <span className="font-mono text-ucgold">2605190011</span> will find that specific report.
          </Section>

          <Section icon={Filter} title="Filter by category">
            Click a category chip — Medical, Traffic, Theft, etc. — to show only incidents in that
            group. Click it again or click <strong className="text-slate-300">All</strong> to clear
            the filter.
          </Section>

          <Section icon={EyeOff} title="Hide incident types">
            Use the <strong className="text-slate-300">Hide types</strong> button to exclude specific
            types from results. Great for hiding routine{" "}
            <span className="font-mono text-slate-300">Building/Area Check</span> patrols so
            noteworthy incidents are easier to spot.
          </Section>

          <Section icon={Calendar} title="Date range">
            Use the two date pickers to narrow results to a specific window, such as the past week or
            a single day.
          </Section>

          <Section icon={Hash} title="Report numbers">
            Every incident card shows its UCMPD case number at the bottom. You can paste that number
            directly into the search bar to pull up that exact report.
          </Section>

          <Section icon={RefreshCw} title="Live updates">
            Data is pulled from the UCMPD activity log every <strong className="text-slate-300">6 hours</strong>{" "}
            automatically. Hit <strong className="text-slate-300">Refresh</strong> in the top-right
            corner to fetch the latest data right now.
          </Section>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-surface-600 text-xs text-slate-500 text-center">
          Data sourced from UC Merced Police Department · Not affiliated with UCMPD
        </div>
      </div>
    </div>
  );
}
