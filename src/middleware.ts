import { getSession } from "auth-astro/server";
import { defineMiddleware, sequence } from "astro:middleware";

const AUTHLESS_ROUTES = [
  "/404",
  "/error",
  "/public",
  "/api/auth",
  "/auth/login",
  "/_actions/public",
  "/sessions/events",
  "/sessions/participate",
];

export const auth = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);

  if (AUTHLESS_ROUTES.some((r) => url.pathname.startsWith(r))) {
    return next();
  }

  const session = await getSession(context.request);

  if (!session?.user) {
    const redirect = new URL(url.origin);
    redirect.pathname = "/auth/login";
    return Response.redirect(redirect.href);
  }

  return next();
});

export const onRequest = sequence(auth);
