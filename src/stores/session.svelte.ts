import {
  Features,
  CallClient,
  LocalVideoStream,
  VideoStreamRenderer,
  type Call,
  type CallAgent,
  type CallState,
  type AudioDeviceInfo,
  type VideoDeviceInfo,
  type CreateViewOptions,
  type RemoteVideoStream,
  type RemoteParticipant,
  type VideoStreamRendererView,
} from "@azure/communication-calling";

import {
  type CommunicationUserKind,
  AzureCommunicationTokenCredential,
} from "@azure/communication-common";

import { actions } from "astro:actions";
import messages from "@/stores/messages.svelte";
import Transcriber from "@/utilities/transcribe";
import { combineCameraStreams } from "@/utilities/video";
import DataMessenger, { type DataMessage } from "@/utilities/data";

export type SessionRole = "host" | "participant" | "unknown";

export type DevicePermission = {
  audio: boolean;
  video: boolean;
};

export const TIMEOUT = 30000;

export type Participant = {
  id: string;
  name?: string;
  muted: boolean;
  speaking?: boolean;
  camera?: RemoteVideoStream;
};

class QuestSessionStore {
  // Privates with no getters/setters
  private _call?: Call = $state();
  private _agent?: CallAgent = $state();
  private _recordingId?: string = $state();
  private _transcriber?: Transcriber = $state();
  private _messenger?: DataMessenger = $state();
  private _recordingSince?: Date | null = $state(null);
  private _client?: CallClient = $state(new CallClient());
  private _cred?: AzureCommunicationTokenCredential = $state();

  // Privates with public getters/setters
  private _muted = $state(false);
  private _id?: string = $state();
  private _connected = $state(false);
  private _recording = $state(false);
  private _camEnabled = $state(false);
  private _userId?: string = $state();
  private _shareEnabled = $state(false);
  private _respondentId?: string = $state();
  private _displayName: string = $state("");
  private _status: CallState = $state("None");
  private _pipStream?: MediaStream = $state();
  private _camera?: VideoDeviceInfo = $state();
  private _screen?: RemoteVideoStream = $state();
  private _role: SessionRole = $state("unknown");
  private _speakers?: AudioDeviceInfo = $state();
  private _microphone?: AudioDeviceInfo = $state();
  private _participants: Participant[] = $state([]);
  private _screenView?: VideoStreamRendererView = $state();
  private _deviceManager = $derived(this._client?.getDeviceManager());

  private _permissions: DevicePermission = $state({
    audio: false,
    video: false,
  });

  get id() {
    return this._id;
  }

  set id(s: string | undefined) {
    this._id = s;
  }

  get role() {
    return this._role;
  }

  set role(r: SessionRole) {
    this._role = r;
  }

  get name() {
    return this._displayName;
  }

  set name(s: string) {
    this._displayName = s;
  }

  get status() {
    return this._status;
  }

  private set status(s: CallState) {
    this._status = s;
  }

  get deviceManager() {
    return this._deviceManager;
  }

  get permissions() {
    return this._permissions;
  }

  set userId(s: string | undefined) {
    this._userId = s;
  }

  get userId() {
    return this._userId;
  }

  get muted() {
    return this._muted;
  }

  private set muted(b: boolean) {
    this._muted = b;
  }

  get camEnabled() {
    return this._camEnabled;
  }

  private set camEnabled(b: boolean) {
    this._camEnabled = b;
  }

  get screenEnabled() {
    return this._shareEnabled;
  }

  private set screenEnabled(b: boolean) {
    this._shareEnabled = b;
  }

  get screen() {
    return this._screen;
  }

  set screen(v: RemoteVideoStream | undefined) {
    this._screen = v;
    if (this.screenEnabled && !this._call?.isScreenSharingOn)
      this.enableScreenShare();
  }

  get camera() {
    return this._camera;
  }

  set camera(v: VideoDeviceInfo | undefined) {
    this._camera = v;
    console.log("Setting camera to", v?.id);
    localStorage.setItem("camera", v?.id ?? "");

    if (this.camEnabled) this.enableCamera();
  }

  get microphone() {
    return this._microphone;
  }

  set microphone(m: AudioDeviceInfo | undefined) {
    this._microphone = m;
    console.log("Setting microphone to", m?.id);
    localStorage.setItem("microphone", m?.id ?? "");

    // if (this._transcriber) this._transcriber.mic = m?.id;

    if (!this.deviceManager) return;
    if (!m) {
      this.mute();
    } else {
      this.deviceManager.then((dm) => dm.selectMicrophone(m));
      if (this.muted) this.mute();
    }
  }

