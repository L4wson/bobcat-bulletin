import { RefreshCw, CircleHelp } from "lucide-react";
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
        month: "2-digit",
        day:   "2-digit",
        year:  "numeric",
        hour:  "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : null;

  return (
    <>
      <header className="sticky top-0 z-40 bg-term-bg border-b border-term-border">
        {/* Top bar */}
        <div className="border-b border-term-muted px-4 py-1 flex items-center justify-between">
          <span className="text-term-dim text-xs font-mono tracking-widest uppercase">
            ROBCO INDUSTRIES (TM) TERMLINK PROTOCOL
          </span>
          <span className="text-term-dim text-xs font-mono">
            ENTER PASSWORD NOW
          </span>
        </div>

        {/* Main header row */}
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Title */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col leading-none">
              <span
                className="text-term-bright glow-sm"
                style={{ fontFamily: "VT323, monospace", fontSize: "2rem", lineHeight: 1 }}
              >
                BOBCAT BULLETIN
              </span>
              <span className="text-term-dim text-xs tracking-widest mt-0.5">
                // UC MERCED POLICE ACTIVITY LOG v1.0
              </span>
            </div>
            <div className="sm:hidden text-term-bright glow-sm" style={{ fontFamily: "VT323, monospace", fontSize: "1.5rem" }}>
              BOBCAT BULLETIN
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-3">
            {formatted && (
              <span className="hidden md:block text-term-dim text-xs font-mono tracking-wide">
                LAST UPDATE: {formatted}
              </span>
            )}

            <button
              onClick={() => setShowInfo(true)}
              title="How to use"
              className="p-1.5 text-term-dim hover:text-term-bright transition-colors"
            >
              <CircleHelp size={15} />
            </button>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="term-btn disabled:opacity-40"
            >
              <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
              <span className="hidden sm:inline text-xs tracking-widest">
                {refreshing ? "SYNCING..." : "REFRESH"}
              </span>
            </button>
          </div>
        </div>
      </header>

      {showInfo && <InfoModal onClose={() => setShowInfo(false)} />}
    </>
  );
}
