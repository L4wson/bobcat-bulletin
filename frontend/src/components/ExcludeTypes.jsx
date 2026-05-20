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

  const filtered = types.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="text-term-dim text-xs tracking-widest w-full prompt">EXCLUDE INCIDENT TYPES</div>

      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((o) => !o)}
          className={`term-chip text-xs tracking-widest ${open ? "active" : ""}`}
        >
          <EyeOff size={12} />
          [HIDE TYPES]
          {excluded.length > 0 && (
            <span className="text-term-bright font-mono ml-1">({excluded.length})</span>
          )}
          <ChevronDown size={11} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <div className="absolute left-0 top-full mt-1 z-50 w-80 bg-term-bg border border-term-border shadow-2xl"
               style={{ boxShadow: "0 0 20px rgba(255,153,0,0.1)" }}>
            {/* Search */}
            <div className="p-2 border-b border-term-border">
              <input
                autoFocus
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="FILTER TYPES..."
                className="term-input w-full px-2.5 py-1.5 text-xs rounded-none"
              />
            </div>

            {/* List */}
            <ul className="max-h-60 overflow-y-auto">
              {filtered.length === 0 && (
                <li className="px-3 py-2 text-xs text-term-dim">NO MATCH</li>
              )}
              {filtered.map((t) => {
                const active = excluded.includes(t.name);
                return (
                  <li key={t.name}>
                    <button
                      onClick={() => toggle(t.name)}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 text-left text-xs
                                  transition-colors hover:bg-term-hover tracking-wide
                                  ${active ? "text-term-bright" : "text-term-base"}`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="font-mono text-term-dim w-3">{active ? "×" : " "}</span>
                        {t.name}
                      </span>
                      <span className="text-term-muted font-mono">{t.count.toLocaleString()}</span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {excluded.length > 0 && (
              <div className="p-2 border-t border-term-border">
                <button
                  onClick={() => onChange([])}
                  className="w-full text-xs text-term-dim hover:text-term-base transition-colors py-1 tracking-widest"
                >
                  [CLEAR ALL EXCLUSIONS]
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
          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-mono
                     border border-term-border text-term-dim tracking-wide"
        >
          <EyeOff size={10} className="text-term-base" />
          {name}
          <button
            onClick={() => onChange(excluded.filter((t) => t !== name))}
            className="ml-0.5 hover:text-term-bright transition-colors"
          >
            <X size={10} />
          </button>
        </span>
      ))}
    </div>
  );
}
