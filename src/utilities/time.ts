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

export function formatUTCDateToISO(date: Date): string {
  const year = date.getUTCFullYear();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = date.getUTCDate().toString().padStart(2, "0");
  const hours = date.getUTCHours().toString().padStart(2, "0");
  const minutes = date.getUTCMinutes().toString().padStart(2, "0");
  const seconds = date.getUTCSeconds().toString().padStart(2, "0");

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}
