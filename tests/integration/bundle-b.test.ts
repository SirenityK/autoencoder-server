import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { QueueEvents } from "bullmq";
import { encode } from "@server/encoder";
import { Status, ErrorVariant } from "@lib/utils/types";
import {
  AudioCodec,
  FrameRate,
  Preset,
  Resolution,
  VideoCodec,
} from "@lib/utils/ffmpeg";
import {
  buildOutArgs,
  getVisualQualityCrf,
  markMatchingSocialPreset,
  socialPresetSettings,
  SocialPreset,
  VisualQuality,
} from "@lib/utils/social-presets";
import {
  createTestWorkspace,
  generateTinyVideo,
  probeMedia,
  removeTestWorkspace,
} from "../helpers/media";
import {
  canReachConfiguredS3,
  deleteObjects,
  downloadWithPresignedUrl,
  objectExists,
  uploadWithPresignedUrl,
} from "../helpers/s3";

const TEST_TIMEOUT = 60_000;
const VIDEO_TYPE = "video/mp4";
const liveS3Available = await canReachConfiguredS3();
const liveTest = liveS3Available ? test : test.skip;

let loadedQueue: { close: () => Promise<void> } | undefined;

async function loadVideoEncodeQueue() {
  const { videoEncodeQueue } = await import("@server/queue");
  loadedQueue = videoEncodeQueue;
  return videoEncodeQueue;
}

describe("social preset ffmpeg args", () => {
  test("builds WhatsApp-compatible MP4 output args", () => {
    const settings = socialPresetSettings(SocialPreset.WhatsApp);
    const args = buildOutArgs(settings);

    expect(args["c:v"]).toBe(VideoCodec.H264);
    expect(args.preset).toBe(Preset.Slow);
    expect(args.crf).toBe("28");
    expect(args.movflags).toBe("+faststart");
    expect(args["c:a"]).toBe(AudioCodec.AAC);
    expect(args.vf).toContain("fps=min(30000/1001\\,source_fps)");
    expect(args.vf).toContain("scale=w=-2:h='min(480\\,ih)':flags=lanczos");
    expect(args.vf).toContain("out_transfer=bt709");
    expect(args.vf).toContain("out_primaries=bt709");
    expect(args.vf).toContain("out_color_matrix=bt709");
    expect(args.vf).toContain("out_range=tv");
    expect(args.vf).toContain("format=yuv420p");
  });

  test("builds inferred Instagram and Messenger defaults", () => {
    const instagram = socialPresetSettings(SocialPreset.Instagram);
    const messenger = socialPresetSettings(SocialPreset.Messenger);

    expect(instagram.video.resolution).toBe(Resolution.FHD);
    expect(instagram.video.crf).toBe(23);
    expect(buildOutArgs(instagram)).toEqual(
      expect.objectContaining({
        "c:v": VideoCodec.H264,
        "c:a": AudioCodec.AAC,
        movflags: "+faststart",
        preset: Preset.Slow,
      }),
    );

    expect(messenger.video.resolution).toBe(Resolution.HD);
    expect(messenger.video.crf).toBe(23);
    expect(buildOutArgs(messenger)).toEqual(
      expect.objectContaining({
        "c:v": VideoCodec.H264,
        "c:a": AudioCodec.AAC,
        movflags: "+faststart",
        preset: Preset.Slow,
      }),
    );
  });

  test("marks settings as custom when controlled fields differ", () => {
    const settings = socialPresetSettings(SocialPreset.WhatsApp);
    const changedSettings = markMatchingSocialPreset({
      ...settings,
      video: {
        ...settings.video,
        crf: getVisualQualityCrf({
          quality: VisualQuality.Good,
          codec: settings.video.videoCodec,
        }),
        framerate: FrameRate.Source,
      },
    });

    expect(changedSettings.socialPreset).toBe(SocialPreset.Custom);
  });
});

