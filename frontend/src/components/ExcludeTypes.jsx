import { useQuery } from "@tanstack/react-query";
import { fetchJSON } from "../lib/api.js";
import { EyeOff, X, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function ExcludeTypes({ excluded, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  const { data: types = [] } = useQuery({
    queryKey: ["incident-types"],
    queryFn: () => fetchJSON("/incident-types"),
  });

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function toggle(name) {
    onChange(
      excluded.includes(name)
        ? excluded.filter((t) => t !== name)
        : [...excluded, name]
    );
  }

  function removeOne(name) {
    onChange(excluded.filter((t) => t !== name));
  }

  const filtered = types.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Trigger button */}
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((o) => !o)}
          className={`filter-chip flex items-center gap-1.5 ${open ? "border-slate-500 text-slate-200" : ""}`}
        >
          <EyeOff size={13} />
          Hide types
          {excluded.length > 0 && (
            <span className="bg-red-500/20 text-red-400 text-xs font-mono px-1.5 py-0.5 rounded leading-none">
              {excluded.length}
            </span>
          )}
          <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <div className="absolute left-0 top-full mt-1 z-50 w-72 bg-surface-700 border border-surface-500 rounded-lg shadow-xl">
            <div className="p-2 border-b border-surface-500">
              <input
                autoFocus
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter types…"
                className="w-full bg-surface-600 border border-surface-500 rounded px-2.5 py-1.5 text-xs
                           text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-400 font-mono"
              />
            </div>
            <ul className="max-h-64 overflow-y-auto py-1">
              {filtered.length === 0 && (
                <li className="px-3 py-2 text-xs text-slate-500">No types match</li>
              )}
              {filtered.map((t) => {
                const active = excluded.includes(t.name);
                return (
                  <li key={t.name}>
                    <button
                      onClick={() => toggle(t.name)}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 text-left text-xs
                                  transition-colors hover:bg-surface-600
                                  ${active ? "text-red-400" : "text-slate-300"}`}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className={`w-3 h-3 rounded border flex items-center justify-center shrink-0
                                      ${active ? "bg-red-500/20 border-red-500/50" : "border-surface-400"}`}
                        >
                          {active && <X size={8} className="text-red-400" />}
                        </span>
                        {t.name}
                      </span>
                      <span className="text-slate-600 font-mono">{t.count.toLocaleString()}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {excluded.length > 0 && (
              <div className="p-2 border-t border-surface-500">
                <button
                  onClick={() => onChange([])}
                  className="w-full text-xs text-slate-500 hover:text-slate-300 transition-colors py-1"
                >
                  Clear all exclusions
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Active exclusion chips */}
      {excluded.map((name) => (
        <span
          key={name}
          className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs
                     bg-red-500/10 border border-red-500/30 text-red-400 font-mono"
        >
          <EyeOff size={10} />
          {name}
          <button
            onClick={() => removeOne(name)}
            className="ml-0.5 hover:text-red-300 transition-colors"
          >
            <X size={10} />
          </button>
        </span>
      ))}
    </div>
  );
}
