import { getSession } from "auth-astro/server";
import { defineMiddleware } from "astro:middleware";

const AUTHLESS_ROUTES = [
  "/404",
  "/error",
  "/public",
  "/api/auth",
  "/auth/login",
  "/_actions/public",
];

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);

  if (AUTHLESS_ROUTES.some((r) => url.pathname.startsWith(r))) return next();

  const session = await getSession(context.request);

  if (!session?.user) {
    return new Response(JSON.stringify({ message: "unauthorized" }), {
      status: 401,
    });
  }

  return next();
});
