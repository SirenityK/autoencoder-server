import { s3 } from "@server/env";

async function listS3Objects() {
  const listObjectsResponse = await s3.listObjectsV2({
    Bucket: process.env.BUCKET_NAME,
  });

  return listObjectsResponse.Contents || [];
}

const objects = await listS3Objects();

console.info(`Found ${objects.length} objects in the bucket.`);
objects
  .toSorted((a, b) => (b.Size || 0) - (a.Size || 0))
  .forEach((obj) => {
    const size = obj.Size
      ? `${(obj.Size / 1024 / 1024).toFixed(2)} MB`
      : "size unknown";
    console.info(`- ${obj.Key} (${size})`);
  });
