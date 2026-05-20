import { X, Search, Filter, EyeOff, Calendar, Hash, RefreshCw } from "lucide-react";
import { useEffect } from "react";

function Section({ icon: Icon, title, children }) {
  return (
    <div className="flex gap-3">
      <div className="shrink-0 mt-0.5 w-7 h-7 rounded-md bg-surface-600 border border-surface-500 flex items-center justify-center">
        <Icon size={13} className="text-ucgold" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-slate-100 mb-1">{title}</h3>
        <p className="text-xs text-slate-400 leading-relaxed">{children}</p>
      </div>
    </div>
  );
}

export default function HelpModal({ onClose }) {
  // Close on Escape
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
      <div className="w-full max-w-lg bg-surface-800 border border-surface-500 rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-600">
          <div>
            <h2 className="text-base font-bold text-slate-100">How to use Bobcat Bulletin</h2>
            <p className="text-xs text-slate-500 mt-0.5">UC Merced campus activity at a glance</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-200 transition-colors p-1 rounded hover:bg-surface-600"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          <p className="text-xs text-slate-400 leading-relaxed">
            Bobcat Bulletin pulls incident data directly from the{" "}
            <a
              href="https://police.ucmerced.edu/daily-activity-logs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ucgold hover:underline"
            >
              UC Merced Police Department daily activity logs
            </a>{" "}
            and makes it searchable. Data covers the past 12 months and refreshes every 6 hours.
          </p>

          <div className="space-y-3.5">
            <Section icon={Filter} title="Filter by category">
              Click any category chip (Medical, Traffic, Theft, etc.) to show only incidents in that
              group. Click the active chip again — or "All" — to clear it.
            </Section>

            <Section icon={Search} title="Search">
              The search bar matches against incident type, location, disposition, and report number.
              Searching a partial report number like <span className="font-mono text-slate-300">260519</span> will
              return all incidents from that date.
            </Section>

            <Section icon={Calendar} title="Date range">
              Use the two date pickers to narrow results to a specific window. Leave one blank to
              filter from the start or up to a date with no other bound.
            </Section>

            <Section icon={EyeOff} title="Hide types">
              The "Hide types" dropdown lets you exclude specific incident types from results. Useful
              for filtering out high-volume routine entries like Building/Area Checks so rarer
              incidents are easier to find. Active exclusions appear as red chips below the filters.
            </Section>

            <Section icon={Hash} title="Report numbers">
              Every incident card shows its 10-digit case number at the bottom (e.g.{" "}
              <span className="font-mono text-slate-300">2605190011</span>). The format is{" "}
              <span className="font-mono text-slate-300">YY MM DD XXXX</span> — year, month, day,
              and a daily sequence number. You can search by full or partial number.
            </Section>

            <Section icon={RefreshCw} title="Refresh">
              Data updates automatically every 6 hours. Hit the Refresh button in the top-right to
              pull the latest data immediately without waiting for the next scheduled scrape.
            </Section>
          </div>

          <div className="pt-1 border-t border-surface-600 text-xs text-slate-500 leading-relaxed">
            <strong className="text-slate-400">Disclaimer:</strong> This dashboard is a community
            tool and is not affiliated with or endorsed by the UC Merced Police Department. Incident
            descriptions are reproduced verbatim from public records. If you believe information
            should be removed, use the feedback link in the footer.
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-surface-600 flex justify-end">
          <button
            onClick={onClose}
            className="btn bg-surface-600 border border-surface-500 text-slate-300 hover:text-slate-100 hover:border-slate-400 text-sm"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
