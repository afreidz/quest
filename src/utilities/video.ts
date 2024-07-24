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
