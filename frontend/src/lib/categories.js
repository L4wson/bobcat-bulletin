/* Monochrome amber palette — intensity reflects incident severity */
export const CATEGORY_COLORS = {
  Medical:        { text: "#ff9900", bg: "rgba(255,153,0,0.12)", border: "rgba(255,153,0,0.45)", dot: "#ff9900" },
  Disturbance:    { text: "#ff9900", bg: "rgba(255,153,0,0.12)", border: "rgba(255,153,0,0.45)", dot: "#ff9900" },
  Theft:          { text: "#e88a00", bg: "rgba(232,138,0,0.10)", border: "rgba(232,138,0,0.40)", dot: "#e88a00" },
  Vandalism:      { text: "#e88a00", bg: "rgba(232,138,0,0.10)", border: "rgba(232,138,0,0.40)", dot: "#e88a00" },
  "Drug/Alcohol": { text: "#e88a00", bg: "rgba(232,138,0,0.10)", border: "rgba(232,138,0,0.40)", dot: "#e88a00" },
  Welfare:        { text: "#cc7722", bg: "rgba(204,119,34,0.10)", border: "rgba(204,119,34,0.38)", dot: "#cc7722" },
  Suspicious:     { text: "#cc7722", bg: "rgba(204,119,34,0.10)", border: "rgba(204,119,34,0.38)", dot: "#cc7722" },
  Traffic:        { text: "#b86a1a", bg: "rgba(184,106,26,0.09)", border: "rgba(184,106,26,0.35)", dot: "#b86a1a" },
  Alarm:          { text: "#b86a1a", bg: "rgba(184,106,26,0.09)", border: "rgba(184,106,26,0.35)", dot: "#b86a1a" },
  Patrol:         { text: "#7a4a14", bg: "rgba(122,74,20,0.08)",  border: "rgba(122,74,20,0.30)",  dot: "#7a4a14" },
  "Lost/Found":   { text: "#7a4a14", bg: "rgba(122,74,20,0.08)",  border: "rgba(122,74,20,0.30)",  dot: "#7a4a14" },
  Other:          { text: "#5a3608", bg: "rgba(90,54,8,0.08)",    border: "rgba(90,54,8,0.28)",    dot: "#5a3608" },
};

export function getCategoryStyle(category) {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS.Other;
}
