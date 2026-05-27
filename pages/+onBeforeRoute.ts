import { applyLocaleRedirect, extractLocale } from "@lib/i18n";
import type { PageContext } from "vike/types";

export function onBeforeRoute(pageContext: PageContext) {
  applyLocaleRedirect(pageContext);

  const { locale, urlWithoutLocale } = extractLocale(pageContext.urlParsed);

  return {
    pageContext: {
      locale,
      urlLogical: urlWithoutLocale,
    },
  };
}
