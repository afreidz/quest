import { getSession } from "auth-astro/server";
import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
  console.log("running middleware");
  const url = new URL(context.request.url);

  const session = await getSession(context.request);

  if (!session?.user) {
    if (!url.pathname.startsWith("/api")) {
      return context.redirect("/auth/login");
    }

    return new Response(JSON.stringify({ message: "unauthorized" }), {
      status: 401,
    });
  }

  return next();
});
