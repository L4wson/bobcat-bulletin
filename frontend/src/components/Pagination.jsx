import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ page, pages, total, perPage, onChange }) {
  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-500 text-xs font-mono">
        {from}–{to} of {total.toLocaleString()} incidents
      </span>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="btn bg-surface-700 border border-surface-500 text-slate-400
                     hover:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={14} />
        </button>

        <span className="px-3 py-1.5 bg-surface-700 border border-surface-500 rounded text-slate-300 font-mono text-xs">
          {page} / {pages}
        </span>

        <button
          onClick={() => onChange(page + 1)}
          disabled={page >= pages}
          className="btn bg-surface-700 border border-surface-500 text-slate-400
                     hover:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
