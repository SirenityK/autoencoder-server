import {
  DEFAULT_LOCALE,
  getAlternateLocaleHref,
  isLocale,
  LOCALE_PREFERENCE_COOKIE_NAME,
  type Locale,
} from "@lib/i18n";
import vike from "@vikejs/hono";
import { type Context, Hono } from "hono";
import { setCookie } from "hono/cookie";
import { telefuncHandler } from "./telefunc-handler";

function getApp() {
  const app = new Hono();

  app.get("/__locale/:locale", (c) => {
    const rawLocale = c.req.param("locale");
    const locale: Locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
    const target = getSafeLocaleTarget(c.req.query("to"), locale);

    return redirectWithLocalePreference(c, locale, target);
  });

  app.get("/:currentLocale/__locale/:locale", (c) => {
    const currentLocale = c.req.param("currentLocale");
    const rawLocale = c.req.param("locale");
    const locale: Locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
    const target = getSafeLocaleTarget(c.req.query("to"), locale);

    if (!isLocale(currentLocale)) return c.notFound();
    return redirectWithLocalePreference(c, locale, target);
  });

  vike(app, [
    // Telefunc route. See https://telefunc.com
    telefuncHandler,
  ]);

  return app;
}

export const app = getApp();

function redirectWithLocalePreference(
  c: Context,
  locale: Locale,
  target: string,
) {
  setCookie(c, LOCALE_PREFERENCE_COOKIE_NAME, locale, {
    path: "/",
    maxAge: 31_536_000,
    sameSite: "Lax",
  });

  return c.redirect(target);
}

function getSafeLocaleTarget(
  target: string | undefined,
  locale: Locale,
): string {
  if (!target?.startsWith("/") || target.startsWith("//")) {
    return getAlternateLocaleHref("/", locale);
  }

  if (target.startsWith("/__locale")) {
    return getAlternateLocaleHref("/", locale);
  }

  return target;
}
