import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ page, pages, total, perPage, onChange }) {
  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

  return (
    <div className="flex items-center justify-between text-xs font-mono tracking-wide border-t border-term-border pt-4">
      <span className="text-term-dim">
        SHOWING {from.toLocaleString()}–{to.toLocaleString()} OF {total.toLocaleString()} RECORDS
      </span>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="term-btn py-1 px-2 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={13} /> PREV
        </button>

        <span className="text-term-base px-3 border border-term-border py-1">
          {page} / {pages}
        </span>

        <button
          onClick={() => onChange(page + 1)}
          disabled={page >= pages}
          className="term-btn py-1 px-2 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          NEXT <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}
