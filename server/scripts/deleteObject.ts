import { deleteS3File } from "@server/env";

if (process.argv.length < 3) {
  console.error("Usage: deleteObject <objectKey>");
  process.exit(1);
}

const objectKey = process.argv[2];

try {
  await deleteS3File(objectKey);
  console.info(`Successfully deleted object: ${objectKey}`);
} catch (error) {
  console.error("Error deleting S3 file:", error);
}
