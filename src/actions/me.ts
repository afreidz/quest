import { defineAction } from "astro:actions";
import { getSession as serverSession } from "auth-astro/server";

export const getSession = defineAction({
  handler: async (_, context) => {
    const session = await serverSession(context.request);

    if (!session?.user) return null;
    const user = session.user;

    const fname = user.name?.split(" ")[0] ?? "";
    const lname = user.name?.split(" ")[1] ?? "";
    const image = user.image;
    const email = user.email;
    return { fname, lname, email, image };
  },
});
