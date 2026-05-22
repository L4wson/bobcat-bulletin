import { useQuery } from "@tanstack/react-query";
import { getCategories } from "../lib/api.js";
import { getCategoryStyle } from "../lib/categories.js";
import { Search, X } from "lucide-react";
import ExcludeTypes from "./ExcludeTypes.jsx";

export default function FilterBar({ filters, onChange, showSearch = true }) {
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  function setCategory(name) {
    onChange({ ...filters, category: name === filters.category ? "" : name, page: 1 });
  }

  function setSearch(value) {
    onChange({ ...filters, search: value, page: 1 });
  }

  function clearAll() {
    onChange({ category: "", search: "", start_date: "", end_date: "", exclude_types: [], page: 1 });
  }

  const hasFilters = !!(
    filters.category || filters.search || filters.start_date || filters.end_date || filters.exclude_types?.length
  );

  return (
    <div className="space-y-3">
      {/* Search + date row */}
      <div className="flex flex-col sm:flex-row gap-2">
        {showSearch && (
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search incidents, locations, report #…"
              className="w-full bg-surface-700 border border-surface-500 rounded pl-9 pr-3 py-2 text-sm
                         text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-400
                         font-mono transition-colors"
            />
            {filters.search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X size={13} />
              </button>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <label className="flex flex-col gap-1 flex-1 min-w-0">
            <span className="sm:hidden text-xs text-slate-500 font-mono px-1">From</span>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => onChange({ ...filters, start_date: e.target.value, page: 1 })}
              className="w-full bg-surface-700 border border-surface-500 rounded px-3 py-2 text-sm text-slate-300
                         focus:outline-none focus:border-slate-400 font-mono transition-colors"
            />
          </label>
          <label className="flex flex-col gap-1 flex-1 min-w-0">
            <span className="sm:hidden text-xs text-slate-500 font-mono px-1">To</span>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => onChange({ ...filters, end_date: e.target.value, page: 1 })}
              className="w-full bg-surface-700 border border-surface-500 rounded px-3 py-2 text-sm text-slate-300
                         focus:outline-none focus:border-slate-400 font-mono transition-colors"
            />
          </label>
        </div>
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-2 items-center">
        <button
          onClick={() => setCategory("")}
          className={`filter-chip ${!filters.category ? "active" : ""}`}
        >
          All
        </button>

        {categories.map((cat) => {
          const style = getCategoryStyle(cat.name);
          const active = filters.category === cat.name;
          return (
            <button
              key={cat.name}
              onClick={() => setCategory(cat.name)}
              className={`filter-chip relative ${active ? "active" : ""}`}
              style={
                active
                  ? { borderColor: style.dot, color: style.dot, background: style.dot + "22" }
                  : {}
              }
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: style.dot }}
              />
              {cat.name}
              <span className="text-xs opacity-60">({cat.count})</span>
            </button>
          );
        })}

        {hasFilters && (
          <button onClick={clearAll} className="btn text-slate-500 hover:text-slate-300 text-xs gap-1">
            <X size={12} /> Clear
          </button>
        )}
      </div>

      {/* Exclude incident types */}
      <ExcludeTypes
        excluded={filters.exclude_types ?? []}
        onChange={(types) => onChange({ ...filters, exclude_types: types, page: 1 })}
      />
    </div>
  );
}
