let messages: ApplicationMessage[] = $state([]);

const MESSAGE_DISMISS_TIME = 5000;

export type ApplicationMessage = {
  id: string;
  message: string;
  detail?: string;
  type: "error" | "success" | "info";
  timer?: ReturnType<typeof setTimeout>;
};

export default {
  get all() {
    return messages;
  },
  info(message: string, detail?: string) {
    let id = `message_${+new Date() + Math.random()}`;
    messages.push({
      id,
      detail,
      message,
      type: "info",
      timer: setTimeout(() => this.dismiss(id), MESSAGE_DISMISS_TIME),
    });
  },
  success(message: string, detail?: string) {
    let id = `message_${+new Date() + Math.random()}`;
    messages.push({
      id,
      detail,
      message,
      type: "success",
      timer: setTimeout(() => this.dismiss(id), MESSAGE_DISMISS_TIME),
    });
  },
  error(message: string, detail?: string) {
    let id = `message_${+new Date() + Math.random()}`;
    messages.push({
      id,
      detail,
      message,
      type: "error",
      timer: setTimeout(() => this.dismiss(id), MESSAGE_DISMISS_TIME),
    });
    return new Error(message);
  },
  dismiss(id: string) {
    messages = messages.filter((m) => m.id !== id);
  },
};
