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

// Use "en-ca" so that the date is formatted YYYY-MM-DD
export const dateFormatter = new Intl.DateTimeFormat("en-ca", {
  day: "2-digit",
  year: "numeric",
  month: "2-digit",
});

export const timeFormatter = new Intl.DateTimeFormat("en-us", {
  hour12: false,
  hour: "2-digit",
  minute: "2-digit",
});

export const displayTimeFormatter = new Intl.DateTimeFormat("en-us", {
  hour12: true,
  hour: "numeric",
  minute: "2-digit",
  second: "2-digit",
});

export const displayFormatter = new Intl.DateTimeFormat("en-us", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "numeric",
});

export const parseDateTime = (dateStr: string, timeStr?: string): Date => {
  const [year, month, day] = dateStr.split("-").map(Number);
  if (timeStr) {
    const [hours, minutes, seconds] = timeStr.split(":").map(Number);
    return new Date(year, month - 1, day, hours, minutes, seconds);
  }
  return new Date(year, month - 1, day);
};

export const formatTime = (date: Date): string => {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};
