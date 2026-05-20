import { SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import FilterBar from "./FilterBar.jsx";

export default function MobileFilterDrawer({ filters, onChange }) {
  const [open, setOpen] = useState(false);

  function handleChange(next) {
    onChange(next);
  }

  const activeCount = [
    filters.category,
    filters.search,
    filters.start_date,
    filters.end_date,
    ...(filters.exclude_types ?? []),
  ].filter(Boolean).length;

  return (
    <>
      {/* FAB — only visible on mobile */}
      <button
        onClick={() => setOpen(true)}
        className="sm:hidden fixed bottom-6 right-5 z-30 flex items-center gap-2 px-4 py-3
                   bg-ucblue text-white rounded-full shadow-lg shadow-black/40
                   border border-blue-700 active:scale-95 transition-transform"
      >
        <SlidersHorizontal size={16} />
        <span className="text-sm font-semibold">Filters</span>
        {activeCount > 0 && (
          <span className="bg-ucgold text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center leading-none">
            {activeCount}
          </span>
        )}
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="sm:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Bottom sheet */}
      <div
        className={`sm:hidden fixed bottom-0 left-0 right-0 z-50
                    bg-surface-800 border-t border-surface-500 rounded-t-2xl
                    transition-transform duration-300 ease-out
                    ${open ? "translate-y-0" : "translate-y-full"}`}
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h2 className="text-sm font-semibold text-slate-200">Filters</h2>
          <button
            onClick={() => setOpen(false)}
            className="text-slate-500 hover:text-slate-200 p-1 rounded hover:bg-surface-600"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-4 pb-8 max-h-[75vh] overflow-y-auto">
          <FilterBar filters={filters} onChange={handleChange} />
        </div>
      </div>
    </>
  );
}
