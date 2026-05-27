import { useI18n } from "@lib/i18n/context";
import { Show } from "solid-js";
import { usePageContext } from "vike-solid/usePageContext";

export default function Page() {
  const { t } = useI18n();
  const { is404 } = usePageContext();
  return (
    <Show
      when={is404}
      fallback={
        <>
          <h1>{t("errorPage.internalTitle")}</h1>
          <p>{t("errorPage.internalCopy")}</p>
        </>
      }
    >
      <h1>{t("errorPage.notFoundTitle")}</h1>
      <p>{t("errorPage.notFoundCopy")}</p>
    </Show>
  );
}
