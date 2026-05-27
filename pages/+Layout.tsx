import type { JSX } from "solid-js";
import { Link } from "@components/Link";
import {
  getLocalePreferenceHref,
  Locale,
  persistLocalePreference,
} from "@lib/i18n";
import { useI18n, I18nProvider } from "@lib/i18n/context";
import { For } from "solid-js";
import Languages from "lucide-solid/icons/languages";
import { usePageContext } from "vike-solid/usePageContext";
import "./index.css";

export default function Layout(props: { children?: JSX.Element }) {
  return (
    <I18nProvider>
      <LayoutContent>{props.children}</LayoutContent>
    </I18nProvider>
  );
}

function LayoutContent(props: { children?: JSX.Element }) {
  const { t, locale } = useI18n();
  const pageContext = usePageContext();
  const locales = [Locale.EnUS, Locale.EsMX] as const;

  return (
    <main class="min-h-screen bg-base-100">
      <nav class="navbar sticky top-0 z-20 border-base-300 border-b bg-base-100/85 px-4 backdrop-blur-xl">
        <div class="navbar-start">
          <Link
            href="/"
            aria-label={t("layout.homeAria")}
            class="btn btn-ghost font-black text-2xl tracking-tight"
          >
            {t("common.appName")}
          </Link>
        </div>
        <div class="navbar-end gap-2">
          <Link href="/encode" class="btn btn-ghost btn-sm max-sm:hidden">
            {t("common.nav.encoder")}
          </Link>
          <div class="dropdown dropdown-end">
            <button
              type="button"
              class="btn btn-ghost btn-sm"
              aria-label={t("common.nav.language")}
            >
              <Languages class="size-4" />
              <span class="hidden sm:inline">{locale()}</span>
            </button>
            <ul class="menu dropdown-content z-30 mt-3 w-48 rounded-box bg-base-100 p-2 shadow">
              <For each={locales}>
                {(item) => (
                  <li>
                    <a
                      href={getLocalePreferenceHref(
                        pageContext.urlPathname,
                        item,
                      )}
                      onclick={() => persistLocalePreference(item)}
                      class={locale() === item ? "active" : ""}
                    >
                      {item === Locale.EnUS
                        ? t("common.locale.enUS")
                        : t("common.locale.esMX")}
                    </a>
                  </li>
                )}
              </For>
            </ul>
          </div>
        </div>
      </nav>
      {props.children}
    </main>
  );
}
