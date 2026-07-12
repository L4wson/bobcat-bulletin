export function formatDate(iso, opts = {}) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    ...opts,
  });
}

export function formatTime(dateIso, timeStr) {
  if (!timeStr) return "";
  // Times from UCMPD are Pacific Time — convert to user's local timezone
  const refUtc = new Date(`${dateIso}T20:00:00Z`);
  const pacificHour = parseInt(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Los_Angeles",
      hour: "2-digit",
      hour12: false,
    }).format(refUtc)
  );
  const offsetHours = 20 - pacificHour; // 7 = PDT, 8 = PST
  const [h, m] = timeStr.split(":").map(Number);
  const utcMs =
    new Date(`${dateIso}T00:00:00Z`).getTime() +
    (h + offsetHours) * 3_600_000 +
    m * 60_000;
  return new Date(utcMs).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