  get speakers() {
    return this._speakers;
  }

  set speakers(s: AudioDeviceInfo | undefined) {
    this._speakers = s;
    console.log("Setting speakers to", s?.id);
    localStorage.setItem("speakers", s?.id ?? "");

    if (!this.deviceManager) return;
    if (!s) {
      this._call?.muteIncomingAudio();
    } else {
      this.deviceManager.then((dm) => dm.selectSpeaker(s));
    }
  }

  get pip() {
    return this._pipStream;
  }

  get participants() {
    return this._participants;
  }

  set participants(p: Participant[]) {
    this._participants = p;
  }

  set screenView(v: VideoStreamRendererView | undefined) {
    this._screenView = v;
  }

  get respondentId() {
    return this._respondentId;
  }

  set respondentId(r: string | undefined) {
    this._respondentId = r;
  }

  get recording() {
    return this._recording;
  }

  get connected() {
    return this._connected;
  }

  get messenger() {
    return this._messenger;
  }

  async mute() {
    if (!this._call) return (this.muted = true);
    await this._call.mute();
    this.muted = true;
  }

  async unmute() {
    if (!this._call) return (this.muted = false);
    await this._call.unmute();
    this.muted = false;
  }

  async enableCamera() {
    if (!this._call) return (this.camEnabled = true);
    if (!this.camera) return (this.camEnabled = false);

    const existing = this._call.localVideoStreams.find(
      (s) => s.mediaStreamType === "Video",
    );

    if (existing && this.camera.id !== existing.source.id) {
      existing.switchSource(this.camera);
    } else if (!existing) {
      const stream = new LocalVideoStream(this.camera);
      await this._call.startVideo(stream);
    }

    this.camEnabled = true;
    await this.updatePipStream();
  }

  async disableCamera() {
    if (!this._call) return (this.camEnabled = false);

    const stream = this._call.localVideoStreams.find(
      (s) => s.mediaStreamType === "Video",
    );
    if (stream) await this._call.stopVideo(stream);

    this.camEnabled = false;
    await this.updatePipStream();
  }

  async enableScreenShare() {
    if (!this._call) return (this.screenEnabled = true);

    const screen = await this.getScreenSharePermission();
    if (!screen) return (this.screenEnabled = false);

    if (this._call.isScreenSharingOn) await this._call.stopScreenSharing();
    const stream = new LocalVideoStream(screen);
    await (this._call.startScreenSharing as any)(stream);

    this.screenEnabled = true;
  }

  private async getScreenSharePermission() {
    const video: MediaStreamConstraints["video"] = {
      frameRate: 30,
      aspectRatio: 16 / 9,
      width: { ideal: 1280 },
    };
    const media = await navigator.mediaDevices.getDisplayMedia({
      video,
      audio: false,
      preferCurrentTab: true,
    } as DisplayMediaStreamOptions & { preferCurrentTab: boolean });

    return media;
  }

  async getPermission() {
    if (this.permissions.audio && this.permissions.video)
      return this.permissions;

    const dm = await this.deviceManager;
    if (!dm) return this.permissions;

    const answer = await dm.askDevicePermission({ audio: true, video: true });
    this._permissions = answer;
    return this.permissions;
  }

  async connect() {
    this._connected = false;
    if (!this.id) throw new Error(`Unable to connect without call id`);

    if (this.role === "unknown")
      throw new Error("Unable to connect without a role");

    if (!this.respondentId && this.role === "participant")
      throw new Error("Unable to connect without respondent");

    if (this._transcriber) {
      await this._transcriber.stop();
      this._transcriber = undefined;
    }

    if (this._cred) {
      this._cred.dispose();
      this._cred = undefined;
    }

    if (this._agent) {
      await this._agent.dispose();
      this._agent = undefined;
    }

    if (this._call && this.status === "Connected") {
      await this._call.hangUp();
      this._call.dispose();
      this._call = undefined;
    }

    console.log(`Connecting to call id: ${this.id} as user: ${this.userId}`);

    const client = new CallClient();
    const token = (await actions.public.getComsToken(this.userId)).data?.token;
    if (!token) return messages.error("Unable to authenticate.");

    const credential = new AzureCommunicationTokenCredential(token);

    const agent = await client
      .createCallAgent(credential, {
        displayName: this.name,
      })
      .catch((err) => {
        messages.error("Unable to create call agent", err.message);
        return undefined;
      });

    if (!agent) return;

    const call = agent.join({ groupId: this.id });

    this._call = call;
    this._agent = agent;
    this._client = client;
    this._cred = credential;

    this._transcriber = new Transcriber(
      this.role === "host"
        ? {
            role: "host",
            session: this.id,
            speaker: undefined,
            muted: () => this.muted,
            recording: () => this._recordingId,
          }
        : {
            session: this.id,
            role: "participant",
            muted: () => this.muted,
            speaker: this.respondentId!,
            recording: () => this._recordingId,
          },
    );

    this._messenger = new DataMessenger(call);

    await this.callReady().catch((err) => {
      messages.error(err);
    });

    if (this.role === "host") await this.record();

    if (this.camEnabled && this.camera) {
      await this.enableCamera();
    }

    if (this.role === "participant") {
      await this.enableScreenShare();
    }

    call.remoteParticipants.forEach((p) => this.addParticipant(p));

    console.log("Listening for participant updates");
    call.on("remoteParticipantsUpdated", ({ added, removed }) => {
      removed.forEach((r) => this.removeParticipant(r));
      added.forEach((r) => this.addParticipant(r));
    });

    const recorder = call.feature(Features.Recording);
    recorder.on("isRecordingActiveChanged", () => {
      this._recording = recorder.isRecordingActive;
    });

    this._connected = true;
  }

