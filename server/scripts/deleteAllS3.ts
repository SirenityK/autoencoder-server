import { s3 } from "@server/env";

async function deleteAllS3Objects() {
  const listObjectsResponse = await s3.listObjectsV2({
    Bucket: process.env.BUCKET_NAME,
  });

  const objects = listObjectsResponse.Contents || [];
  if (objects.length === 0) {
    console.info("No objects found in the bucket.");
    return 0;
  }

  const deleteParams = {
    Bucket: process.env.BUCKET_NAME,
    Delete: {
      Objects: objects.map((obj) => ({ Key: obj.Key })),
      Quiet: true,
    },
  };

  await s3.deleteObjects(deleteParams);
  return objects.length;
}

const length = await deleteAllS3Objects();

console.info(`Deleted ${length} objects from the bucket.`);
