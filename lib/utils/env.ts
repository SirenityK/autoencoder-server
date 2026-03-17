import type { InferInput, ObjectEntries, ObjectSchema } from "valibot";
import * as v from "valibot";
import {
  AudioCodec,
  AudioProfile,
  ColorDepth,
  FrameRate,
  Preset,
  Resolution,
  Tune,
  VideoCodec,
} from "./ffmpeg";

export function parseEnv<
  const T extends ObjectSchema<ObjectEntries, undefined>,
>(
  schema: T,
  object: InferInput<T>,
  env: "client" | "server" = "client",
  envPrefix = "PUBLIC_ENV__",
) {
  if (env === "client")
    Object.keys(object)
      .filter((key) => key.startsWith(envPrefix))
      .forEach((key) => {
        throw new Error(
          `Environment variable "${key}" does not start with the required prefix "${envPrefix}".`,
        );
      });
  const res = v.parse(schema, object);
  return res;
}

export const localStorageSchema = v.object({
  fileHistory: v.array(
    v.object({
      objectKey: v.string(),
      filename: v.string(),
      type: v.string(),
      uploadedAt: v.number(),
      expiresAt: v.number(),
      meta: v.object({
        video: v.object({
          codec: v.enum(VideoCodec),
          resolution: v.enum(Resolution),
          preset: v.enum(Preset),
          tune: v.enum(Tune),
          crf: v.pipe(v.number(), v.minValue(0)),
          framerate: v.enum(FrameRate),
          ColorDepth: v.enum(ColorDepth),
        }),
        audio: v.object({
          codec: v.enum(AudioCodec),
          profile: v.enum(AudioProfile),
          bitrate: v.pipe(v.number(), v.minValue(0)), // in kbps
        }),
      }),
    }),
  ),
});
