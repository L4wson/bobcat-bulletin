import { useCallback, useState } from "react";

const DEFAULT = {
  category: "",
  search: "",
  start_date: "",
  end_date: "",
  exclude_types: [],
  page: 1,
};

function toParams(filters) {
  const p = new URLSearchParams();
  if (filters.category) p.set("category", filters.category);
  if (filters.search) p.set("search", filters.search);
  if (filters.start_date) p.set("start_date", filters.start_date);
  if (filters.end_date) p.set("end_date", filters.end_date);
  if (filters.page > 1) p.set("page", String(filters.page));
  (filters.exclude_types ?? []).forEach((t) => p.append("exclude_types", t));
  return p;
}

function fromParams(search) {
  const p = new URLSearchParams(search);
  return {
    category: p.get("category") ?? "",
    search: p.get("search") ?? "",
    start_date: p.get("start_date") ?? "",
    end_date: p.get("end_date") ?? "",
    page: parseInt(p.get("page") ?? "1", 10),
    exclude_types: p.getAll("exclude_types"),
  };
}

export function useFilterState(localDefaults = {}) {
  const [filters, setFilters] = useState(() => {
    const hasUrlParams = window.location.search.length > 1;
    if (hasUrlParams) return { ...DEFAULT, ...fromParams(window.location.search) };
    return { ...DEFAULT, ...localDefaults };
  });

  const setFiltersAndUrl = useCallback((next) => {
    setFilters(next);
    const qs = toParams(next).toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, []);

  return [filters, setFiltersAndUrl];
}
