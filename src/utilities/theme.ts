const daisyUITheme = {
  primary: "#0A506A",
  "primary-content": "#ffffff",
  secondary: "#95C4CB",
  "secondary-content": "#080e0f",
  accent: "#D0EFFB",
  "accent-content": "#080e0f",
  neutral: "#ffffff",
  "neutral-content": "#080e0f",
  "base-100": "#B6B8B9",
  "base-200": "#919394",
  "base-300": "#777879",
  "base-content": "#080e0f",
  info: "#0ea5e9",
  "info-content": "#080e0f",
  success: "#43C478",
  "success-content": "#080e0f",
  warning: "#facc15",
  "warning-content": "#080e0f",
  error: "#FF5861",
  "error-content": "#080e0f",
  "--rounded-box": "0.5rem",
  "--rounded-btn": "0.25rem",
  "--rounded-badge": "1rem",
  "--tab-radius": "0.5rem",
};

export default daisyUITheme;

export const gauge = {
  items: ["#95C4CB", "#66ABB6", "#0A506A"],
  positive: "#43C478",
  negative: "#FF5861",
};

export const surveysAndCharts = {
  positive: "#43C478",
  nearPositive: "#facc15",
  neutral: "#0ea5e9",
  nearNegative: "#facc15",
  negative: "#FF5861",
  border: "rgba(182, 184, 185, 0.3)",
  backgrounds: ["rgba(149,196,203, 0.5)", "rgba(0,0,0,0.1)"],
};

export function getBadgeColor(
  num: number | null,
  min: number | null,
  max: number | null | undefined,
  p: boolean,
) {
  if (num === null || min === null || max === null || max === undefined)
    return surveysAndCharts.neutral;
  if (p && num === max) return surveysAndCharts.positive;
  if (!p && num === max) return surveysAndCharts.negative;
  if (p && num === min) return surveysAndCharts.negative;
  if (!p && num === min) return surveysAndCharts.positive;
  if (p && num === max - 1) return surveysAndCharts.nearPositive;
  if (!p && num === max - 1) return surveysAndCharts.nearNegative;
  if (p && num === min + 1) return surveysAndCharts.nearNegative;
  if (!p && num === min + 1) return surveysAndCharts.nearPositive;
  return surveysAndCharts.neutral;
}
