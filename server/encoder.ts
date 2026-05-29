import { type ChildProcess, spawn } from "node:child_process";
import path from "node:path";
import {
  buildFfmpegArgs,
  Decoder,
  type EncodeOptions,
  FrameRate,
  OutputEstimateSchema,
  type SourceMediaMetadata,
  SourceMediaMetadataSchema,
} from "@lib/utils/ffmpeg";
import type { Job } from "bullmq";
import * as v from "valibot";

export async function encode(
  options: EncodeOptions,
  job?: Job, // Optional: Pass the BullMQ job object
): Promise<{ stdout: string; stderr: string; code: number | null }> {
  const {
    inputs,
    output,
    inArgs = [],
    outArgs = {},
    globalArgs = [],
    cmd = "ffmpeg",
    check = true,
    hwdecode,
  } = options;

  const args: string[] = [...globalArgs];
  inputs.forEach((inputFile, i) => {
    const inputArg = i < inArgs.length ? inArgs[i] : {};

    if (hwdecode === Decoder.CUDA) {
      args.push(...buildFfmpegArgs({ hwaccel: "cuda" }));
    }
    if (hwdecode === Decoder.VAAPI) {
      args.push(
        ...buildFfmpegArgs({
          hwaccel_device: "/dev/dri/renderD128",
          hwaccel: hwdecode,
        }),
      );
    }

    args.push(...buildFfmpegArgs(inputArg));
    args.push(...buildFfmpegArgs({ i: inputFile }));
  });

  args.push(...buildFfmpegArgs(outArgs));
  args.push(output);

  const duration = await getFileDuration(inputs[0]);

  console.info(cmd, args.join(" "));

  return new Promise((resolve, reject) => {
    const ffmpegProcess: ChildProcess = spawn(cmd, args);

    let stdout = "";
    let stderr = "";

    ffmpegProcess.stdout?.on("data", (data) => (stdout += data.toString()));

    ffmpegProcess.stderr?.on("data", (data) => {
      const chunk = data.toString();
      stderr += chunk;

      // Notify progress every 5 seconds based on ffmpeg's stderr output
      const timeMatch = chunk.match(/time=(\d{2}:\d{2}:\d{2}\.\d{2})/);
      if (timeMatch && job) {
        const timeString = timeMatch[1];
        const [hours, minutes, seconds] = timeString
          .split(":")
          .map((part: string) => parseFloat(part));
        const currentTime = hours * 3600 + minutes * 60 + seconds;
        const progress = Math.min((currentTime / duration) * 100, 100);
        job.updateProgress(Math.floor(progress));
      }
    });

    ffmpegProcess.on("close", (code) => {
      if (check && code !== 0) {
        reject(new Error(`FFmpeg exited with code ${code}:\n${stderr}`));
      } else {
        resolve({ stdout, stderr, code });
      }
    });

    ffmpegProcess.on("error", (err) => reject(err));
  });
}

export async function getFileDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const ffprobe = spawn("ffprobe", [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      filePath,
    ]);

    let output = "";
    let errorOutput = "";

    ffprobe.stdout.on("data", (data) => (output += data.toString()));
    ffprobe.stderr.on("data", (data) => (errorOutput += data.toString()));

    ffprobe.on("close", (code) => {
      if (code === 0) {
        const duration = parseFloat(output.trim());
        if (!Number.isNaN(duration)) {
          resolve(duration);
        } else {
          reject(
            new Error(
              `Could not parse duration from ffprobe output: ${output}`,
            ),
          );
        }
      } else {
        reject(new Error(`ffprobe exited with code ${code}:\n${errorOutput}`));
      }
    });
  });
}

type ProbeStreamRaw = {
  index?: unknown;
  codec_type?: unknown;
  codec_name?: unknown;
  width?: unknown;
  height?: unknown;
  bit_rate?: unknown;
  r_frame_rate?: unknown;
  channels?: unknown;
  sample_rate?: unknown;
  pix_fmt?: unknown;
  tags?: unknown;
};

