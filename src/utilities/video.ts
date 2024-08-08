import { Temporal } from "@js-temporal/polyfill";
import { getInstant } from "./time";

export async function combineCameraStreams(
  participant: MediaStream | MediaProvider,
  host: MediaStream | MediaProvider,
  targetHeight: number,
): Promise<MediaStream> {
  // Create video elements to play the streams
  const participantVideo = document.createElement("video");
  const hostVideo = document.createElement("video");
  participantVideo.srcObject = participant;
  hostVideo.srcObject = host;

  // Play both video elements
  await Promise.all([participantVideo.play(), hostVideo.play()]);

  // Calculate new widths based on the target height while preserving aspect ratios
  const participantAspectRatio =
    participantVideo.videoWidth / participantVideo.videoHeight;
  const hostAspectRatio = hostVideo.videoWidth / hostVideo.videoHeight;

  const participantWidth = targetHeight * participantAspectRatio;
  const hostWidth = targetHeight * hostAspectRatio;

  // Set the canvas size
  const canvas = document.createElement("canvas");
  canvas.width = participantWidth + hostWidth;
  canvas.height = targetHeight;
  const context = canvas.getContext("2d");

  // Function to draw video frames on the canvas
  function drawFrames() {
    if (
      !participantVideo.paused &&
      !participantVideo.ended &&
      !hostVideo.paused &&
      !hostVideo.ended
    ) {
      // Clear the canvas
      context?.clearRect(0, 0, canvas.width, canvas.height);

      // Draw the videos on canvas with new dimensions
      context?.drawImage(
        participantVideo,
        0,
        0,
        participantWidth,
        targetHeight,
      );
      context?.drawImage(
        hostVideo,
        participantWidth,
        0,
        hostWidth,
        targetHeight,
      );

      // Continue drawing frames
      requestAnimationFrame(drawFrames);
    }
  }

  drawFrames();

  // Return the canvas's stream
  return canvas.captureStream();
}

export function getVideoDuration(url: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.src = url;
    video.preload = "metadata";

    video.addEventListener("loadedmetadata", () => {
      if (video.duration === Infinity) {
        video.currentTime = Number.MAX_SAFE_INTEGER;
        video.ontimeupdate = () => {
          video.ontimeupdate = null;
          resolve(video.duration);
          video.currentTime = 0;
        };
      } else {
        resolve(video.duration);
      }
    });

    video.addEventListener("error", () => {
      reject(new Error(`Failed to load video: ${url}`));
    });
  });
}

interface RecordingObject {
  [key: string]: any;
  videoURL: string | null;
}

interface RecordingSchedule {
  start: Temporal.ZonedDateTime;
  end: Temporal.ZonedDateTime;
}

export async function getRecordingSchedule<T extends RecordingObject>(
  start: Date,
  videos: T[],
  token: string | null = "",
) {
  const startTime = getInstant(start.toString());
  let currentTime = startTime;

  const result: { recording: T; schedule: RecordingSchedule }[] = [];

  for (const video of videos) {
    const durationSeconds = await getVideoDuration(
      `${video.videoURL}?${token}`,
    );

    const endTime = currentTime.add(
      Temporal.Duration.from({ seconds: Math.round(durationSeconds) }),
    );

    result.push({
      recording: video,
      schedule: {
        end: endTime,
        start: currentTime,
      },
    });

    currentTime = endTime;
  }

  return result;
}
