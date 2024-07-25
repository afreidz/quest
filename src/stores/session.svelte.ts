import {
  CallClient,
  LocalVideoStream,
  VideoStreamRenderer,
  type Call,
  type CallAgent,
  type AudioDeviceInfo,
  type VideoDeviceInfo,
  type RemoteParticipant,
  type RemoteVideoStream,
  type VideoStreamRendererView,
} from "@azure/communication-calling";

import { actions } from "astro:actions";
import messages from "./messages.svelte";
import { AzureCommunicationTokenCredential } from "@azure/communication-common";

const TIMEOUT = 30000;

class QuestSessionStore {
  private _host? = $state(false);
  private _call?: Call = $state();
  private _permission = $state(false);
  private agent?: CallAgent = $state();
  private _id?: string | null = $state();
  private client = $state(new CallClient());
  private _connected?: boolean = $state(false);
  private _connecting?: boolean = $state(false);
  private _deviceManager = $derived(this.client.getDeviceManager());
  private _mediaReady? = $derived(
    this.id && this.local.audio && this.local.video && this.local.speakers,
  );

  // private startScreenShare?: (
  //   s: LocalVideoStream,
  // ) => ReturnType<Call["startScreenSharing"]> = $state();

  private _local: {
    name?: string;
    id?: string | null;
    audio?: AudioDeviceInfo;
    video?: VideoDeviceInfo;
    stream?: LocalVideoStream;
    speakers?: AudioDeviceInfo;
    camera?: VideoStreamRendererView;
  } = $state({});

  private _remote: {
    name?: string;
    id?: string | null;
    stream?: RemoteVideoStream;
    screen?: VideoStreamRendererView;
    camera?: VideoStreamRendererView;
  } = $state({});

  get remote() {
    return this._remote;
  }

  get local() {
    return this._local;
  }

  get deviceManager() {
    return this._deviceManager;
  }

  get connected() {
    return this._connected;
  }

  get connecting() {
    return this._connecting;
  }

  get mediaReady() {
    return this._mediaReady;
  }

  get id() {
    return this._id;
  }

  get call() {
    return this._call;
  }

  get permission() {
    return this._permission;
  }

  get host() {
    return this._host;
  }

  async setHost(v: boolean) {
    const user = await actions.me.getSession.safe();

    if (!v) {
      this._host = false;
    } else if (user.error) {
      messages.error("Unable to set host without a valid session", user.error);
    } else {
      this._host = v;
    }
  }

  setId(id: string | undefined | null) {
    this._id = id;
  }

  setLocalId(i: string | undefined | null) {
    this._local.id = i;
  }

  setLocalName(n: string | undefined) {
    this._local.name = n;
  }

  setRemoteId(i: string | undefined | null) {
    this._remote.id = i;
  }

  setRemoteName(n: string) {
    this._remote.name = n;
  }

  async setMicrophone(a: AudioDeviceInfo) {
    this._local.audio = a;
    const dm = await this.deviceManager;
    dm.selectMicrophone(a);
  }

  async setSpeakers(a: AudioDeviceInfo) {
    this._local.speakers = a;
    const dm = await this.deviceManager;
    dm.selectSpeaker(a);
  }

  async setVideo(v: VideoDeviceInfo) {
    this._local.video = v;

    if (!this.local.stream) {
      const stream = new LocalVideoStream(v);
      await this.renderLocalCamera(stream);

      this._local.stream = stream;

      if (!this.call) return;
      console.log(`Starting camera "${v.name}"`);
      if (!this.call.isLocalVideoStarted)
        await this.call
          .startVideo(stream)
          .catch((err) =>
            messages.error("Unable to start camera", err.message),
          );
    } else if (this.local.stream.source.id !== v.id) {
      console.log(
        `Switching camera from "${this.local.stream.source.name}" to "${v.name}"`,
      );
      await this.local.stream
        .switchSource(v)
        .catch((err) => messages.error("Unable to switch camera", err.message));
    }
  }

  async getPermission() {
    if (this._permission) return true;
    const dm = await this.deviceManager;
    const answer = await dm.askDevicePermission({ audio: true, video: true });
    this._permission = answer.audio && answer.video;
    return this._permission;
  }

