import {
  CallClient,
  LocalVideoStream,
  VideoStreamRenderer,
  type Call,
  type CallAgent,
  type CallState,
  type AudioDeviceInfo,
  type VideoDeviceInfo,
  type CreateViewOptions,
  type RemoteParticipant,
  type RemoteVideoStream,
  type VideoStreamRendererView,
} from "@azure/communication-calling";

import { actions } from "astro:actions";
import messages from "@/stores/messages.svelte";
import { AzureCommunicationTokenCredential } from "@azure/communication-common";

export type SessionRole = "host" | "participant" | "unknown";

export type DevicePermission = {
  audio: boolean;
  video: boolean;
};

export const TIMEOUT = 30000;

class QuestSessionStore {
  // Privates with no getters/setters
  private _call?: Call = $state();
  private _agent?: CallAgent = $state();
  private _client?: CallClient = $state(new CallClient());
  private _cred?: AzureCommunicationTokenCredential = $state();

  // Privates with public getters/setters
  private _muted = $state(false);
  private _id?: string = $state();
  private _camEnabled = $state(true);
  private _userId?: string = $state();
  private _displayName: string = $state("");
  private _status: CallState = $state("None");
  private _camera?: VideoDeviceInfo = $state();
  private _role: SessionRole = $state("unknown");
  private _speakers?: AudioDeviceInfo = $state();
  private _microphone?: AudioDeviceInfo = $state();
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

    if (existing && this.camera.id !== (await existing.getMediaStream()).id) {
      existing.switchSource(this.camera);
    } else {
      const stream = new LocalVideoStream(this.camera);
      await this._call.startVideo(stream);
    }

