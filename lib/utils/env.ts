import type { InferInput, ObjectEntries, ObjectSchema } from "valibot";
import * as v from "valibot";
import {
  AudioCodec,
  ColorDepth,
  FrameRate,
  Resolution,
  SourceMediaMetadataSchema,
  VideoCodec,
  OutputEstimateSchema,
} from "./ffmpeg";
import { SocialPreset } from "./social-presets";

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
      settings: v.optional(
        v.object({
          socialPreset: v.enum(SocialPreset),
          outputExtension: v.picklist(["mkv", "mp4", "webm"]),
          video: v.object({
            codec: v.enum(VideoCodec),
            resolution: v.enum(Resolution),
            preset: v.union([v.string(), v.number()]),
            tune: v.union([v.string(), v.number()]),
            crf: v.pipe(v.number(), v.minValue(0)),
            frameRate: v.enum(FrameRate),
            colorDepth: v.enum(ColorDepth),
          }),
          audio: v.object({
            codec: v.enum(AudioCodec),
            profile: v.string(),
            bitrate: v.pipe(v.number(), v.minValue(0)), // in kbps
          }),
        }),
      ),
      sourceMetadata: v.optional(v.nullable(SourceMediaMetadataSchema)),
      outputEstimate: v.optional(v.nullable(OutputEstimateSchema)),
      meta: v.optional(
        v.object({
          video: v.object({
            codec: v.enum(VideoCodec),
            resolution: v.enum(Resolution),
            preset: v.union([v.string(), v.number()]),
            tune: v.union([v.string(), v.number()]),
            crf: v.pipe(v.number(), v.minValue(0)),
            framerate: v.enum(FrameRate),
            colorDepth: v.enum(ColorDepth),
          }),
          audio: v.object({
            codec: v.enum(AudioCodec),
            profile: v.string(),
            bitrate: v.pipe(v.number(), v.minValue(0)), // in kbps
          }),
        }),
      ),
    }),
  ),
});
