const messages = $state<ApplicationMessage[]>([]);

export type ApplicationMessage = {
  type: "error" | "success" | "info";
  message: string;
  detail?: string;
  timer?: ReturnType<typeof setTimeout>;
};

export function MessageHandler(msg: ApplicationMessage) {
  messages.push(msg);
  msg.timer = setTimeout(() => DismissMessage(msg), 10000);
}

export function DismissMessage(m: number | ApplicationMessage) {
  const idx = typeof m === "number" ? m : messages.indexOf(m);
  messages.splice(idx, 1);
}

export default messages;
