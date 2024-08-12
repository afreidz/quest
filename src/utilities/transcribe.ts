import { now } from "./time";
import { actions } from "astro:actions";
import messages from "@/stores/messages.svelte";
import { Temporal } from "@js-temporal/polyfill";
import * as audiosdk from "microsoft-cognitiveservices-speech-sdk";

type ModeratorTranscribeInit = {
  mic?: string;
  role: "host";
  session: string;
  speaker: undefined;
  muted: () => boolean;
  recording: () => string | undefined;
};

type RespondentTranscribeInit = {
  mic?: string;
  speaker: string;
  session: string;
  role: "participant";
  muted: () => boolean;
  recording: () => string | undefined;
};

type TranscribeInit = ModeratorTranscribeInit | RespondentTranscribeInit;

export default class SessionTranscriber {
  private _mic?: string;
  private muted: () => boolean;
  public transcribing: boolean;
  private role: TranscribeInit["role"];
  private speaker: TranscribeInit["speaker"];
  private session: TranscribeInit["session"];
  private recording: () => string | undefined;
  private transcriber: audiosdk.SpeechRecognizer;
  private config: ReturnType<typeof audiosdk.SpeechConfig.fromSubscription>;

  constructor(init: TranscribeInit) {
    this.config = audiosdk.SpeechConfig.fromSubscription(
      import.meta.env.PUBLIC_SPEECH_KEY,
      import.meta.env.PUBLIC_SPEECH_REGION,
    );

    this._mic = init.mic;
    this.role = init.role;
    this.muted = init.muted;
    this.session = init.session;
    this.speaker = init.speaker;
    this.recording = init.recording;
    this.config.speechRecognitionLanguage = "en-US";

    const audio = audiosdk.AudioConfig.fromMicrophoneInput(this._mic);
    const transcriber = new audiosdk.SpeechRecognizer(this.config, audio);

    this.transcribing = false;
    this.transcriber = transcriber;
    this.transcriber.recognized = (_, e) => {
      this.handler(e);
    };
  }

  set mic(s: string | undefined) {
    this._mic = s;

    if (this.transcriber)
      this.transcriber.close(() => {
        const audio = audiosdk.AudioConfig.fromMicrophoneInput(this._mic);
        const transcriber = new audiosdk.SpeechRecognizer(this.config, audio);
        this.transcriber = transcriber;

        this.transcriber.recognized = (_, e) => this.handler(e);
        if (this.transcribing)
          this.transcriber.startContinuousRecognitionAsync();
      });
  }

  private async getRecording() {
    const id = this.recording();
    if (!id) return null;
    const resp = await actions.recording.getById(id);

    if (resp.error) {
      messages.error("Unable to find recording for utterance", resp.error);
      return null;
    }

    return resp.data;
  }

  private async handler(e: audiosdk.SpeechRecognitionEventArgs) {
    const id = this.recording();
    const recording = await this.getRecording();

    if (!id) return;
    if (!recording) return;
    if (this.muted()) return;
    if (!this.transcribing) return;
    if (!e.result.text?.trim()) return;

    const action =
      this.role === "host"
        ? actions.utterances.createModeratorUtterance
        : actions.public.createRespondentUtterance;

    const started = Temporal.Instant.from(recording.started.toString());
    const duration = (e.result.duration * 100) / 1000000; //milliseconds;

    const since = now().toInstant().since(started);
    const offset = since.subtract({ milliseconds: duration });

    const resp = await action({
      duration,
      recording: id,
      text: e.result.text,
      speaker: this.speaker,
      session: this.session,
      offset: offset.total({ unit: "milliseconds" }),
    });

    if (resp.error) {
      messages.error("Unable to save transcription", resp.error);
    }
  }

  public start(): void {
    if (!this.transcribing) this.transcriber.startContinuousRecognitionAsync();
    console.log("Transcriber started");
    this.transcribing = true;
  }

  public stop(): void {
    this.transcriber.stopContinuousRecognitionAsync();
    console.log("Transcriber stopped");
    this.transcribing = false;
  }

  public async dispose() {
    return new Promise((r, x) => this.transcriber.close(() => r(true), x)).then(
      () => console.log("Transcriber closed"),
    );
  }
}
