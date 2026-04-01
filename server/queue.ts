import type { QueueJobData } from "@lib/utils/types";
import { Queue } from "bullmq";
import IORedis from "ioredis";
import { serverEnv } from "./env";

export const connection = new IORedis({
  host: serverEnv.REDIS_HOST,
  maxRetriesPerRequest: null,
});

export const videoEncodeQueue = new Queue<QueueJobData>("video-encoding", {
  connection,
});
