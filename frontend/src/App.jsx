import { useQuery } from "@tanstack/react-query";
import { getIncidents, getStats } from "./lib/api.js";
import { useFilterState } from "./hooks/useFilterState.js";
import { useLocalStorage } from "./hooks/useLocalStorage.js";
import Header from "./components/Header.jsx";
import StatsBar from "./components/StatsBar.jsx";
import FilterBar from "./components/FilterBar.jsx";
import MobileFilterDrawer from "./components/MobileFilterDrawer.jsx";
import IncidentCard from "./components/IncidentCard.jsx";
import Pagination from "./components/Pagination.jsx";
import { AlertCircle, Loader2 } from "lucide-react";

const PER_PAGE = 50;

export default function App() {
  const [savedCategory, setSavedCategory] = useLocalStorage("pref_category", "");
  const [savedExcludeTypes, setSavedExcludeTypes] = useLocalStorage("pref_exclude_types", []);

  const [filters, setFilters] = useFilterState({
    category: savedCategory,
    exclude_types: savedExcludeTypes,
  });

  const { data: stats } = useQuery({ queryKey: ["stats"], queryFn: getStats });

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
    <div className="min-h-screen bg-surface-900">
      <Header lastUpdated={stats?.last_updated} />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <StatsBar />

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

      <footer className="border-t border-surface-600 mt-12 py-6 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <span>
            Data sourced from{" "}
            <a
              href="https://police.ucmerced.edu/daily-activity-logs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-slate-300 underline"
            >
              UC Merced Police Department
            </a>
            . Not affiliated with or endorsed by UCMPD.
          </span>
          <a
            href="https://github.com/L4wson/bobcat-bulletin/issues/new/choose"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-500 hover:text-slate-300 underline whitespace-nowrap"
          >
            Suggestions · Questions · Request removal
          </a>
        </div>
      </footer>
    </div>
  );
}