  async disconnect() {
    if (this.role === "host" && this.id) {
      if (this._recordingId) await this.stopRecording();
      this.messenger?.send({ type: "recording-stop" });
      this.messenger?.send({ type: "session-stop" });
    }

    await this._call?.hangUp();
    await this._call?.dispose();
    await this._agent?.dispose();
    await this._transcriber?.stop();
    this._call = undefined;
    this._agent = undefined;
    this._participants = [];
    this._client = undefined;
    console.log("Call disconnected");
    this._connected = false;
  }

  async bootParticipant(id: string) {
    if (!this._call) return;
    await this._call.removeParticipant({ communicationUserId: id });
    await this.updatePipStream();
  }

  private async addParticipant(remote: RemoteParticipant) {
    console.log(
      `Participant ${remote.displayName || remote.identifier} has joined the call`,
    );
    const camera = remote.videoStreams.find(
      (s) => s.mediaStreamType === "Video",
    );
    const screen = remote.videoStreams.find(
      (s) => s.mediaStreamType === "ScreenSharing",
    );

    this.messenger?.on("message", (e: DataMessage) => {
      if (e.type === "ping" && this._recordingSince) {
        this.messenger?.send({
          type: "recording-start",
          time: this._recordingSince.toISOString(),
        });
      }
    });

    this.messenger?.send({ type: "ping" });

    screen?.on("isAvailableChanged", async () => {
      console.log("Screen Availability Change", screen.isAvailable);
      if (screen.isAvailable) this.screen = screen;
      if (!screen.isAvailable) this.screen = undefined;
      if (!screen.isAvailable && this._screenView) {
        await this._screenView.dispose();
        this.screenView = undefined;
      }
    });

    camera?.on("isAvailableChanged", async () => {
      console.log("Camera Availability Change", camera.isAvailable);
      if (camera.isAvailable) participant.camera = camera;
      if (!camera.isAvailable) participant.camera = undefined;
      await this.updatePipStream();
    });

    remote.on("isMutedChanged", () => {
      console.log("Participant Muted Update", remote.isMuted);
      participant.muted = remote.isMuted;
    });

    remote.on("isSpeakingChanged", () => {
      participant.speaking = remote.isSpeaking;
    });

    remote.on("videoStreamsUpdated", async ({ added, removed }) => {
      const removedCamera = removed.find((r) => r.mediaStreamType === "Video");
      const removedScreen = removed.find(
        (r) => r.mediaStreamType === "ScreenSharing",
      );

      const addedCamera = added.find((r) => r.mediaStreamType === "Video");
      const addedScreen = added.find(
        (r) => r.mediaStreamType === "ScreenSharing",
      );

      if (removedCamera) participant.camera = undefined;
      if (removedScreen) this.screen = undefined;
      if (removedScreen && this._screenView) {
        await this._screenView.dispose();
        this.screenView = undefined;
      }

      if (addedCamera?.isAvailable) participant.camera = addedCamera;
      if (addedScreen?.isAvailable) this.screen = addedScreen;

      await this.updatePipStream();

      addedCamera?.on("isAvailableChanged", async () => {
        console.log(
          "Added Camera Availability Change",
          addedCamera.isAvailable,
        );
        if (!addedCamera.isAvailable) participant.camera = undefined;
        if (addedCamera.isAvailable) participant.camera = addedCamera;
        await this.updatePipStream();
      });

      addedScreen?.on("isAvailableChanged", async () => {
        console.log(
          "Added Screen Availability Change",
          addedScreen.isAvailable,
        );
        if (!addedScreen.isAvailable) this.screen = undefined;
        if (addedScreen.isAvailable) this.screen = addedScreen;
        if (!addedScreen.isAvailable && this._screenView) {
          await this._screenView.dispose();
          this.screenView = undefined;
        }
      });
    });

    const participant: Participant = $state({
      muted: remote.isMuted,
      name: remote.displayName,
      camera: camera && camera.isAvailable ? camera : undefined,
      id: (remote.identifier as CommunicationUserKind).communicationUserId,
    });

    if (camera?.isAvailable) {
      await this.updatePipStream();
    }

    if (screen?.isAvailable) {
      this.screen = screen;
    }

    const newParticipants = this.participants.filter(
      (p) => p.id !== participant.id,
    );
    this.participants = [...newParticipants, participant];
  }

