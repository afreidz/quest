import orm from "@hsalux/quest-db";
import { type APIRoute } from "astro";

type ValidationCodeNotification = {
  data: {
    [k: string]: any;
    validationCode: string;
  };
  [k: string]: any;
};

type RecordingStateChangeNotification = {
  id: string;
  time: string;
  type: string;
  source: string;
  subject: string;
  specversion: string;
  datacontenttype: string;
  data: {
    recordingId: string;
    state: string;
    startDateTime: string;
    recordingKind: string;
    version: string;
    callConnectionId: string;
    serverCallId: string;
    correlationId: string;
    publicEventType: string;
  };
};

type RecordingChunkInfo = {
  index: number;
  endReason: string;
  documentId: string;
  contentLocation: string;
  metadataLocation: string;
};

type RecordingFileChangeNotification = {
  id: string;
  topic: string;
  subject: string;
  eventTime: string;
  eventType: string;
  dataVersion: string;
  metadataVersion: string;
  data: {
    recordingStorageInfo: {
      recordingChunks: RecordingChunkInfo[];
    };
    recordingId: string;
    storageType: string;
    sessionEndReason: string;
    recordingStartTime: string;
    recordingDurationMs: number;
  };
};

type EventGridNotifications = (
  | RecordingFileChangeNotification
  | RecordingStateChangeNotification
  | ValidationCodeNotification
)[];

function isFileChangeNotification(
  n: EventGridNotifications[number],
): n is RecordingFileChangeNotification {
  return (
    (n as RecordingFileChangeNotification).data.recordingStorageInfo !==
    undefined
  );
}

function isValidationCodeNotification(
  n: EventGridNotifications[number],
): n is ValidationCodeNotification {
  return (n as ValidationCodeNotification).data.validationCode !== undefined;
}

function isStateChangeNotification(
  n: EventGridNotifications[number],
): n is RecordingStateChangeNotification {
  return (
    (n as RecordingStateChangeNotification).type ===
    "Microsoft.Communication.RecordingStateChanged"
  );
}

export const POST: APIRoute = async ({ request }) => {
  const body: EventGridNotifications = await request.json();
  console.log("Incoming POST from session events");
  console.log(JSON.stringify(body, null, 2));

  if (isValidationCodeNotification(body[0])) {
    const resp = { validationResponse: body[0].data.validationCode };
    return new Response(JSON.stringify(resp));
  }

  if (isFileChangeNotification(body[0])) {
    const id = body[0].data.recordingId;
    const videoURL =
      body[0].data.recordingStorageInfo.recordingChunks[0].contentLocation;

    if (videoURL && id) {
      await orm.sessionRecording.update({
        where: { id },
        data: { videoURL },
      });
    }

    return new Response(null, {
      status: 200,
    });
  }

  if (isStateChangeNotification(body[0])) {
    const id = body[0].data.recordingId;
    const started = body[0].data.startDateTime;
    const storageLocationId = body[0].data.correlationId;

    if (started && id) {
      const session = await orm.session.findFirst({
        where: { recordings: { some: { id } } },
      });

      await orm.sessionRecording.update({
        where: { id },
        data: { started },
      });

      if (session && !session.started) {
        await orm.session.update({
          where: { id: session.id },
          data: { started, storageLocationId },
        });
      }
    }

    return new Response(null, {
      status: 200,
    });
  }

  return new Response(null, {
    status: 200,
  });
};
