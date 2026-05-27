import { cn } from "@lib/utils";
import {
  DEFAULT_LOCALE,
  localizeHref,
  stripLocalePrefix,
  type Locale,
} from "@lib/i18n";
import { createMemo } from "solid-js";
import type { JSX } from "solid-js";
import { usePageContext } from "vike-solid/usePageContext";

type LinkProps = JSX.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  locale?: Locale;
};

export function Link(props: LinkProps) {
  const pageContext = usePageContext();
  const locale = createMemo(
    () => props.locale ?? pageContext.locale ?? DEFAULT_LOCALE,
  );
  const href = createMemo(() => localizeHref(props.href, locale()));
  const isActive = createMemo(() =>
    props.href === "/"
      ? stripLocalePrefix(pageContext.urlPathname) === props.href
      : stripLocalePrefix(pageContext.urlPathname).startsWith(props.href),
  );

  return (
    <a
      {...props}
      href={href()}
      class={cn(props.class, isActive() && "btn-active")}
    >
      {props.children}
    </a>
  );
}
