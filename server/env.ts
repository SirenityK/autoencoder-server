import { createReadStream, createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { GetObjectCommand, PutObjectCommand, S3 } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { parseEnv } from "@lib/utils/env";
import * as v from "valibot";

const serverEnvSchema = v.object({
  BUCKET_KEY_ID: v.string(),
  BUCKET_SECRET_KEY: v.string(),
  BUCKET_REGION: v.string(),
  BUCKET_NAME: v.string(),
  BUCKET_ENDPOINT: v.pipe(v.string(), v.url()),

  REDIS_HOST: v.string(),

  ALLOWED_ORIGINS: v.pipe(
    v.string(),
    v.transform((input) => input.split(",").map((s) => s.trim())),
    v.array(v.string()),
  ),
});

export const serverEnv = parseEnv(
  serverEnvSchema,
  {
    BUCKET_KEY_ID: import.meta.env.BUCKET_KEY_ID,
    BUCKET_SECRET_KEY: import.meta.env.BUCKET_SECRET_KEY,
    BUCKET_REGION: import.meta.env.BUCKET_REGION,
    BUCKET_NAME: import.meta.env.BUCKET_NAME,
    BUCKET_ENDPOINT: import.meta.env.BUCKET_ENDPOINT,

    REDIS_HOST: import.meta.env.REDIS_HOST,
    ALLOWED_ORIGINS: import.meta.env.ALLOWED_ORIGINS,
  },
  "server",
);

export const s3 = new S3({
  region: serverEnv.BUCKET_REGION,
  endpoint: serverEnv.BUCKET_ENDPOINT,
  credentials: {
    accessKeyId: serverEnv.BUCKET_KEY_ID,
    secretAccessKey: serverEnv.BUCKET_SECRET_KEY,
  },
  forcePathStyle: true,
  requestChecksumCalculation: "WHEN_REQUIRED",
});

export async function presignUrl({
  objectKey,
  type,
  method,
  expiresIn = 3600,
}: {
  objectKey: string;
  type: string;
  method: "GET" | "PUT";
  expiresIn?: number;
}): Promise<string> {
  switch (method) {
    case "GET": {
      const command = new GetObjectCommand({
        Bucket: serverEnv.BUCKET_NAME,
        Key: objectKey,
      });
      return await getSignedUrl(s3, command, { expiresIn });
    }
    case "PUT": {
      const command = new PutObjectCommand({
        Bucket: serverEnv.BUCKET_NAME,
        Key: objectKey,
        ContentType: type,
      });
      return await getSignedUrl(s3, command, { expiresIn });
    }
  }
}

export async function pullS3File(objectKey: string): Promise<string> {
  const outputPath = new URL(objectKey, `file://${process.cwd()}/`).pathname;

  const command = new GetObjectCommand({
    Bucket: serverEnv.BUCKET_NAME,
    Key: objectKey,
  });

  const response = await s3.send(command);
  const writeStream = createWriteStream(outputPath);

  if (!response.Body) {
    throw new Error("Failed to get object stream from S3");
  }

  await pipeline(response.Body as NodeJS.ReadableStream, writeStream);
  console.info(`Pulled ${objectKey} from S3 to ${outputPath}`);

  return outputPath;
}

export async function uploadToS3(
  objectKey: string,
  filePath: string,
  type: string,
) {
  // const { size } = await stat(filePath);

  const fileStream = createReadStream(filePath);

  // This shit is so fucking stupid, contentLength is being dropped and we cant upload, fallback to file chunking in the application layer
  // const command = new PutObjectCommand({
  //   Bucket: serverEnv.BUCKET_NAME,
  //   Key: objectKey,
  //   Body: fileStream,
  //   ContentType: type,
  //   ContentLength: size,
  // });

  // await s3.send(command);

  const upload = new Upload({
    client: s3,
    params: {
      Bucket: serverEnv.BUCKET_NAME,
      Key: objectKey,
      Body: fileStream,
      ContentType: type,
    },
    partSize: 1024 ** 2 * 512,
  });

  await upload.done();
}

export async function deleteS3File(objectKey: string) {
  await s3.deleteObject({
    Bucket: serverEnv.BUCKET_NAME,
    Key: objectKey,
  });
  console.info(`Deleted ${objectKey} from S3`);
}
