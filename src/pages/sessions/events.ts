import orm from "@hsalux/quest-db";
import { type APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  // console.log("Incoming POST from session events");
  // console.log(JSON.stringify(body, null, 2));

  if (body[0].data.validationCode) {
    const resp = { validationResponse: body[0].data.validationCode };
    return new Response(JSON.stringify(resp));
  }

  if (body[0].data.recordingStorageInfo && body[0].data.recordingId) {
    const id: string = body[0].data.recordingId;
    const videoURL: string =
      body[0].data.recordingStorageInfo.recordingChunks[0].contentLocation;

    const recording = await orm.sessionRecording.findFirst({
      where: { id },
    });

    if (videoURL && id && recording) {
      const session = await orm.sessionRecording.update({
        where: { id },
        data: { videoURL },
      });
      console.log(`Added session recording to: ${session.id}.`);
      // console.log(`Video URL: ${videoURL}.`);
    }
  }

  return new Response(null, {
    status: 200,
  });
};
