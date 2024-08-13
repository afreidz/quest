import {
  Features,
  type Call,
  type DataChannelSender,
  type DataChannelReceiver,
} from "@azure/communication-calling";

import { EventEmitter } from "@/utilities/events";

type PingTestMessage = {
  type: "ping";
};

type PushURLMessage = {
  type: "push-url";
  url: string;
};

type SessionStopMessage = {
  type: "session-stop";
};

type RecordingStartMessage = {
  type: "recording-start";
  time?: string;
};

type RecordingStopMessage = {
  type: "recording-stop";
};

export type DataMessage =
  | PingTestMessage
  | PushURLMessage
  | SessionStopMessage
  | RecordingStartMessage
  | RecordingStopMessage;

export default class Messenger extends EventEmitter {
  private _decoder: TextDecoder;
  private _encoder: TextEncoder;
  private _sender: DataChannelSender;
  private _receiver?: DataChannelReceiver;

  constructor(call: Call) {
    super();

    const channel = call.feature(Features.DataChannel);

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    this._encoder = encoder;
    this._decoder = decoder;

    channel.on("dataChannelReceiverCreated", (receiver) => {
      this._receiver = receiver;
      receiver.on("messageReady", () => this._handleMessage());
      console.log("Data channel receiver intitialized");
      this.send({ type: "ping" });
    });

    this._sender = channel.createDataChannelSender({ channelId: 1000 });
  }

  private _handleMessage() {
    const message = this._receiver?.readMessage();
    if (this._receiver?.channelId !== 1000 || !message) return;

    this.emit(
      "message",
      JSON.parse(this._decoder.decode(message?.data)) as DataMessage,
    );
    console.log(
      "Received data message",
      JSON.parse(this._decoder.decode(message?.data)) as DataMessage,
    );
  }

  send(d: DataMessage) {
    console.log("Sending data message", d);
    this._sender.sendMessage(this._encoder.encode(JSON.stringify(d)));
  }
}
