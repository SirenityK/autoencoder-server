import { type ChildProcess, spawn } from "node:child_process";
import {
  buildFfmpegArgs,
  Decoder,
  type EncodeOptions,
} from "@lib/utils/ffmpeg";
import type { Job } from "bullmq";

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
