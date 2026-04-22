import type { JSX } from "solid-js";
import "./index.css";

export default function Layout(props: { children?: JSX.Element }) {
  return (
    <main>
      <nav class="navbar">
        <div class="navbar-start">
          <h1 class="font-bold text-2xl">Optiflow</h1>
        </div>
      </nav>
      <div class="px-4 pb-4">{props.children}</div>
    </main>
  );
}