describe("production encoding path", () => {
  const runId = randomUUID();
  const objectKeys = new Set<string>();
  let workspace: string;
  let sourcePath: string;

  beforeAll(async () => {
    workspace = await createTestWorkspace();
    sourcePath = join(workspace, "source.mp4");
    await generateTinyVideo(sourcePath);
  });

  afterAll(async () => {
    if (liveS3Available) await deleteObjects([...objectKeys]);
    await loadedQueue?.close();
    await removeTestWorkspace(workspace);
  });

  test("can reach the configured S3 endpoint", () => {
    expect(liveS3Available).toBe(true);
  });

  liveTest(
    "uploads a generated video through a presigned URL and fetches it back",
    async () => {
      const objectKey = `test-${runId}-presigned-source.mp4`;
      objectKeys.add(objectKey);

      await uploadWithPresignedUrl({
        objectKey,
        file: Bun.file(sourcePath),
        type: VIDEO_TYPE,
      });

      expect(await objectExists(objectKey)).toBe(true);

      const downloaded = await downloadWithPresignedUrl(objectKey);
      const downloadedPath = join(workspace, "downloaded-source.mp4");
      await writeFile(downloadedPath, downloaded);

      const media = await probeMedia(downloadedPath);
      expect(Number(media.format.duration)).toBeGreaterThan(0);
      expect(
        media.streams.some((stream) => stream.codec_type === "video"),
      ).toBe(true);
    },
    TEST_TIMEOUT,
  );

  test(
    "encodes a local source file and produces playable H264/AAC output",
    async () => {
      const outputPath = join(workspace, "direct-encoded.mp4");

      await encode({
        inputs: [sourcePath],
        output: outputPath,
        outArgs: {
          "c:v": VideoCodec.H264,
          preset: Preset.Ultrafast,
          crf: "28",
          "c:a": AudioCodec.AAC,
          "b:a": "96k",
        },
      });

      const media = await probeMedia(outputPath);
      expect(media.streams).toContainEqual(
        expect.objectContaining({
          codec_type: "video",
          codec_name: "h264",
        }),
      );
      expect(media.streams).toContainEqual(
        expect.objectContaining({
          codec_type: "audio",
          codec_name: "aac",
        }),
      );
      expect(Number(media.format.duration)).toBeGreaterThan(0);
    },
    TEST_TIMEOUT,
  );

  test("rejects direct encodes for missing input files", async () => {
    await expect(
      encode({
        inputs: [join(workspace, "missing.mp4")],
        output: join(workspace, "missing-output.mp4"),
        outArgs: {
          "c:v": VideoCodec.H264,
        },
      }),
    ).rejects.toThrow();
  });

  liveTest(
    "processes an encode job through the live worker and uploads the result",
    async () => {
      const videoEncodeQueue = await loadVideoEncodeQueue();
      const workers = await videoEncodeQueue.getWorkersCount();
      expect(workers).toBeGreaterThan(0);

      const inputKey = `test-${runId}-worker-source.mp4`;
      const outputKey = `test-${runId}-worker-output.mkv`;
      objectKeys.add(inputKey);
      objectKeys.add(outputKey);

      await uploadWithPresignedUrl({
        objectKey: inputKey,
        file: Bun.file(sourcePath),
        type: VIDEO_TYPE,
      });

      const queueEvents = new QueueEvents("video-encoding", {
        connection: videoEncodeQueue.opts.connection,
      });
      await queueEvents.waitUntilReady();

      const job = await videoEncodeQueue.add("encode", {
        objectKey: inputKey,
        outputPath: outputKey,
        settings: {
          outArgs: {
            "c:v": VideoCodec.H264,
            preset: Preset.Ultrafast,
            crf: "30",
            "c:a": AudioCodec.AAC,
            "b:a": "96k",
          },
        },
      });

      try {
        await job.waitUntilFinished(queueEvents, TEST_TIMEOUT);
      } finally {
        await queueEvents.close();
      }

      expect(await objectExists(outputKey)).toBe(true);

      const downloaded = await downloadWithPresignedUrl(outputKey);
      const outputPath = join(workspace, "worker-output.mkv");
      await writeFile(outputPath, downloaded);

      const media = await probeMedia(outputPath);
      expect(Number(media.format.duration)).toBeGreaterThan(0);
      expect(media.streams.some((stream) => stream.codec_name === "h264")).toBe(
        true,
      );
    },
    TEST_TIMEOUT,
  );

  liveTest(
    "marks worker jobs as failed when the source object is missing",
    async () => {
      const videoEncodeQueue = await loadVideoEncodeQueue();
      const workers = await videoEncodeQueue.getWorkersCount();
      expect(workers).toBeGreaterThan(0);

      const queueEvents = new QueueEvents("video-encoding", {
        connection: videoEncodeQueue.opts.connection,
      });
      await queueEvents.waitUntilReady();

      const job = await videoEncodeQueue.add("encode", {
        objectKey: `test-${runId}-missing-source.mp4`,
        outputPath: `test-${runId}-missing-output.mkv`,
        settings: {
          outArgs: {
            "c:v": VideoCodec.H264,
          },
        },
      });

      try {
        await expect(
          job.waitUntilFinished(queueEvents, TEST_TIMEOUT),
        ).rejects.toThrow();
      } finally {
        await queueEvents.close();
      }

      const failedJob = await videoEncodeQueue.getJob(job.id ?? "");
      expect(await failedJob?.getState()).toBe("failed");
    },
    TEST_TIMEOUT,
  );

  liveTest(
    "exercises the Telefunc upload, enqueue, status, and download helpers",
    async () => {
      const {
        onCheckJobStatus,
        onEncodeVideo,
        onRequestDownload,
        onRequestUpload,
      } = await import("../../pages/encode/+Page.telefunc");
      const videoEncodeQueue = await loadVideoEncodeQueue();

      await expect(
        onRequestUpload({
          filename: "source.txt",
          type: "text/plain",
        }),
      ).rejects.toThrow("Unsupported file type");

      const upload = await onRequestUpload({
        filename: `test-${runId}-telefunc-source.mp4`,
        type: VIDEO_TYPE,
      });
      objectKeys.add(upload.objectKey);

      await uploadWithPresignedUrl({
        objectKey: upload.objectKey,
        file: Bun.file(sourcePath),
        type: VIDEO_TYPE,
      });

      const missingStatus = await onCheckJobStatus({
        jobId: `missing-${runId}`,
      });
      expect(missingStatus).toEqual(
        expect.objectContaining({
          status: Status.ERRORED,
          errorVariant: ErrorVariant.JOB_NOT_FOUND,
        }),
      );

      const workers = await videoEncodeQueue.getWorkersCount();
      expect(workers).toBeGreaterThan(0);

      const encodeResponse = await onEncodeVideo({
        objectKey: upload.objectKey,
        outputExtension: "mp4",
        settings: {
          outArgs: {
            "c:v": VideoCodec.H264,
            preset: Preset.Ultrafast,
            crf: "30",
            "c:a": AudioCodec.AAC,
            "b:a": "96k",
          },
        },
      });

      expect(encodeResponse.status).toBe(Status.OK);
      expect(encodeResponse.jobId).toBeTruthy();
      expect(encodeResponse.objectKey).toEndWith(".mp4");
      if (encodeResponse.objectKey) objectKeys.add(encodeResponse.objectKey);

      const queueEvents = new QueueEvents("video-encoding", {
        connection: videoEncodeQueue.opts.connection,
      });
      await queueEvents.waitUntilReady();
      const job = await videoEncodeQueue.getJob(encodeResponse.jobId ?? "");
      expect(job).toBeTruthy();
      try {
        await job?.waitUntilFinished(queueEvents, TEST_TIMEOUT);
      } finally {
        await queueEvents.close();
      }

      const completedStatus = await onCheckJobStatus({
        jobId: encodeResponse.jobId ?? "",
      });
      expect(completedStatus).toEqual(
        expect.objectContaining({
          status: Status.OK,
          progress: 100,
        }),
      );

      const download = await onRequestDownload({
        objectKey: encodeResponse.objectKey ?? "",
      });
      expect(download).toEqual(
        expect.objectContaining({
          status: Status.CLIENT_DOWNLOAD_READY,
          presignedUrl: expect.any(String),
          expiresAt: expect.any(Number),
        }),
      );
    },
    TEST_TIMEOUT,
  );
});
