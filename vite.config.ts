import { telefunc } from "telefunc/vite";
import tailwindcss from "@tailwindcss/vite";
import vikeSolid from "vike-solid/vite";
/// <reference types="@batijs/core/types" />

import vike from "vike/plugin";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [vike(), vikeSolid(), tailwindcss(), telefunc()],
});
