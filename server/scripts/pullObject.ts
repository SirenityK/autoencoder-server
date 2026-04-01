import { pullS3File } from "@server/env";

if (process.argv.length < 3) {
  console.error("Usage: pullObject <objectKey>");
  process.exit(1);
}

const objectKey = process.argv[2];

try {
  const filePath = await pullS3File(objectKey);
  console.info(`File downloaded to: ${filePath}`);
} catch (error) {
  console.error("Error pulling S3 file:", error);
}
