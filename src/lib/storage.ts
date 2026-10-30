import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const BUCKET_NAME = process.env.NEON_OBJECT_STORAGE_BUCKET || "assets";

let _s3Client: S3Client | null = null;

export function getS3Client(): S3Client {
  if (!_s3Client) {
    _s3Client = new S3Client({
      region: process.env.AWS_REGION || "us-east-1",
      endpoint: process.env.AWS_ENDPOINT_URL_S3,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
      forcePathStyle: true,
    });
  }
  return _s3Client;
}

/**
 * Upload an attachment into Neon Object Storage
 */
export async function uploadObject(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<{ key: string; bucket: string }> {
  const client = getS3Client();
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType,
  });

  await client.send(command);
  return { key, bucket: BUCKET_NAME };
}

/**
 * Generate a secure presigned download/view URL for an object
 */
export async function getPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
  const client = getS3Client();
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(client, command, { expiresIn });
}

/**
 * Delete an object from storage
 */
export async function deleteObject(key: string): Promise<void> {
  const client = getS3Client();
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await client.send(command);
}

/**
 * Health check for storage
 */
export async function checkStorageConnection(): Promise<boolean> {
  try {
    const client = getS3Client();
    const command = new HeadBucketCommand({ Bucket: BUCKET_NAME });
    await client.send(command);
    return true;
  } catch (err) {
    console.error("Storage connection check failed:", err);
    return false;
  }
}
