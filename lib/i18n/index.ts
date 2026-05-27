import * as i18n from "@solid-primitives/i18n";
import { redirect } from "vike/abort";
import { modifyUrl } from "vike/modifyUrl";
import type { PageContext, Url } from "vike/types";
import { dict as enUS } from "./en-US";
import { dict as esMX } from "./es-MX";

export enum Locale {
  EnUS = "en-US",
  EsMX = "es-MX",
}

export const DEFAULT_LOCALE = Locale.EnUS;
export const LOCALES = [Locale.EnUS, Locale.EsMX] as const;
export const LOCALE_PREFERENCE_STORAGE_KEY = "optiflow-locale";
export const LOCALE_PREFERENCE_COOKIE_NAME = "optiflow_locale";

export type RawDictionary = typeof enUS;
export type Dictionary = i18n.Flatten<RawDictionary>;
export type Translator = i18n.Translator<Dictionary>;

const dictionaries = Object.freeze({
  [Locale.EnUS]: enUS,
  [Locale.EsMX]: esMX,
}) satisfies Record<Locale, RawDictionary>;

const localeLabels = Object.freeze({
  [Locale.EnUS]: "English (US)",
  [Locale.EsMX]: "Espanol (MX)",
}) satisfies Record<Locale, string>;

export function isLocale(value: string): value is Locale {
  return LOCALES.some((locale) => locale === value);
}

export function normalizeLocale(value: string | undefined): Locale {
  if (!value) return DEFAULT_LOCALE;

  const canonicalValue = value.toLowerCase();
  switch (canonicalValue) {
    case "en":
    case "en-us":
      return Locale.EnUS;
    case "es":
    case "es-mx":
      return Locale.EsMX;
    default:
      return DEFAULT_LOCALE;
  }
}

export function getDictionary(locale: Locale): Dictionary {
  return i18n.flatten(dictionaries[locale]);
}

export function getLocaleLabel(locale: Locale): string {
  return localeLabels[locale];
}

export function createTranslator(locale: () => Locale): Translator {
  return i18n.translator(() => getDictionary(locale()), i18n.resolveTemplate);
}

export function stripLocalePrefix(pathname: string): string {
  const segments = pathname.split("/");
  const maybeLocale = segments[1];
  if (!maybeLocale || !isLocale(maybeLocale)) return pathname;

  const pathnameWithoutLocale = `/${segments.slice(2).join("/")}`;
  return pathnameWithoutLocale === "/"
    ? "/"
    : pathnameWithoutLocale.replace(/\/$/, "");
}

export function hasLocalePrefix(pathname: string): boolean {
  const maybeLocale = pathname.split("/")[1];
  return maybeLocale ? isLocale(maybeLocale) : false;
}

export function localizeHref(href: string, locale: Locale): string {
  if (locale === DEFAULT_LOCALE) return href;
  if (href === "/") return `/${locale}`;
  return `/${locale}${href}`;
}

export function getAlternateLocaleHref(
  pathname: string,
  locale: Locale,
): string {
  const logicalPathname = stripLocalePrefix(pathname);
  return localizeHref(logicalPathname, locale);
}

export function getLocalePreferenceHref(
  pathname: string,
  locale: Locale,
): string {
  const target = getAlternateLocaleHref(pathname, locale);
  return `/__locale/${locale}?to=${encodeURIComponent(target)}`;
}

export function persistLocalePreference(locale: Locale) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(LOCALE_PREFERENCE_STORAGE_KEY, locale);
}

export function applyLocaleRedirect(pageContext: PageContext) {
  const { urlParsed } = pageContext;
  if (hasLocalePrefix(urlParsed.pathname)) return;

  const preferredLocale = getPreferredLocale(pageContext);
  if (preferredLocale === DEFAULT_LOCALE) return;

  throw redirect(
    modifyUrl(urlParsed.href, {
      pathname: localizeHref(urlParsed.pathname, preferredLocale),
    }),
  );
}

export function extractLocale(url: Url): {
  locale: Locale;
  urlWithoutLocale: string;
} {
  const { pathname } = url;
  const segments = pathname.split("/");
  const maybeLocale = segments[1];
  const locale =
    maybeLocale && isLocale(maybeLocale) ? maybeLocale : DEFAULT_LOCALE;
  const pathnameWithoutLocale = stripLocalePrefix(pathname);

  return {
    locale,
    urlWithoutLocale: modifyUrl(url.href, { pathname: pathnameWithoutLocale }),
  };
}

function getPreferredLocale(pageContext: PageContext): Locale {
  if (pageContext.isClientSide) {
    return getClientPreferredLocale();
  }

  const savedLocale = getSavedLocaleFromCookie(pageContext.headers?.cookie);
  if (savedLocale) return savedLocale;

  return getPreferredLocaleFromAcceptLanguage(
    pageContext.headers?.["accept-language"],
  );
}

function getClientPreferredLocale(): Locale {
  const savedLocale = window.localStorage.getItem(
    LOCALE_PREFERENCE_STORAGE_KEY,
  );
  if (savedLocale) return normalizeLocale(savedLocale);

  return getPreferredLocaleFromAcceptLanguage(window.navigator.languages);
}

function getSavedLocaleFromCookie(
  cookieHeader: string | undefined,
): Locale | null {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";");
  for (const cookie of cookies) {
    const [rawName, rawValue] = cookie.trim().split("=");
    if (rawName !== LOCALE_PREFERENCE_COOKIE_NAME || !rawValue) continue;
    return normalizeLocale(decodeURIComponent(rawValue));
  }

  return null;
}

function getPreferredLocaleFromAcceptLanguage(
  acceptLanguage: readonly string[] | string | undefined,
): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;

  const languageRanges =
    typeof acceptLanguage === "string"
      ? acceptLanguage
          .split(",")
          .map((range) => range.split(";")[0]?.trim())
          .filter((range): range is string => Boolean(range))
      : acceptLanguage;

  for (const range of languageRanges) {
    const locale = normalizeLocale(range);
    if (locale !== DEFAULT_LOCALE || range.toLowerCase().startsWith("en")) {
      return locale;
    }
  }

  return DEFAULT_LOCALE;
}
