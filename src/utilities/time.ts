import type { Temporal } from "@js-temporal/polyfill";

export const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

export function isBefore(x: Temporal.ZonedDateTime, y: Temporal.ZonedDateTime) {
  const duration = x.since(y);
  return duration.sign === -1;
}
