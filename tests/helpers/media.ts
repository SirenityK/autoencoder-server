import { mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";

interface ProbeStream {
  codec_type?: string;
  codec_name?: string;
  width?: number;
  height?: number;
}

interface ProbeFormat {
  duration?: string;
  size?: string;
}

export interface ProbeResult {
  streams: ProbeStream[];
  format: ProbeFormat;
}

export async function createTestWorkspace() {
  const path = join(tmpdir(), `autoencoder-tests-${randomUUID()}`);
  await mkdir(path, { recursive: true });
  return path;
}

export async function removeTestWorkspace(path: string) {
  await rm(path, { recursive: true, force: true });
}

export async function generateTinyVideo(outputPath: string) {
  await runProcess("ffmpeg", [
    "-hide_banner",
    "-loglevel",
    "error",
    "-y",
    "-f",
    "lavfi",
    "-i",
    "testsrc=size=160x90:rate=12:duration=1",
    "-f",
    "lavfi",
    "-i",
    "sine=frequency=1000:sample_rate=48000:duration=1",
    "-c:v",
    "libx264",
    "-preset",
    "ultrafast",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-shortest",
    outputPath,
  ]);
}

export async function probeMedia(filePath: string): Promise<ProbeResult> {
  const { stdout } = await runProcess("ffprobe", [
    "-v",
    "error",
    "-show_streams",
    "-show_format",
    "-of",
    "json",
    filePath,
  ]);

  return JSON.parse(stdout) as ProbeResult;
}

export async function runProcess(cmd: string, args: string[]) {
  return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(cmd, args);
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });
    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      reject(new Error(`${cmd} exited with code ${code}:\n${stderr}`));
    });
  });
}
