import {
  BlobServiceClient,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";

import * as os from "os";
import * as path from "path";
import ffmpeg from "fluent-ffmpeg";
import { writeFile, readFile, unlink, access, mkdir } from "fs/promises";
import { app, HttpRequest, type HttpResponseInit } from "@azure/functions";

const container = "participant-videos";
const key = process.env.AZURE_STORAGE_ACCOUNT_KEY!;
const account = process.env.AZURE_STORAGE_ACCOUNT!;

type ClipBody = {
  url: string;
  start: string;
  duration: string;
};

export async function clip(request: HttpRequest): Promise<HttpResponseInit> {
  const { url, start, duration } = (await request.json()) as ClipBody;

  const credential = new StorageSharedKeyCredential(account, key);
  const client = new BlobServiceClient(
    `https://${account}.blob.core.windows.net`,
    credential,
  );

  const recordingName = url.split(`${container}/`)[1];
  const recordingContainerClient = client.getContainerClient(container);
  const recordingDownload = await recordingContainerClient
    .getBlobClient(recordingName)
    .download();

  if (!recordingDownload.readableStreamBody) {
    return {
      status: 400,
      jsonBody: { message: "Unable to download recording" },
    };
  }

  const recordingBuffer = await streamToBuffer(
    recordingDownload.readableStreamBody!,
  );

  const now = new Date();
  const directory = `${now.getUTCFullYear()}-${now.getUTCMonth().toString().padStart(2, "0")}-${now.getUTCDate().toString().padStart(2, "0")}`;
  const suffix = `${now.getUTCHours().toString().padStart(2, "0")}-${now.getUTCMinutes().toString().padStart(2, "0")}-${now.getUTCSeconds().toString().padStart(2, "0")}-${now.getUTCMilliseconds().toString().padStart(4, "0")}`;

  const tmpDir = path.join(os.tmpdir(), "_quest");
  const tempClipFile = path.join(tmpDir, `clip-${suffix}.mp4`);
  const tempRecordingFile = path.join(tmpDir, `recording-${suffix}.mp4`);

  const exists = await access(tmpDir)
    .then(() => true)
    .catch(() => false);

  if (!exists) {
    await mkdir(tmpDir, { recursive: true });
  }

  await writeFile(tempRecordingFile, recordingBuffer);

  const result = await new Promise((r, x) => {
    ffmpeg(tempRecordingFile)
      .setDuration(+duration)
      .setStartTime(+start)
      .output(tempClipFile)
      .on("error", x)
      .on("end", r)
      .run();
  })
    .catch((err) => {
      console.error(err);
      return null;
    })
    .then(() => true);

  if (!result) {
    return { status: 400, jsonBody: { message: "Unable to create clip" } };
  }

  const clipContainerClient = client.getContainerClient(`clips`);
  await clipContainerClient.createIfNotExists();

  const clipClient = clipContainerClient.getBlockBlobClient(
    `${directory}/clip-${suffix}.mp4`,
  );

  const clipBuffer = await readFile(tempClipFile);
  await clipClient.uploadData(clipBuffer);

  await unlink(tempRecordingFile);
  await unlink(tempClipFile);

  return {
    status: 200,
    jsonBody: { message: "Clip Created", url: clipClient.url },
  };
}

async function streamToBuffer(
  readableStream: NodeJS.ReadableStream,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    readableStream.on("data", (data) => {
      chunks.push(data instanceof Buffer ? data : Buffer.from(data));
    });
    readableStream.on("end", () => {
      resolve(Buffer.concat(chunks));
    });
    readableStream.on("error", reject);
  });
}

app.http("clip", {
  methods: ["GET", "POST"],
  authLevel: "anonymous",
  handler: clip,
});
