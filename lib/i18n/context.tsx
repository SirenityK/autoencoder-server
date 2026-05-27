import { createContext, useContext, type JSX } from "solid-js";
import { usePageContext } from "vike-solid/usePageContext";
import {
  createTranslator,
  DEFAULT_LOCALE,
  type Locale,
  type Translator,
} from ".";

type I18nContextValue = {
  locale: () => Locale;
  t: Translator;
};

const I18nContext = createContext<I18nContextValue>();

export function I18nProvider(props: { children?: JSX.Element }) {
  const pageContext = usePageContext();
  const locale = () => pageContext.locale ?? DEFAULT_LOCALE;
  const t = createTranslator(locale);

  return (
    <I18nContext.Provider value={{ locale, t }}>
      {props.children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const value = useContext(I18nContext);
  if (value) return value;

  const locale = () => DEFAULT_LOCALE;
  return {
    locale,
    t: createTranslator(locale),
  };
}
