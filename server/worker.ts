import { unlink } from "node:fs/promises";
import { join } from "node:path";
import { cwd } from "node:process";
import type { QueueJobData } from "@lib/utils/types";
import { encode } from "@server/encoder";
import { type Job, Worker } from "bullmq";
import { pullS3File, uploadToS3 } from "./env";
import { connection } from "./queue";

/**
 * Entry point for worker process that handles video encoding jobs.
 *
 * DO NOT EXPORT ANYTHING FROM THIS FILE
 */

async function handleEncode(job: Job<QueueJobData>) {
  const { objectKey, outputPath, settings } = job.data;

  // pull the file from S3 to local storage for processing
  const localFilePath = await pullS3File(objectKey);

  try {
    await encode({
      inputs: [localFilePath],
      output: join(cwd(), outputPath),
      ...settings,
    });
    console.info(`Job ${job.id} completed, output at ${outputPath}`);
    await uploadToS3(outputPath, outputPath, "video/mp4");
    console.info(`Uploaded output for job ${job.id} to S3`);
  } finally {
    // clean up temp file
    await unlink(localFilePath).catch(() => {});
    await unlink(outputPath).catch(() => {});
    console.info(
      `Cleaned up temp files ${localFilePath} and ${outputPath} for job ${job.id}`,
    );
  }
}

async function handleMiniature(job: Job<QueueJobData>) {
  const { objectKey, outputPath } = job.data;

  const localFilePath = await pullS3File(objectKey);

  try {
    await encode({
      inputs: [localFilePath],
      output: outputPath,
      outArgs: {
        vf: "scale=320:-2",
        vframes: "1",
        update: "1",
      },
    });
    console.info(`Miniature job ${job.id} completed, output at ${outputPath}`);
  } finally {
    await unlink(localFilePath).catch(() => {});
    await unlink(outputPath).catch(() => {});
    console.info(
      `Cleaned up temp files ${localFilePath} and ${outputPath} for job ${job.id}`,
    );
  }
}

new Worker<QueueJobData>(
  "video-encoding",
  async (job) => {
    switch (job.name) {
      case "encode":
        await handleEncode(job);
        break;
      case "miniature":
        await handleMiniature(job);
        break;
      default:
        console.warn(`Unknown job type: ${job.name}`);
        break;
    }
  },
  { connection },
);

console.log("Worker started, waiting for jobs...");
