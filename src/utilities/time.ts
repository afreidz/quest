import { Temporal } from "@js-temporal/polyfill";

export const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

export function isBefore(x: Temporal.ZonedDateTime, y: Temporal.ZonedDateTime) {
  const duration = x.since(y);
  return duration.sign === -1;
}

export function now() {
  return Temporal.Now.zonedDateTimeISO(timezone);
}

export function getInstant(s: string) {
  return Temporal.Instant.from(s).toZonedDateTimeISO(timezone);
}