type ProbeFormatRaw = {
  duration?: unknown;
  size?: unknown;
  bit_rate?: unknown;
};

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toInt(value: unknown): number | null {
  const parsed = toNumber(value);
  if (parsed === null) return null;
  return Number.isInteger(parsed) ? parsed : Math.trunc(parsed);
}

function parseFrameRate(value: unknown): number | null {
  if (typeof value !== "string") return null;
  if (value.includes("/")) {
    const [numeratorRaw, denominatorRaw] = value.split("/");
    const numerator = toNumber(numeratorRaw);
    const denominator = toNumber(denominatorRaw);
    if (numerator === null || denominator === null || denominator === 0) {
      return null;
    }
    return numerator / denominator;
  }
  return toNumber(value);
}

function parseStreamLanguage(tags: unknown): string | null {
  if (!tags || typeof tags !== "object") return null;
  const tagged = tags as Record<string, unknown>;
  return typeof tagged.language === "string" ? tagged.language : null;
}

function parseStreamTitle(tags: unknown): string | null {
  if (!tags || typeof tags !== "object") return null;
  const tagged = tags as Record<string, unknown>;
  return typeof tagged.title === "string" ? tagged.title : null;
}

function parseTargetFrameRate(
  vf: string | undefined,
  sourceFps: number | null,
) {
  if (!vf) return sourceFps;
  const fpsMatch = vf.match(/fps=([^,]+)/);
  if (!fpsMatch) return sourceFps;
  const token = fpsMatch[1].trim().replaceAll("\\", "");

  if (token === FrameRate.Source) return sourceFps;
  if (token === FrameRate.NTSC_CAPPED) {
    if (sourceFps === null) return 30000 / 1001;
    return Math.min(30000 / 1001, sourceFps);
  }
  if (token === FrameRate.NTSC) return 30000 / 1001;
  if (token === FrameRate.NTSC_FILM) return 24000 / 1001;
  if (token === FrameRate.PAL) return 25;

  const parsed = toNumber(token);
  return parsed ?? sourceFps;
}

function toEven(value: number): number {
  if (value < 2) return 2;
  return value % 2 === 0 ? value : value - 1;
}

function parseTargetResolution({
  vf,
  source,
}: {
  vf: string | undefined;
  source: SourceMediaMetadata;
}) {
  if (!source.resolution) return null;
  if (!vf) return source.resolution;

  const shrinkMatch = vf.match(/scale=w=-2:h='min\((\d+),ih\)'/);
  if (!shrinkMatch) return source.resolution;

  const targetHeight = Number.parseInt(shrinkMatch[1], 10);
  const sourceHeight = source.resolution.height;
  const sourceWidth = source.resolution.width;

  if (sourceHeight <= targetHeight) return source.resolution;

  const scaledWidth = toEven(
    Math.floor((sourceWidth * targetHeight) / sourceHeight),
  );

  return {
    width: scaledWidth,
    height: targetHeight,
  };
}

