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

export type ICSInvite = {
  id: string;
  summary: string;
  sequence: number;
  location: string;
  attendee: string;
  organizer: string;
  description: string;
  duration: Temporal.Duration;
  start: Temporal.ZonedDateTime;
};
export function createIcs(invite: ICSInvite) {
  const endDate = invite.start.add(invite.duration);

  const formatDate = (date: Temporal.ZonedDateTime) => {
    return (
      date.toPlainDateTime().toString().replace(/[-:]/g, "").split(".")[0] + "Z"
    );
  };

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Your Company//Your Product//EN
BEGIN:VEVENT
UID:${invite.id}
SEQUENCE:${invite.sequence}
DTSTAMP:${formatDate(Temporal.Now.zonedDateTimeISO())}
DTSTART:${formatDate(invite.start)}
DTEND:${formatDate(endDate)}
SUMMARY:${invite.summary}
DESCRIPTION:${invite.description}
LOCATION:${invite.location}
ORGANIZER;CN=${invite.organizer}
ATTENDEE;CN=${invite.attendee};RSVP=TRUE:mailto:${invite.attendee}
END:VEVENT
END:VCALENDAR`;
}
