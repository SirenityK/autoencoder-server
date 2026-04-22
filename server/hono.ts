import vike from "@vikejs/hono";
import { Hono } from "hono";
import { telefuncHandler } from "./telefunc-handler";

function getApp() {
  const app = new Hono();

  vike(app, [
    // Telefunc route. See https://telefunc.com
    telefuncHandler,
  ]);

  return app;
}

export const app = getApp();
