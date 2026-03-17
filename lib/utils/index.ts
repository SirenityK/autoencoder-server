import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { LocalStorageData } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function uploadFileToPresignedUrl(
  file: File,
  presignedUrl: string,
): Promise<Response> {
  return await fetch(presignedUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type,
    },
  });
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function pollUntilDone<T>(
  fn: () => Promise<T>,
  isDone: (result: T) => boolean,
  interval = 2000,
): Promise<T> {
  while (true) {
    const result = await fn();
    if (isDone(result)) {
      return result;
    }
    await sleep(interval);
  }
}

export function storeToLocalStorage(
  key: keyof LocalStorageData,
  value: LocalStorageData[keyof LocalStorageData],
): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getFromLocalStorage(
  key: keyof LocalStorageData,
): LocalStorageData[keyof LocalStorageData] | null {
  const item = localStorage.getItem(key);
  return item
    ? (JSON.parse(item) as LocalStorageData[keyof LocalStorageData])
    : null;
}
