import type { Config } from "vike/types";
import vikeSolid from "vike-solid/config";

// Default config (can be overridden by pages)
// https://vike.dev/config

const config: Config = {
  // https://vike.dev/head-tags
  title: "Autoencoder",
  description: "A video encoding server built with Vike and SolidJS",
  passToClient: ["locale"],

  extends: [vikeSolid],
};

export default config;
