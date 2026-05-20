import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getIncidents, getStats } from "./lib/api.js";
import Header from "./components/Header.jsx";
import StatsBar from "./components/StatsBar.jsx";
import FilterBar from "./components/FilterBar.jsx";
import IncidentCard from "./components/IncidentCard.jsx";
import Pagination from "./components/Pagination.jsx";
import FeedbackModal from "./components/FeedbackModal.jsx";

const DEFAULT_FILTERS = {
  category: "",
  search: "",
  start_date: "",
  end_date: "",
  exclude_types: [],
  page: 1,
};

const PER_PAGE = 50;

export default function App() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [showFeedback, setShowFeedback] = useState(false);

  const { data: stats } = useQuery({ queryKey: ["stats"], queryFn: getStats });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["incidents", filters],
    queryFn: () =>
      getIncidents({
        category:     filters.category,
        search:       filters.search,
        start_date:   filters.start_date,
        end_date:     filters.end_date,
        exclude_type: filters.exclude_types,
        page:         filters.page,
        per_page:     PER_PAGE,
      }),
    keepPreviousData: true,
  });

  function handleFiltersChange(next) {
    setFilters(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="min-h-screen bg-term-bg relative animate-flicker">
      {/* CRT scanlines + vignette overlay */}
      <div className="crt-overlay" aria-hidden="true" />

      <Header lastUpdated={stats?.last_updated} />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <StatsBar />

        <div className="border-t border-term-muted pt-6">
          <FilterBar filters={filters} onChange={handleFiltersChange} />
        </div>

        {/* Results */}
        <div className="border-t border-term-muted pt-4">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20 text-term-dim">
              <div
                className="text-term-bright glow mb-2 cursor"
                style={{ fontFamily: "VT323, monospace", fontSize: "1.5rem" }}
              >
                LOADING
              </div>
              <p className="text-xs tracking-widest">ACCESSING DATABASE...</p>
            </div>
          )}

          {isError && (
            <div className="border border-term-border px-4 py-3 text-term-base text-xs tracking-wide">
              &gt; ERROR: FAILED TO RETRIEVE DATA. IS THE BACKEND TERMINAL ONLINE?
            </div>
          )}

          {data && !isLoading && (
            <>
              <div className="flex items-center justify-between mb-3">
                <span className="text-term-dim text-xs tracking-widest prompt">
                  QUERY RESULTS
                </span>
                <span className="text-term-dim text-xs font-mono">
                  {data.total.toLocaleString()} RECORDS FOUND
                </span>
              </div>

              {data.incidents.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-term-dim text-xs tracking-widest">
                    &gt; NO RECORDS MATCH QUERY PARAMETERS
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                    {data.incidents.map((inc) => (
                      <IncidentCard key={inc.id} incident={inc} />
                    ))}
                  </div>

                  {data.pages > 1 && (
                    <div className="mt-4">
                      <Pagination
                        page={data.page}
                        pages={data.pages}
                        total={data.total}
                        perPage={PER_PAGE}
                        onChange={(p) => handleFiltersChange({ ...filters, page: p })}
                      />
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </main>

      <footer className="border-t border-term-border mt-12 py-5 text-center text-xs text-term-muted font-mono tracking-widest space-y-1.5">
        <div>
          DATA SOURCE:{" "}
          <a
            href="https://police.ucmerced.edu/daily-activity-logs"
            target="_blank"
            rel="noopener noreferrer"
            className="text-term-dim hover:text-term-base underline transition-colors"
          >
            UC MERCED POLICE DEPARTMENT
          </a>
          {" "}// NOT AFFILIATED WITH UCMPD
        </div>
        <div>
          <button
            onClick={() => setShowFeedback(true)}
            className="text-term-dim hover:text-term-base underline transition-colors tracking-widest"
          >
            SUGGESTIONS · QUESTIONS · REQUEST DATA REMOVAL
          </button>
        </div>
      </footer>

      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}
    </div>
  );
}
