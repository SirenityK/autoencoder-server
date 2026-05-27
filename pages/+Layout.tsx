import type { JSX } from "solid-js";
import "./index.css";

export default function Layout(props: { children?: JSX.Element }) {
  return (
    <main class="min-h-screen bg-base-100">
      <nav class="navbar sticky top-0 z-20 border-base-300 border-b bg-base-100/85 px-4 backdrop-blur-xl">
        <div class="navbar-start">
          <a href="/" class="font-black text-2xl tracking-tight">
            Optiflow
          </a>
        </div>
        <div class="navbar-end hidden gap-2 sm:flex">
          <a href="/encode" class="btn btn-ghost btn-sm">
            Encoder
          </a>
        </div>
      </nav>
      {props.children}
    </main>
  );
}