export async function probeSourceMedia(
  filePath: string,
): Promise<SourceMediaMetadata> {
  const probe = await new Promise<{ stdout: string; stderr: string }>(
    (resolve, reject) => {
      const ffprobe = spawn("ffprobe", [
        "-v",
        "error",
        "-show_streams",
        "-show_format",
        "-of",
        "json",
        filePath,
      ]);

      let stdout = "";
      let stderr = "";
      ffprobe.stdout.on("data", (data) => (stdout += data.toString()));
      ffprobe.stderr.on("data", (data) => (stderr += data.toString()));

      ffprobe.on("error", reject);
      ffprobe.on("close", (code) => {
        if (code === 0) {
          resolve({ stdout, stderr });
          return;
        }
        reject(new Error(`ffprobe exited with code ${code}:\n${stderr}`));
      });
    },
  );

  const parsedJson = JSON.parse(probe.stdout) as unknown;
  if (!parsedJson || typeof parsedJson !== "object") {
    throw new Error("Invalid ffprobe output");
  }

  const root = parsedJson as {
    streams?: unknown;
    format?: unknown;
  };
  const streams = Array.isArray(root.streams)
    ? (root.streams as ProbeStreamRaw[])
    : [];
  const format =
    root.format && typeof root.format === "object"
      ? (root.format as ProbeFormatRaw)
      : {};

  const videoStreams = streams
    .filter((stream) => stream.codec_type === "video")
    .map((stream, i) => ({
      index: toInt(stream.index) ?? i,
      codec:
        typeof stream.codec_name === "string" ? stream.codec_name : "unknown",
      width: toInt(stream.width),
      height: toInt(stream.height),
      frameRate: parseFrameRate(stream.r_frame_rate),
      bitRate: toInt(stream.bit_rate),
      pixelFormat: typeof stream.pix_fmt === "string" ? stream.pix_fmt : null,
    }));

  const audioStreams = streams
    .filter((stream) => stream.codec_type === "audio")
    .map((stream, i) => ({
      index: toInt(stream.index) ?? i,
      codec:
        typeof stream.codec_name === "string" ? stream.codec_name : "unknown",
      channels: toInt(stream.channels),
      sampleRate: toInt(stream.sample_rate),
      bitRate: toInt(stream.bit_rate),
      language: parseStreamLanguage(stream.tags),
    }));

  const subtitleStreams = streams
    .filter((stream) => stream.codec_type === "subtitle")
    .map((stream, i) => ({
      index: toInt(stream.index) ?? i,
      codec:
        typeof stream.codec_name === "string" ? stream.codec_name : "unknown",
      language: parseStreamLanguage(stream.tags),
      title: parseStreamTitle(stream.tags),
    }));

  const primaryVideo = videoStreams.find(
    (stream) => stream.width !== null && stream.height !== null,
  );

  const metadata = {
    duration: toNumber(format.duration),
    fileSize: toInt(format.size),
    totalBitRate: toInt(format.bit_rate),
    containerExtension: path.extname(filePath).replace(".", "") || null,
    resolution:
      primaryVideo &&
      primaryVideo.width !== null &&
      primaryVideo.height !== null
        ? { width: primaryVideo.width, height: primaryVideo.height }
        : null,
    frameRate: primaryVideo?.frameRate ?? null,
    videoStreams,
    audioStreams,
    subtitleStreams,
  } satisfies SourceMediaMetadata;

  return v.parse(SourceMediaMetadataSchema, metadata);
}

export function estimateOutputFromSource({
  source,
  outputExtension,
  outArgs,
}: {
  source: SourceMediaMetadata;
  outputExtension: "mkv" | "mp4" | "webm";
  outArgs: Record<string, string>;
}) {
  const audioBitrateKbpsRaw = outArgs["b:a"];
  const audioBitrateKbps =
    typeof audioBitrateKbpsRaw === "string" && audioBitrateKbpsRaw.endsWith("k")
      ? toNumber(audioBitrateKbpsRaw.slice(0, -1))
      : null;

  const explicitVideoBitrateRaw = outArgs["b:v"];
  const explicitVideoBitrate =
    typeof explicitVideoBitrateRaw === "string" &&
    explicitVideoBitrateRaw.endsWith("k")
      ? toNumber(explicitVideoBitrateRaw.slice(0, -1))
      : null;

  const knownTotalBitrate =
    explicitVideoBitrate !== null && audioBitrateKbps !== null
      ? Math.round((explicitVideoBitrate + audioBitrateKbps) * 1000)
      : null;

  const estimatedSizeBytes =
    knownTotalBitrate !== null && source.duration !== null
      ? Math.round((knownTotalBitrate / 8) * source.duration)
      : null;

  const estimateReason =
    estimatedSizeBytes !== null
      ? "known_total_bitrate"
      : source.duration === null
        ? "duration_unknown"
        : "video_bitrate_unknown";

  const estimate = {
    targetVideoCodec: outArgs["c:v"] ?? "copy",
    targetAudioCodec: outArgs["c:a"] ?? "copy",
    targetResolution: parseTargetResolution({ vf: outArgs.vf, source }),
    targetFrameRate: parseTargetFrameRate(outArgs.vf, source.frameRate),
    targetAudioBitrateKbps: audioBitrateKbps,
    knownTotalBitrate,
    estimatedSizeBytes,
    estimatedSizeReason: estimateReason,
    outputExtension,
  };

  return v.parse(OutputEstimateSchema, estimate);
}
