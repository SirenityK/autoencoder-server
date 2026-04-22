import { telefuncHandler } from "./telefunc-handler";
import vike from "@vikejs/hono";
import { Hono } from "hono";

function getApp() {
  const app = new Hono();

  vike(app, [
    // Telefunc route. See https://telefunc.com
    telefuncHandler,
  ]);

  return app;
}

export const app = getApp();
