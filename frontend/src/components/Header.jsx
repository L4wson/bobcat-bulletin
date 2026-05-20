import { Shield, RefreshCw, CircleHelp } from "lucide-react";
import { triggerScrape } from "../lib/api.js";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import InfoModal from "./InfoModal.jsx";

export default function Header({ lastUpdated }) {
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await triggerScrape();
      await qc.invalidateQueries();
    } finally {
      setRefreshing(false);
    }
  }

  const formatted = lastUpdated
    ? new Date(lastUpdated).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  return (
    <>
      <header className="sticky top-0 z-40 bg-surface-800/90 backdrop-blur border-b border-surface-500">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo / Title */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-ucblue">
              <Shield size={18} className="text-ucgold" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight leading-none text-slate-100">
                Bobcat Bulletin
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">UC Merced Police Activity Log</p>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {formatted && (
              <span className="hidden sm:block text-xs text-slate-500 font-mono mr-2">
                Updated {formatted}
              </span>
            )}

            <button
              onClick={() => setShowInfo(true)}
              title="How to use"
              className="p-1.5 rounded text-slate-500 hover:text-slate-300 hover:bg-surface-600 transition-colors"
            >
              <CircleHelp size={16} />
            </button>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="btn bg-surface-600 border border-surface-500 text-slate-300 hover:text-slate-100 hover:border-slate-400 disabled:opacity-50"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
              <span className="hidden sm:inline">{refreshing ? "Updating…" : "Refresh"}</span>
            </button>
          </div>
        </div>
      </header>

      {showInfo && <InfoModal onClose={() => setShowInfo(false)} />}
    </>
  );
}
