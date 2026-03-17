import type { Job, JobProgress } from "bullmq";
import type * as v from "valibot";
import type { localStorageSchema } from "./env";
import type { EncodeOptions } from "./ffmpeg";

export enum Status {
  OK,
  ERRORED,
  CLIENT_IDLE, // The client is idle and can start a new request
  CLIENT_UPLOADING, // The client is currently uploading a file
  CLIENT_PROCESSING, // The client is waiting for the server to process the file
  CLIENT_DOWNLOAD_READY, // The client's file is ready for download
}

export enum ErrorVariant {
  FILE_TOO_LARGE,
  INVALID_FILE_TYPE,
  ENCODING_FAILED,
  JOB_NOT_FOUND,
  USER_NOT_FOUND,
  NO_WORKER_AVAILABLE,
  UNKNOWN,
}

type ServerResponseBase = {
  presignedUrl?: string;
  progress?: JobProgress;
  objectKey?: string;
  expiresAt?: number;
  jobId?: Job["id"] | null;
  message?: string;
};

type OkServerResponse = ServerResponseBase & {
  status: Exclude<Status, Status.ERRORED>;
};

type ErroredServerResponse = ServerResponseBase & {
  status: Status.ERRORED;
  errorVariant: ErrorVariant;
};

export type ServerResponse = ErroredServerResponse | OkServerResponse;

export interface QueueJobData {
  objectKey: string;
  outputPath: string;
  settings?: Pick<EncodeOptions, "outArgs">;
}

export type LocalStorageData = v.InferInput<typeof localStorageSchema>;
