import { Buffer } from "buffer";
import { Temporal } from "@js-temporal/polyfill";
import type { CalendarEvent } from "calendar-link";
import { formatUTCDateToISO } from "@/utilities/time";
import type { EmailMessage } from "@azure/communication-email";
import type { SessionById, SessionFromAll } from "@/actions/sessions";

export function preventDefault(fn: (e: Event) => unknown) {
  return (event: Event) => {
    event.preventDefault();
    fn(event);
  };
}

type EventHandler = (...args: any[]) => void;

export class EventEmitter {
  private events: Map<string, EventHandler[]>;

  constructor() {
    this.events = new Map();
  }

  on(event: string, handler: EventHandler): void {
    const handlers = this.events.get(event) || [];
    handlers.push(handler);
    this.events.set(event, handlers);
  }

  off(event: string, handler: EventHandler): void {
    const handlers = this.events.get(event);
    if (handlers) {
      const newHandlers = handlers.filter((h) => h !== handler);
      this.events.set(event, newHandlers);
    }
  }

  once(event: string, handler: EventHandler): void {
    const onceWrapper: EventHandler = (...args) => {
      handler(...args);
      this.off(event, onceWrapper);
    };

    this.on(event, onceWrapper);
  }

  emit(event: string, ...args: any[]): void {
    const handlers = this.events.get(event);
    if (handlers) {
      handlers.slice().forEach((handler) => handler(...args));
    }
  }
}

function generateLink(id: string) {
  let origin;

  if (typeof window !== "undefined" && window.location) {
    origin = window.location.origin;
  } else if (import.meta.env.ORIGIN) {
    origin = import.meta.env.ORIGIN;
  } else {
    origin = "https://quest.hsalux.app";
  }

  return new URL(`/sessions/participate/${id}`, origin);
}

function generateTitle(session: SessionById | SessionFromAll, email = false) {
  if (email)
    return `You have been invited to a moderated user test powered by QUEST`;
  return `${session.respondent.name || session.respondent.email} User test for "${session.revision.system.title}" by QUEST`;
}

function generateDescription(
  session: SessionById | SessionFromAll,
  link: string,
  html = false,
) {
  const displayFormatter = new Intl.DateTimeFormat("en-us", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
  });

  return `${html ? "<h1>" : ""} Hello${session.respondent.name?.padStart(session.respondent.name.length + 1, " ") ?? ""}! ${html ? "</h1>" : ""}${!html ? "\\n" : ""}${html ? "<p>" : ""}${session.revision.system.client.name} would like help determining the usability of the system ${html ? "<strong>" : ""}${session.revision.system.title}${html ? "</strong>" : ""}.${!html ? "\\n" : ""} QUEST is a tool that helps conduct moderated user testing sessions that can be used to quantify the usability of a system.${!html ? "\\n" : ""}You will be joined by a moderator on a recorded video call. Your session is scheduled for ${displayFormatter.format(new Date(session.scheduled))}. ${!html ? "\\n" : ""}You will be shown a system on your screen and asked to perform a series of tasks and give your open and honest feedback on what you${!html ? "\\n" : ""}are experiencing.${html ? "</p>" : ""}${!html ? "\\n" : ""}${html ? "<p>" : ""}The session screen (and camera if you choose to enable it) will be recorded and analyzed to help ${session.revision.system.client.name}${!html ? "\\n" : ""}understand how to make ${html ? "<strong>" : ""}${session.revision.system.title}${html ? "</strong>" : ""} better!${html ? "</p>" : ""}${!html ? "\\n" : ""}${html ? "<p>" : ""}Your participation is greatly appreciated! Should you have any questions or concerns, feel free to email the${!html ? "\\n" : ""}scheduled moderator at ${html ? '<a href="mailto:${sessionData.moderator}">' : ""}${session.moderator}${html ? "</a>.</p>" : "."}${!html ? "\\n" : ""}${html ? "<p>" : ""}Here is your ${html ? '<a href="' + link + '">private access link</a>' : "private access link: " + link} ${html ? "</a></p>" : ""}${!html ? "\\n" : ""}`;
}

export function sessionToICSInvite(
  session: SessionById | SessionFromAll,
  base64 = false,
  sequence = 1,
  cancel = false,
) {
  const start = new Date(session.scheduled);
  const participantLink = generateLink(session.id);
  const endDate = new Date(
    Temporal.Instant.from(start.toISOString()).add(
      Temporal.Duration.from({ hours: 1 }),
    ).epochMilliseconds,
  );

  const text = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Hitachi Solutions//QUEST//EN
BEGIN:VEVENT
UID:${session.id}
SEQUENCE:${sequence}
METHOD:${cancel ? "CANCEL" : "REQUEST"}
DTSTAMP:${formatUTCDateToISO(new Date())}
DTSTART:${formatUTCDateToISO(start)}
DTEND:${formatUTCDateToISO(endDate)}
SUMMARY:${generateTitle(session)}
URL:${participantLink.href}
DESCRIPTION:${generateDescription(session, participantLink.href)}
ORGANIZER;CN=${session.moderator};RSVP=TRUE:mailto:${session.moderator}
ATTENDEE;CN=${session.respondent.email};RSVP=TRUE:mailto:${session.respondent.email}
STATUS:${cancel ? "CANCELLED" : "TENTATIVE"}
END:VEVENT
END:VCALENDAR`;

  if (!base64) return text;

  const buffer = Buffer.from(text, "utf-8");
  return buffer.toString("base64");
}

export function sessionToTeamsEvent(
  session: SessionFromAll | SessionById,
): CalendarEvent {
  const participantLink = generateLink(session.id);
  const start = session.scheduled;

  return {
    start,
    duration: [1, "hour"],
    title: generateTitle(session),
    location: participantLink.href,
    guests: [session.respondent.email],
    organizer: { name: "Moderator", email: session.moderator },
    description: generateDescription(session, participantLink.href),
  };
}

export function sessionToEmail(
  session: SessionFromAll | SessionById,
  type: "new" | "update" | "cancel" = "new",
): EmailMessage {
  const invite = sessionToICSInvite(
    session,
    true,
    session.version,
    type === "cancel",
  );

  const participantLink = generateLink(session.id);

  return {
    senderAddress: "donotreply@quest.hsalux.app",
    content: {
      subject:
        (type === "update"
          ? `UPDATE: `
          : type === "cancel"
            ? "CANCELLED: "
            : "") + generateTitle(session, true),
      html:
        type === "cancel"
          ? "<p>This session has been cancelled.</p><br/>"
          : generateDescription(session, participantLink.href, true),
      plainText:
        type === "cancel"
          ? "This session has been cancelled.\\n"
          : generateDescription(session, participantLink.href, false),
    },
    recipients: {
      to: [
        {
          address: session.respondent.email,
          displayName: session.respondent.name || session.respondent.email,
        },
      ],
    },
    attachments: [
      {
        contentInBase64: invite,
        contentType: "text/calendar",
        name: "quest-session-invite.ics",
      },
    ],
  };
}

type DebouncedFunction<Args extends any[]> = (...args: Args) => void;

export function debounce<Args extends any[]>(
  func: (...args: Args) => void,
  wait: number,
): DebouncedFunction<Args> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  return function (...args: Args) {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
    }, wait);
  };
}
