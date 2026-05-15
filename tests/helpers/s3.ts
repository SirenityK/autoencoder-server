import { DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { presignUrl, s3, serverEnv } from "@server/env";

export async function canReachConfiguredS3() {
  try {
    await fetch(serverEnv.BUCKET_ENDPOINT, {
      signal: AbortSignal.timeout(2_000),
    });
    return true;
  } catch {
    return false;
  }
}

export async function uploadWithPresignedUrl({
  objectKey,
  file,
  type,
}: {
  objectKey: string;
  file: Blob;
  type: string;
}) {
  const url = await presignUrl({
    objectKey,
    method: "PUT",
    type,
    expiresIn: 60,
  });

  const response = await fetch(url, {
    method: "PUT",
    body: file,
    headers: {
      "content-type": type,
    },
  });

  if (!response.ok) {
    throw new Error(`Presigned PUT failed with ${response.status}`);
  }
}

export async function downloadWithPresignedUrl(objectKey: string) {
  const url = await presignUrl({
    objectKey,
    method: "GET",
    type: "application/octet-stream",
    expiresIn: 60,
  });

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Presigned GET failed with ${response.status}`);
  }

  return new Uint8Array(await response.arrayBuffer());
}

export async function objectExists(objectKey: string) {
  try {
    await s3.send(
      new HeadObjectCommand({
        Bucket: serverEnv.BUCKET_NAME,
        Key: objectKey,
      }),
    );
    return true;
  } catch {
    return false;
  }
}

export async function deleteObjects(objectKeys: string[]) {
  await Promise.all(
    objectKeys.map((objectKey) =>
      s3
        .send(
          new DeleteObjectCommand({
            Bucket: serverEnv.BUCKET_NAME,
            Key: objectKey,
          }),
        )
        .catch(() => {}),
    ),
  );
}
