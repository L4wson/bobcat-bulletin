const BASE = (import.meta.env.VITE_API_BASE ?? "") + "/api";

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
export const getIncident = (caseNumber) =>
  fetchJSON(`/incidents/${encodeURIComponent(caseNumber)}`);
export const getCategories = () => fetchJSON("/categories");
export const getStats = () => fetchJSON("/stats");
export const getTrends = (days = 30) => fetchJSON("/trends", { days });

export const getComments = (caseNumber) =>
  fetchJSON(`/incidents/${encodeURIComponent(caseNumber)}/comments`);

export async function submitComment(caseNumber, { body, website = "" }) {
  const res = await fetch(`${BASE}/incidents/${encodeURIComponent(caseNumber)}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body, website }),
  });
  if (!res.ok) {
    const detail = await res.json().then((d) => d.detail).catch(() => null);
    throw new Error(detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function submitFeedback({ type, message, contact }) {
  const res = await fetch(BASE + "/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, message, contact }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