  async join() {
    if (!this.id)
      return messages.error(
        "Unable to initialize the call",
        "no call id available",
      );

    if (this.call && this.connected) {
      await this.call.hangUp();
      this.call.dispose();
    }

    console.log("Connecting to call:", this.id);

    this.client = new CallClient();

    const { token } = await actions.public.getComsToken(
      this.local.id ?? undefined,
    );

    const credential = new AzureCommunicationTokenCredential(token);

    if (this.agent) this.agent.dispose();

    this.agent = await this.client
      .createCallAgent(credential, {
        displayName: this.local.name,
      })
      .catch((err) => {
        messages.error("Unable to intialize call agent", err.message);
        return undefined;
      });

    if (!this.agent) return;

    if (this.host) await actions.sessions.bumpDuration.safe(this.id);

    const call = this.agent.join({ roomId: this.id });
    this._call = call;
    // this.startScreenShare = call.startScreenSharing;

    await this.callReady();

    const existingParticipant = call.remoteParticipants.find(
      (p) => p.displayName === this.remote.name,
    );

    await this.handleRemoteVideoStreams(existingParticipant);

    call.on("remoteParticipantsUpdated", async (e) => {
      console.log("Participants updated", e);
      const added = e.added.find((p) => p.displayName === this.remote.name);
      const removed = e.removed.find((p) => p.displayName === this.remote.name);

      if (removed) {
        this._remote.stream = undefined;
        this._remote.screen = undefined;
        this._remote.camera = undefined;
      } else {
        await this.handleRemoteVideoStreams(added);
      }
    });

    if (call && this.local.video) {
      const local = new LocalVideoStream(this.local.video);
      await call.startVideo(local).catch((err) => {
        messages.error("Unable to connect video", err.message);
      });
    }
  }

  async leave() {
    await this.call?.hangUp();
    // this._local.audio = undefined;
    // this._local.video = undefined;
    // this._local.camera = undefined;
    // this._local.stream = undefined;
    // this._remote.video = undefined;
    // this._remote.camera = undefined;
    // this._remote.screen = undefined;
    // this._local.speakers = undefined;
  }

  private async callReady() {
    if (!this.call) return false;

    return new Promise((r) => {
      this.call?.on("stateChanged", () => {
        console.log(
          "Call State:",
          this.call?.state,
          this.call?.callEndReason?.code ?? "",
          this.call?.callEndReason?.subCode ?? "",
        );
        if (this.call?.state === "Connecting") {
          this._connecting = true;
          this._connected = false;
        }
        if (this.call?.state === "Disconnected") {
          this._connected = false;
          this._connecting = false;
        }
        if (this.call?.state === "Disconnecting") {
          this._connected = false;
          this._connecting = true;
        }
        if (this.call?.state === "Connected") {
          this._connecting = false;
          this._connected = true;
          r(true);
        }
      });
    });
  }

  private async handleRemoteVideoStreams(participant?: RemoteParticipant) {
    if (!participant) return;
    if (this.remote.camera) this._remote.camera = undefined;
    if (this.remote.stream) this._remote.stream = undefined;

    participant.on("videoStreamsUpdated", async (e) => {
      console.log(participant.displayName, "updated video streams", e);
      const added = e.added.find((s) => s.mediaStreamType === "Video");
      const removed = e.removed.find((s) => s.mediaStreamType === "Video");

      if (removed) this._remote.camera = undefined;
      if (removed) this._remote.stream = undefined;

      if (added) {
        await this.remoteStreamReady(added, participant.displayName);
        this._remote.stream = added;
        this._remote.camera = await this.renderRemoteCamera(added);
      }
    });

    const cameraStream = participant.videoStreams.find(
      (s) => s.mediaStreamType === "Video",
    );

    if (cameraStream) {
      await this.remoteStreamReady(cameraStream, participant.displayName);
    }

    this._remote.stream = cameraStream;
    this._remote.camera = await this.renderRemoteCamera(cameraStream);
  }

  private remoteStreamReady(
    stream: RemoteVideoStream | undefined,
    name?: string,
  ) {
    return new Promise((r) => {
      if (!stream) return r(false);
      if (stream.isAvailable) {
        console.log(name, "camera ready", stream.id);
        return r(true);
      }
      stream.on("isAvailableChanged", () => {
        if (stream.isAvailable) {
          console.log(name, "camera ready", stream.id);
          r(true);
        }
      });
    });
  }

  private async renderRemoteCamera(stream?: RemoteVideoStream) {
    if (!stream) return;
    console.log("Updating remote camera");
    const renderer = new VideoStreamRenderer(stream);
    const view = await renderer
      .createView({ scalingMode: "Crop" })
      .catch((err) => {
        messages.error(
          "Unable to handle participant video stream",
          err.message,
        );
        return undefined;
      });

    return view;
  }

  private async renderLocalCamera(stream?: LocalVideoStream) {
    if (!stream) return;
    console.log("Updating local camera");
    const renderer = new VideoStreamRenderer(stream);
    const view = await renderer
      .createView({ scalingMode: "Crop" })
      .catch((err) => {
        messages.error("Unable to handle local video stream", err.message);
        return undefined;
      });

    this._local.camera = view;
  }
}

export default new QuestSessionStore();
