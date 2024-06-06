import { getSession } from "auth-astro/server";
import { defineMiddleware } from "astro:middleware";

const AUTHLESS_ROUTES = ["/404", "/error", "/api/auth", "/auth/login"];

export const onRequest = defineMiddleware(async (context, next) => {
  console.log("running middleware");
  const url = new URL(context.request.url);

  if (AUTHLESS_ROUTES.some((r) => url.pathname.startsWith(r))) return next();

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
