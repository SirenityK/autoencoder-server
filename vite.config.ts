import tailwindcss from "@tailwindcss/vite";
import { telefunc } from "telefunc/vite";
import vikeSolid from "vike-solid/vite";
/// <reference types="@batijs/core/types" />

import vike from "vike/plugin";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [vike(), vikeSolid(), tailwindcss(), telefunc()],
  resolve: {
    alias: {
      "@lib": "/lib",
      "@server": "/server",
      "@components": "/components",
    },
  },
});