  private removeParticipant(remote: RemoteParticipant) {
    const id = (remote.identifier as CommunicationUserKind).communicationUserId;
    const newParticipants = this.participants.filter((p) => p.id !== id);
    this.participants = newParticipants;
  }

  private async callReady() {
    if (!this._call) return Promise.reject("No call available");

    const timeout = Promise.withResolvers();
    const callReady = Promise.withResolvers();

    if (this.status === "Connected") callReady.resolve(true);
    const timer = setTimeout(() => timeout.reject("Call timed out"), TIMEOUT);

    this._call.on("stateChanged", () => {
      this.status = this._call?.state ?? "None";
      if (this.status === "Connected") callReady.resolve(true);
      if (this.status === "Disconnected")
        callReady.reject(
          `Call was disconnected. Reason: ${this._call?.callEndReason?.code}, Subcode: ${this._call?.callEndReason?.subCode}`,
        );
    });

    await Promise.race([timeout.promise, callReady.promise]).finally(() =>
      clearTimeout(timer),
    );
  }

  async renderVideoStream<T extends HTMLElement>(
    target: T,
    camera: LocalVideoStream | RemoteVideoStream,
    options: CreateViewOptions = { scalingMode: "Crop" },
  ) {
    const renderer = new VideoStreamRenderer(camera);
    const view = await renderer.createView(options);
    target.replaceChildren(view?.target ?? "");

    return view;
  }

  private async updatePipStream() {
    if (this.role === "host") return (this._pipStream = undefined);

    const local = this.camera ? new LocalVideoStream(this.camera) : undefined;
    const stream = await local?.getMediaStream();

    const participant = await this.participants
      .find(async (p) => {
        const stream = await p.camera?.getMediaStream();
        return stream?.active;
      })
      ?.camera?.getMediaStream();

    if (stream?.active && !participant) return (this._pipStream = stream);
    if (!stream?.active && participant) return (this._pipStream = participant);
    if (stream?.active && participant)
      return (this._pipStream = await combineCameraStreams(
        stream,
        participant,
        500,
      ));

    return (this._pipStream = undefined);
  }

  public async record() {
    if (!this._call) throw new Error(`Unable to start recording without call`);

    if (this.status !== "Connected")
      throw new Error(
        "Unable to start recording without being connected to call",
      );

    if (!this.id)
      throw new Error(
        `Unable to start recording with session id: "${this.id}"`,
      );

    if (!this._transcriber)
      throw new Error(`Unable to start recording without transcriber`);

    this._transcriber.start();
    const recorder = this._call.feature(Features.Recording);

    recorder.on("isRecordingActiveChanged", () =>
      console.log(`Recording is ${recorder.isRecordingActive}`),
    );

    console.log("Starting the recording");
    const callId = await this._call.info.getServerCallId();
    const resp = await actions.sessions.startRecording({
      callId,
      sessionId: this.id,
    });

    if (resp.error) {
      messages.error("Unable to start recroding", resp.error);
    }

    this._recordingId = resp.data;
    this._recordingSince = new Date();

    this.messenger?.send({
      type: "recording-start",
      time: this._recordingSince.toISOString(),
    });
  }

  public async stopRecording() {
    console.log("Stopping the recording");
    if (!this._recordingId)
      throw new Error(
        `Unable to stop recording with id: "${this._recordingId}"`,
      );
    await actions.sessions.stopRecording(this._recordingId);
    this._recordingId = undefined;
    this.messenger?.send({ type: "recording-stop" });
  }
}

export default new QuestSessionStore();
