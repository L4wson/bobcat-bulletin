const BASE = "/api";

export async function fetchJSON(path, params = {}) {
  const url = new URL(BASE + path, window.location.origin);
  Object.entries(params).forEach(([k, v]) => {
    if (v === null || v === undefined || v === "") return;
    if (Array.isArray(v)) {
      v.forEach((item) => url.searchParams.append(k, item));
    } else {
      url.searchParams.set(k, v);
    }
  });
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export const getIncidents = (params) => fetchJSON("/incidents", params);
export const getCategories = () => fetchJSON("/categories");
export const getStats = () => fetchJSON("/stats");
export const triggerScrape = () =>
  fetch("/api/scrape", { method: "POST" }).then((r) => r.json());
