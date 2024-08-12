import { getInstant } from "@/utilities/time";
import { Temporal } from "@js-temporal/polyfill";
import type { Recordings } from "@/actions/recordings";

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

    video.addEventListener("loadedmetadata", (e) => {
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

interface RecordingSchedule {
  start: Temporal.ZonedDateTime;
  end: Temporal.ZonedDateTime;
}

export async function getRecordingSchedule(
  recordings: Recordings,
  token: string | null = "",
): Promise<
  {
    recording: Recordings[number];
    schedule: {
      start: Temporal.ZonedDateTime;
      end: Temporal.ZonedDateTime;
    };
  }[]
> {
  const result: {
    recording: Recordings[number];
    schedule: RecordingSchedule;
  }[] = [];

  for (const recording of recordings) {
    const startTime = getInstant(recording.started.toString());

    const durationSeconds = await getVideoDuration(
      `${recording.videoURL}?${token}`,
    );

    const endTime = startTime.add(
      Temporal.Duration.from({
        milliseconds: Math.ceil(durationSeconds * 1000),
      }),
    );

    result.push({
      recording: recording,
      schedule: {
        end: endTime,
        start: startTime,
      },
    });
  }

  return result;
}

export async function preloadVideos(
  recordings: Recordings,
  token: string = "",
) {
  const record: Record<string, string> = {};
  const videoPromises = recordings
    .filter((r) => !!r.videoURL)
    .map(async (recording) => {
      const response = await fetch(`${recording.videoURL!}?${token}`);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      return { id: recording.id, url: blobUrl };
    });

  const preloaded = await Promise.all(videoPromises);
  preloaded.forEach((vid) => {
    record[vid.id] = vid.url;
  });
  return record;
}
