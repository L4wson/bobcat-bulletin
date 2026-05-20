import { useQuery } from "@tanstack/react-query";
import { getCategories } from "../lib/api.js";
import { getCategoryStyle } from "../lib/categories.js";
import { Search, X } from "lucide-react";
import ExcludeTypes from "./ExcludeTypes.jsx";

export default function FilterBar({ filters, onChange }) {
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

  const hasFilters =
    filters.category || filters.search || filters.start_date || filters.end_date || filters.exclude_types?.length;

  return (
    <div className="space-y-3">
      {/* Search + date row */}
      <div className="text-term-dim text-xs tracking-widest mb-1 prompt">SEARCH PARAMETERS</div>
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-term-dim" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="SEARCH INCIDENTS, LOCATIONS, REPORT #..."
            className="term-input w-full pl-9 pr-8 py-2 text-xs tracking-wide rounded-none"
          />
          {filters.search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-term-dim hover:text-term-bright"
            >
              <X size={12} />
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <input
            type="date"
            value={filters.start_date}
            onChange={(e) => onChange({ ...filters, start_date: e.target.value, page: 1 })}
            className="term-input px-3 py-2 text-xs rounded-none"
          />
          <input
            type="date"
            value={filters.end_date}
            onChange={(e) => onChange({ ...filters, end_date: e.target.value, page: 1 })}
            className="term-input px-3 py-2 text-xs rounded-none"
          />
        </div>
      </div>

      {/* Category filter */}
      <div className="text-term-dim text-xs tracking-widest mb-1 prompt">FILTER BY CATEGORY</div>
      <div className="flex flex-wrap gap-1.5 items-center">
        <button
          onClick={() => setCategory("")}
          className={`term-chip text-xs tracking-widest ${!filters.category ? "active" : ""}`}
        >
          [ALL]
        </button>

        {categories.map((cat) => {
          const style = getCategoryStyle(cat.name);
          const active = filters.category === cat.name;
          return (
            <button
              key={cat.name}
              onClick={() => setCategory(cat.name)}
              className={`term-chip text-xs tracking-widest ${active ? "active" : ""}`}
              style={
                active
                  ? { borderColor: style.dot, color: style.dot, background: style.bg }
                  : {}
              }
            >
              [{cat.name.toUpperCase()}]
              <span className="opacity-50 ml-1">{cat.count}</span>
            </button>
          );
        })}

        {hasFilters && (
          <button
            onClick={clearAll}
            className="term-btn text-xs text-term-dim tracking-widest"
          >
            <X size={11} /> CLEAR ALL
          </button>
        )}
      </div>

      {/* Exclude types */}
      <ExcludeTypes
        excluded={filters.exclude_types ?? []}
        onChange={(types) => onChange({ ...filters, exclude_types: types, page: 1 })}
      />
    </div>
  );
}