    this.camEnabled = true;
  }

  async disableCamera() {
    if (!this._call) return (this.camEnabled = false);

    const stream = this._call.localVideoStreams.find(
      (s) => s.mediaStreamType === "Video",
    );
    if (stream) await this._call.stopVideo(stream);

    this.camEnabled = false;
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
    if (!this.id) throw new Error(`Unable to connect without call id`);

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
    const { token } = await actions.public.getComsToken(this.userId);
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

    console.log(this.role, "Updating start time");
    if (this.role === "host")
      await actions.sessions.setStartToNow.safe(this.id);

    const call = agent.join({ roomId: this.id });

    this._call = call;
    this._agent = agent;
    this._client = client;
    this._cred = credential;

    await this.callReady().catch((err) => {
      messages.error(err);
    });

    if (this.camEnabled && this.camera) {
      await this.enableCamera();
    }
  }

  async disconnect() {
    await this._call?.hangUp();
    await this._call?.dispose();
    await this._agent?.dispose();
    this._call = undefined;
    this._agent = undefined;
    this._client = undefined;
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

  // private _host? = $state(false);
  // private _call?: Call = $state();
  // private _permission = $state(false);
  // private agent?: CallAgent = $state();
  // private _id?: string | null = $state();
  // private client = $state(new CallClient());
  // private _connected?: boolean = $state(false);
  // private _connecting?: boolean = $state(false);
  // private _deviceManager = $derived(this.client.getDeviceManager());

  // private _local: {
  //   name?: string;
  //   muted?: boolean;
  //   id?: string | null;
  //   audio?: AudioDeviceInfo;
  //   video?: VideoDeviceInfo;
  //   stream?: LocalVideoStream;
  //   screen?: LocalVideoStream;
  //   speakers?: AudioDeviceInfo;
  //   camera?: VideoStreamRendererView;
  // } = $state({});

  // private _remote: {
  //   name?: string;
  //   muted?: boolean;
  //   id?: string | null;
  //   cameraEnabled?: boolean;
  //   screenEnabled?: boolean;
  //   stream?: RemoteVideoStream;
  //   screen?: VideoStreamRendererView;
  //   camera?: VideoStreamRendererView;
  // } = $state({});

  // get remote() {
  //   return this._remote;
  // }

  // get local() {
  //   return this._local;
  // }

  // get deviceManager() {
  //   return this._deviceManager;
  // }

  // get connected() {
  //   return this._connected;
  // }

  // get connecting() {
  //   return this._connecting;
  // }

  // get id() {
  //   return this._id;
  // }

  // get call() {
  //   return this._call;
  // }

  // get permission() {
  //   return this._permission;
  // }

  // get host() {
  //   return this._host;
  // }

  // async setHost(v: boolean) {
  //   const user = await actions.me.getSession.safe();

  //   if (!v) {
  //     this._host = false;
  //   } else if (user.error) {
  //     messages.error("Unable to set host without a valid session", user.error);
  //   } else {
  //     this._host = v;
  //   }
  // }

  // setId(id: string | undefined | null) {
  //   this._id = id;
  // }

  // setLocalId(i: string | undefined | null) {
  //   this._local.id = i;
  // }

  // setLocalName(n: string | undefined) {
  //   this._local.name = n;
  // }

  // setRemoteId(i: string | undefined | null) {
  //   this._remote.id = i;
  // }

  // setRemoteName(n: string) {
  //   this._remote.name = n;
  // }

  // async getPermission() {
  //   if (this._permission) return true;
  //   const dm = await this.deviceManager;
  //   const answer = await dm.askDevicePermission({ audio: true, video: true });
  //   this._permission = answer.audio && answer.video;
  //   return this._permission;
  // }

  // async setMicrophone(a: AudioDeviceInfo) {
  //   this._local.audio = a;
  //   const dm = await this.deviceManager;
  //   dm.selectMicrophone(a);
  // }

  // async setSpeakers(a: AudioDeviceInfo) {
  //   this._local.speakers = a;
  //   const dm = await this.deviceManager;
  //   dm.selectSpeaker(a);
  // }

  // async setVideo(v: VideoDeviceInfo) {
  //   this._local.video = v;

  //   if (!this.local.stream) {
  //     const stream = new LocalVideoStream(v);
  //     await this.renderLocalCamera(stream);

  //     this._local.stream = stream;

  //     if (!this.call) return;
  //     console.log(`Starting camera "${v.name}"`);
  //     if (!this.call.isLocalVideoStarted)
  //       await this.call
  //         .startVideo(stream)
  //         .catch((err) =>
  //           messages.error("Unable to start camera", err.message),
  //         );
  //   } else if (this.local.stream.source.id !== v.id) {
  //     console.log(
  //       `Switching camera from "${this.local.stream.source.name}" to "${v.name}"`,
  //     );
  //     await this.local.stream
  //       .switchSource(v)
  //       .catch((err) => messages.error("Unable to switch camera", err.message));
  //   }
  // }

  // async toggleAudio(forceOff?: boolean) {
  //   if ((this.call && forceOff === true) || (this.call && !this.call.isMuted)) {
  //     await this.call.mute();
  //     this._local.muted = this.call.isMuted;
  //   } else if (this.call) {
  //     await this.call.unmute();
  //     this._local.muted = this.call.isMuted;
  //   }
  // }

  // async toggleScreen(forceOff?: boolean) {
  //   if (this._local.screen || forceOff === true) {
  //     this._local.screen = undefined;
  //     if (this.call && this.call.isScreenSharingOn)
  //       await this.call.stopScreenSharing();
  //   } else {
  //     await this.startScreenShare();
  //   }
  // }

  // async toggleVideo(forceOff?: boolean) {
  //   if ((this._local.camera && forceOff === true) || this._local.camera) {
  //     this._local.camera.dispose();
  //     this._local.camera = undefined;

  //     const stream = this.call?.localVideoStreams.find(
  //       (s) => s.mediaStreamType === "Video",
  //     );

  //     if (this.call && this.call.isLocalVideoStarted && stream) {
  //       await this.call.stopVideo(stream);
  //     }
  //   } else if (this.local.video || (this.local.video && forceOff === false)) {
  //     const local = new LocalVideoStream(this.local.video);
  //     await this.renderLocalCamera(local);

  //     if (!this.call) return;

  //     await this.call.startVideo(local).catch((err) => {
  //       messages.error("Unable to connect video", err.message);
  //     });
  //   }
  // }

  // async join() {
  //   try {
  //     console.log("Connecting to call:", this.id);
  //     await this.connectToCall();
  //     await this.callReady();

  //     console.log("Starting local video if applicable");
  //     await this.startLocalVideo();

  //     if (!this.host) {
  //       console.log("Starting screen share");
  //       await this.startScreenShare();
  //     }

  //     console.log("Subscribing to participants");
  //     await this.handleParticipants();
  //   } catch (err: any) {
  //     console.log(err);
  //     messages.error("Unable to join call.", err.messaage);
  //   }
  // }

  // async leave() {
  //   await this.local.camera?.dispose();
  //   await this.remote.camera?.dispose();
  //   await this.call?.hangUp();
  //   await this.agent?.dispose();
  //   await this.call?.dispose();

  //   this._call = undefined;
  //   this.agent = undefined;
  //   this.client = new CallClient();

  //   this._local = {
  //     ...this.local,
  //     audio: undefined,
  //     video: undefined,
  //     stream: undefined,
  //     screen: undefined,
  //     camera: undefined,
  //     speakers: undefined,
  //   };

  //   this._remote = {
  //     ...this.remote,
  //     stream: undefined,
  //     screen: undefined,
  //     camera: undefined,
  //     cameraEnabled: false,
  //     screenEnabled: false,
  //   };

  //   this._connected = false;
  //   this._connecting = false;
  // }

  // private async connectToCall() {
  //   if (!this.id) throw new Error(`Unable to connect without call id`);

  //   if (this.call && this.connected) {
  //     await this.call.hangUp();
  //     this.call.dispose();
  //     this._call = undefined;
  //     await this.agent?.dispose();
  //     this.agent = undefined;
  //   }

  //   const client = new CallClient();
  //   const { token } = await actions.public.getComsToken(this.local.id);
  //   const credential = new AzureCommunicationTokenCredential(token);

  //   if (this.agent) await this.agent.dispose();

  //   const agent = await this.client
  //     .createCallAgent(credential, {
  //       displayName: this.local.name,
  //     })
  //     .catch((err) => {
  //       messages.error("Unable to create call agent", err.message);
  //       return undefined;
  //     });

  //   if (!agent) return;

  //   if (this.host) await actions.sessions.setStartToNow.safe(this.id);

  //   const call = agent.join({ roomId: this.id });

  //   this._call = call;
  //   this.agent = agent;
  //   this.client = client;

  //   return call;
  // }

  // private async callReady() {
  //   if (!this.call) return false;

  //   return new Promise((r) => {
  //     this.call?.on("stateChanged", () => {
  //       console.log(
  //         "Call State:",
  //         this.call?.state,
  //         this.call?.callEndReason?.code ?? "",
  //         this.call?.callEndReason?.subCode ?? "",
  //       );
  //       if (this.call?.state === "Connecting") {
  //         this._connecting = true;
  //         this._connected = false;
  //       }
  //       if (this.call?.state === "Disconnected") {
  //         this._connected = false;
  //         this._connecting = false;
  //       }
  //       if (this.call?.state === "Disconnecting") {
  //         this._connected = false;
  //         this._connecting = true;
  //       }
  //       if (this.call?.state === "Connected") {
  //         this._connecting = false;
  //         this._connected = true;
  //         r(true);
  //       }
  //     });
  //   });
  // }

  // private async handleParticipants() {
  //   // if (!this.call)
  //   //   throw new Error(
  //   //     `Unable to manage participants without a call.  Call is: ${this.call}`,
  //   //   );

  //   // const existingParticipant = this.call.remoteParticipants.find(
  //   //   (p) => p.displayName === this.remote.name,
  //   // );

  //   // if (existingParticipant) {
  //   //   await this.handleRemoteVideoStreams(existingParticipant).catch((err) => {
  //   //     messages.error("Unable to handle remote video", err.message);
  //   //   });
  //   // }

  //   // this.call.on("remoteParticipantsUpdated", async (e) => {
  //   //   console.log("Participants updated", e);
  //   //   const added = e.added.find((p) => p.displayName === this.remote.name);
  //   //   const removed = e.removed.find((p) => p.displayName === this.remote.name);

  //   //   if (removed) {
  //   //     this._remote.stream = undefined;
  //   //     this._remote.screen = undefined;
  //   //     this._remote.camera = undefined;
  //   //     this._remote.cameraEnabled = false;
  //   //     this._remote.screenEnabled = false;
  //   //   } else {
  //   //     await this.handleRemoteVideoStreams(added);
  //   //   }
  //   // });
  // }

  // private async handleRemoteVideoStreams(participant?: RemoteParticipant) {
  //   // if (!participant) return;
  //   // if (this.remote.camera) this._remote.camera = undefined;
  //   // if (this.remote.stream) this._remote.stream = undefined;

  //   // const camStream = participant.videoStreams.find(
  //   //   (s) => s.mediaStreamType === "Video",
  //   // );

  //   // const screenStream = participant.videoStreams.find(
  //   //   (s) => s.mediaStreamType === "ScreenSharing",
  //   // );

  //   // if (camStream) {
  //   //   await this.remoteStreamReady(camStream, participant.displayName);
  //   //   this._remote.camera = await this.renderRemoteStream(camStream);
  //   // }

  //   // if (screenStream) {
  //   //   await this.remoteStreamReady(screenStream, participant.displayName);
  //   //   this._remote.stream = camStream;
  //   //   this._remote.screen = await this.renderRemoteStream(
  //   //     screenStream,
  //   //     "Stretch",
  //   //   );
  //   // }

  //   // participant.on("videoStreamsUpdated", async (e) => {
  //   //   console.log(participant.displayName, "updated video streams", e);
  //   //   const addedVideo = e.added.find((s) => s.mediaStreamType === "Video");
  //   //   const removedVideo = e.removed.find((s) => s.mediaStreamType === "Video");

  //   //   const addedScreen = e.added.find(
  //   //     (s) => s.mediaStreamType === "ScreenSharing",
  //   //   );
  //   //   const removedScreen = e.removed.find(
  //   //     (s) => s.mediaStreamType === "ScreenSharing",
  //   //   );

  //   //   if (removedVideo) {
  //   //     this.remote.camera?.dispose();
  //   //     this._remote.camera = undefined;
  //   //     this._remote.stream = undefined;
  //   //     this._remote.cameraEnabled = false;
  //   //   }

  //   //   if (removedScreen) {
  //   //     this.remote.screen?.dispose();
  //   //     this._remote.screen = undefined;
  //   //     this._remote.screenEnabled = false;
  //   //   }

  //   //   if (addedVideo) {
  //   //     await this.remoteStreamReady(addedVideo, participant.displayName);
  //   //     this._remote.stream = addedVideo;
  //   //     this._remote.camera = await this.renderRemoteStream(addedVideo);
  //   //     this._remote.cameraEnabled = true;
  //   //   }

  //   //   if (addedScreen) {
  //   //     this._remote.screen = await this.renderRemoteStream(
  //   //       addedScreen,
  //   //       "Stretch",
  //   //     );
  //   //     this._remote.screenEnabled = true;
  //   //   }
  //   // });
  // }

  // private remoteStreamReady(
  //   stream: RemoteVideoStream | undefined,
  //   name?: string,
  // ) {
  //   // return new Promise((r) => {
  //   //   if (!stream) return r(false);
  //   //   if (stream.isAvailable) {
  //   //     console.log(name, "camera ready", stream.id);
  //   //     return r(true);
  //   //   }
  //   //   stream.on("isAvailableChanged", () => {
  //   //     if (stream.isAvailable) {
  //   //       console.log(name, "camera ready", stream.id);
  //   //       r(true);
  //   //     }
  //   //   });
  //   // });
  // }

  // private async renderRemoteStream(
  //   stream?: RemoteVideoStream,
  //   mode: ScalingMode = "Crop",
  // ) {
  //   // if (!stream?.isAvailable) return;

  //   // console.log("Updating remote camera");
  //   // const renderer = new VideoStreamRenderer(stream);
  //   // const view = await renderer
  //   //   .createView({ scalingMode: mode })
  //   //   .catch((err) => {
  //   //     messages.error(
  //   //       "Unable to handle participant video stream",
  //   //       err.message,
  //   //     );
  //   //     return undefined;
  //   //   });

  //   // if (view) this._remote.cameraEnabled = true;

  //   // return view;
  // }

  // private async renderLocalCamera(stream?: LocalVideoStream) {
  //   // if (!stream) return;
  //   // console.log("Updating local camera");
  //   // const renderer = new VideoStreamRenderer(stream);
  //   // const view = await renderer
  //   //   .createView({ scalingMode: "Crop" })
  //   //   .catch((err) => {
  //   //     console.log(err);
  //   //     messages.error("Unable to handle local video stream", err.message);
  //   //     return undefined;
  //   //   });

  //   // this._local.camera = view;
  // }

  async renderCamera<T extends HTMLElement>(
    target: T,
    camera: VideoDeviceInfo,
    options: CreateViewOptions = { scalingMode: "Crop" },
  ) {
    const stream = new LocalVideoStream(camera || this.camera);
    const renderer = new VideoStreamRenderer(stream);
    const view = await renderer.createView(options);
    target.replaceChildren(view.target);
  }

  // private async startLocalVideo() {
  //   // if (this.call && this.local.video) {
  //   //   const local = new LocalVideoStream(this.local.video);
  //   //   await this.call.startVideo(local).catch((err) => {
  //   //     messages.error("Unable to connect video", err.message);
  //   //   });
  //   // }
  // }

  // private async startScreenShare() {
  //   // console.log("Starting screenshare");
  //   // if (!this.call) return;

  //   // const video: MediaStreamConstraints["video"] = {
  //   //   frameRate: 30,
  //   //   aspectRatio: 16 / 9,
  //   //   width: { ideal: 1280 },
  //   // };

  //   // const media = await navigator.mediaDevices.getDisplayMedia({
  //   //   video,
  //   //   audio: false,
  //   //   preferCurrentTab: true,
  //   // } as DisplayMediaStreamOptions & { preferCurrentTab: boolean });

  //   // const stream = new LocalVideoStream(media);

  //   // (this.call.startScreenSharing as any)(stream);
  //   // this._local.screen = stream;
  // }
}

export default new QuestSessionStore();
