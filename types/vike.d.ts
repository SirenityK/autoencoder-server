import type { Locale } from "@lib/i18n";

declare global {
  namespace Vike {
    interface PageContext {
      locale?: Locale;
    }
  }
}
