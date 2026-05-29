import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import path from "node:path";
import type { EncodeOptions } from "@lib/utils/ffmpeg";
import { ErrorVariant, type ServerResponse, Status } from "@lib/utils/types";
import { estimateOutputFromSource, probeSourceMedia } from "@server/encoder";
import { presignUrl, pullS3File } from "@server/env";
import { videoEncodeQueue } from "@server/queue";

interface EncodeVideoTelefuncArgs {
  objectKey: string;
  outputExtension?: "mkv" | "mp4" | "webm";
  settings?: Pick<EncodeOptions, "hwdecode" | "outArgs">;
}

interface UploadedSourceTelefuncArgs {
  objectKey: string;
  outputExtension?: "mkv" | "mp4" | "webm";
  settings?: Pick<EncodeOptions, "outArgs">;
}

async function inspectUploadedSource({
  objectKey,
  outputExtension = "mkv",
  settings,
}: UploadedSourceTelefuncArgs) {
  let localFilePath: string | null = null;

  try {
    localFilePath = await pullS3File(objectKey);
    const sourceMetadata = await probeSourceMedia(localFilePath);
    const outputEstimate = estimateOutputFromSource({
      source: sourceMetadata,
      outputExtension,
      outArgs: settings?.outArgs ?? {},
    });

    return {
      status: Status.OK,
      sourceMetadata,
      outputEstimate,
    } satisfies ServerResponse;
  } catch (_error) {
    return {
      status: Status.ERRORED,
      errorVariant: ErrorVariant.UNKNOWN,
      message: "Unable to probe uploaded source media",
    } satisfies ServerResponse;
  } finally {
    if (localFilePath !== null) {
      await rm(localFilePath, { force: true });
    }
  }
}

export async function onRequestUpload({
  filename,
  type,
}: {
  filename: string;
  type: string;
}): Promise<ServerResponse & { presignedUrl: string; objectKey: string }> {
  switch (type) {
    case "video/mp4":
    case "video/webm":
    case "video/mkv":
      break;
    default:
      throw new Error("Unsupported file type");
  }
  const objectKey = `${randomUUID()}_${filename}`;

  const presignedUrl = await presignUrl({
    objectKey,
    method: "PUT",
    type,
    expiresIn: 30,
  });
  return { status: Status.OK, presignedUrl, objectKey };
}

export async function onInspectUploadedSource(
  args: UploadedSourceTelefuncArgs,
) {
  return inspectUploadedSource(args);
}

export async function onRequestDownload({ objectKey }: { objectKey: string }) {
  const expiresIn = 3600; // 1 hour
  const presignedUrl = await presignUrl({
    objectKey,
    method: "GET",
    type: "application/octet-stream",
    expiresIn,
  });
  return {
    status: Status.CLIENT_DOWNLOAD_READY,
    presignedUrl,
    expiresAt: Date.now() + expiresIn * 1000,
  } satisfies ServerResponse;
}

export async function onCheckJobStatus({ jobId }: { jobId: string }) {
  const job = await videoEncodeQueue.getJob(jobId);

  if (!job) {
    return {
      status: Status.ERRORED,
      errorVariant: ErrorVariant.JOB_NOT_FOUND,
      message: "Job not found",
    } satisfies ServerResponse;
  }

  const state = await job.getState();

  switch (state) {
    case "completed":
      return {
        status: Status.OK,
        progress: 100,
      } satisfies ServerResponse;
    case "failed":
      return {
        status: Status.ERRORED,
        errorVariant: ErrorVariant.ENCODING_FAILED,
        progress: job.progress,
        message: "Video encoding failed",
      } satisfies ServerResponse;
    case "active":
    case "waiting":
    case "delayed":
      return {
        status: Status.CLIENT_PROCESSING,
        progress: job.progress,
        message: `Job is currently ${state}`,
      } satisfies ServerResponse;
    default:
      return {
        status: Status.ERRORED,
        errorVariant: ErrorVariant.UNKNOWN,
        progress: job.progress,
        message: `Unknown error occurred, job is in ${state} state`,
      } satisfies ServerResponse;
  }
}

export async function onEncodeVideo({
  objectKey,
  outputExtension = "mkv",
  settings,
}: EncodeVideoTelefuncArgs) {
  const file = path.parse(objectKey);
  const workers = await videoEncodeQueue.getWorkersCount();

  if (workers === 0) {
    const message =
      "No workers available to process the video. Please try again later.";

    return {
      status: Status.ERRORED,
      errorVariant: ErrorVariant.NO_WORKER_AVAILABLE,
      message,
    } satisfies ServerResponse;
  }

  const source = await inspectUploadedSource({
    objectKey,
    outputExtension,
    settings,
  });

  if (source.status === Status.ERRORED) return source;

  const outputPath = `encoded_${file.name}.${outputExtension}`;
  const outArgs = settings?.outArgs ?? {};
  const outputEstimate = estimateOutputFromSource({
    source: source.sourceMetadata,
    outputExtension,
    outArgs,
  });

  const job = await videoEncodeQueue.add("encode", {
    objectKey,
    outputPath,
    settings,
  });

  if (!job.id) {
    return {
      status: Status.ERRORED,
      errorVariant: ErrorVariant.UNKNOWN,
      message: "Failed to create encoding job",
    } satisfies ServerResponse;
  }

  return {
    jobId: job.id,
    status: Status.OK,
    objectKey: outputPath,
    sourceMetadata: source.sourceMetadata,
    outputEstimate,
  } satisfies ServerResponse;
}
