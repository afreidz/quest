let messages: ApplicationMessage[] = $state([]);

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
  error(message: string, detail?: string) {
    let id = `message_${+new Date() + Math.random()}`;
    messages.push({
      id,
      detail,
      message,
      type: "error",
      timer: setTimeout(() => this.dismiss(id), 10000),
    });
    return new Error(message);
  },
  dismiss(id: string) {
    messages = messages.filter((m) => m.id !== id);
  },
};
