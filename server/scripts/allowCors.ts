import { PutBucketCorsCommand } from "@aws-sdk/client-s3";
import { s3, serverEnv } from "@server/env";

async function PutCorsConfiguration() {
  await s3.send(
    new PutBucketCorsCommand({
      Bucket: serverEnv.BUCKET_NAME,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedOrigins: serverEnv.ALLOWED_ORIGINS,
            AllowedMethods: ["GET", "POST", "PUT", "DELETE"],
            AllowedHeaders: ["*"],
            ExposeHeaders: ["ETag"],
            MaxAgeSeconds: 3000,
          },
        ],
      },
    }),
  );
}

await PutCorsConfiguration();
console.info(
  "CORS configuration applied successfully to",
  serverEnv.ALLOWED_ORIGINS,
);
