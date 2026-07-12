import { useQuery } from "@tanstack/react-query";
import { getIncidents } from "../lib/api.js";
import { useFilterState } from "../hooks/useFilterState.js";
import { useLocalStorage } from "../hooks/useLocalStorage.js";
import StatsBar from "../components/StatsBar.jsx";
import FilterBar from "../components/FilterBar.jsx";
import MobileFilterDrawer from "../components/MobileFilterDrawer.jsx";
import IncidentCard from "../components/IncidentCard.jsx";
import Pagination from "../components/Pagination.jsx";
import { AlertCircle, Loader2, Search, X } from "lucide-react";

const PER_PAGE = 50;

export default function Home() {
  const [savedCategory, setSavedCategory] = useLocalStorage("pref_category", "");
  const [savedExcludeTypes, setSavedExcludeTypes] = useLocalStorage("pref_exclude_types", []);

  const [filters, setFilters] = useFilterState({
    category: savedCategory,
    exclude_types: savedExcludeTypes,
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["incidents", filters],
    queryFn: () =>
      getIncidents({
        category: filters.category,
        search: filters.search,
        start_date: filters.start_date,
        end_date: filters.end_date,
        exclude_type: filters.exclude_types,
        page: filters.page,
        per_page: PER_PAGE,
      }),
    keepPreviousData: true,
  });

  function handleFiltersChange(next) {
    setFilters(next);
    setSavedCategory(next.category);
    setSavedExcludeTypes(next.exclude_types ?? []);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handlePageChange(nextPage) {
    handleFiltersChange({ ...filters, page: nextPage });
  }

  return (
    <>
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <StatsBar />

        {/* Search — mobile only, shown below stats */}
        <div className="relative sm:hidden">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => handleFiltersChange({ ...filters, search: e.target.value, page: 1 })}
            placeholder="Search incidents, locations, report #…"
            className="w-full bg-surface-700 border border-surface-500 rounded pl-9 pr-3 py-2 text-sm
                       text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-400
                       font-mono transition-colors"
          />
          {filters.search && (
            <button
              onClick={() => handleFiltersChange({ ...filters, search: "", page: 1 })}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Filter bar — hidden on mobile (drawer handles it) */}
        <div className="hidden sm:block">
          <FilterBar filters={filters} onChange={handleFiltersChange} />
        </div>

        {/* Results area */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Loader2 size={32} className="animate-spin mb-3 text-ucgold" />
            <p className="text-sm">Loading incidents…</p>
          </div>
        )}

        {isError && (
          <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            <AlertCircle size={16} className="shrink-0" />
            Failed to load incidents. Is the backend running?
          </div>
        )}

        {data && !isLoading && (
          <>
            {data.incidents.length === 0 ? (
              <div className="text-center py-20 text-slate-500">
                <p className="text-lg mb-1">No incidents found</p>
                <p className="text-sm">Try adjusting your filters</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {data.incidents.map((inc) => (
                    <IncidentCard key={inc.id} incident={inc} />
                  ))}
                </div>

                {data.pages > 1 && (
                  <Pagination
                    page={data.page}
                    pages={data.pages}
                    total={data.total}
                    perPage={PER_PAGE}
                    onChange={handlePageChange}
                  />
                )}
              </>
            )}
          </>
        )}

        {!isLoading && !isError && !data && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Loader2 size={32} className="animate-spin mb-3 text-ucgold" />
            <p className="text-sm">Connecting to backend…</p>
          </div>
        )}
      </main>

      {/* Mobile filter drawer + FAB */}
      <MobileFilterDrawer filters={filters} onChange={handleFiltersChange} />
    </>
  );
}
