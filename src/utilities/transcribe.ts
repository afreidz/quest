import { now } from "./time";
import { actions } from "astro:actions";
import messages from "@/stores/messages.svelte";
import * as audiosdk from "microsoft-cognitiveservices-speech-sdk";

type ModeratorTranscribeInit = {
  mic?: string;
  role: "host";
  session: string;
  speaker: undefined;
};

type RespondentTranscribeInit = {
  mic?: string;
  speaker: string;
  session: string;
  role: "participant";
};

type TranscribeInit = ModeratorTranscribeInit | RespondentTranscribeInit;

export default class SessionTranscriber {
  private _mic?: string;
  public transcribing: boolean;
  private role: TranscribeInit["role"];
  private speaker: TranscribeInit["speaker"];
  private session: TranscribeInit["session"];
  private transcriber: audiosdk.SpeechRecognizer;
  private config: ReturnType<typeof audiosdk.SpeechConfig.fromSubscription>;

  constructor(init: TranscribeInit) {
    this.config = audiosdk.SpeechConfig.fromSubscription(
      import.meta.env.PUBLIC_SPEECH_KEY,
      import.meta.env.PUBLIC_SPEECH_REGION,
    );

    this._mic = init.mic;
    this.role = init.role;
    this.session = init.session;
    this.speaker = init.speaker;
    this.config.speechRecognitionLanguage = "en-US";

    const audio = audiosdk.AudioConfig.fromMicrophoneInput(this._mic);
    const transcriber = new audiosdk.SpeechRecognizer(this.config, audio);

    this.transcribing = false;
    this.transcriber = transcriber;
    this.transcriber.recognized = (_, e) => this.handler(e);
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

  private async handler(e: audiosdk.SpeechRecognitionEventArgs) {
    if (!this.transcribing) return;
    if (!e.result.text?.trim()) return;

    const action =
      this.role === "host"
        ? actions.utterances.createModeratorUtterance
        : actions.public.createRespondentUtterance;

    await action({
      text: e.result.text,
      speaker: this.speaker,
      session: this.session,
      time: now().toString(),
    }).catch((err) => {
      messages.error("Unable to save transcription", err.message);
    });
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
