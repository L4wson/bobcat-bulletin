import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getStats } from "./lib/api.js";
import Header from "./components/Header.jsx";
import FeedbackModal from "./components/FeedbackModal.jsx";
import Home from "./pages/Home.jsx";
import IncidentDetail from "./pages/IncidentDetail.jsx";
import Admin from "./pages/Admin.jsx";

export default function App() {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const { data: stats } = useQuery({ queryKey: ["stats"], queryFn: getStats });

  return (
    <div className="min-h-screen bg-surface-900">
      <Header lastUpdated={stats?.last_updated} />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/incident/:caseNumber" element={<IncidentDetail />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>

      {feedbackOpen && <FeedbackModal onClose={() => setFeedbackOpen(false)} />}

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
          <button
            onClick={() => setFeedbackOpen(true)}
            className="text-slate-500 hover:text-slate-300 underline whitespace-nowrap"
          >
            Suggestions · Questions · Request removal
          </button>
        </div>
      </footer>
    </div>
  );
}
