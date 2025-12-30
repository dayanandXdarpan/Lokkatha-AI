import { Storage } from '@google-cloud/storage';
import { Readable } from 'stream';
import path from 'path';
import logger from '../utils/logger';

// Initialize Google Cloud Storage client
const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

const bucketName = process.env.GCS_BUCKET_NAME || 'lokkatha-videos';

/**
 * Upload a video file to Google Cloud Storage
 */
export async function uploadVideoToStorage(
  localFilePath: string,
  jobId: string
): Promise<string> {
  try {
    const bucket = storage.bucket(bucketName);
    const fileName = `videos/${jobId}/${path.basename(localFilePath)}`;

    await bucket.upload(localFilePath, {
      destination: fileName,
      metadata: {
        contentType: 'video/mp4',
        cacheControl: 'public, max-age=31536000', // Cache for 1 year
      },
    });

    // Make the file publicly accessible (optional, depending on requirements)
    // await file.makePublic();

    const publicUrl = `gs://${bucketName}/${fileName}`;
    logger.info(`Video uploaded to storage: ${publicUrl}`);

    return publicUrl;
  } catch (error) {
    logger.error(`Failed to upload video to storage:`, error);
    throw error;
  }
}

/**
 * Download a video file from Google Cloud Storage
 */
export async function downloadVideoFromStorage(videoUrl: string): Promise<Readable> {
  try {
    // Parse the gs:// URL
    const urlParts = videoUrl.replace('gs://', '').split('/');
    const bucketName = urlParts[0];
    const fileName = urlParts.slice(1).join('/');

    const bucket = storage.bucket(bucketName);
    const file = bucket.file(fileName);

    // Check if file exists
    const [exists] = await file.exists();
    if (!exists) {
      throw new Error(`File not found: ${videoUrl}`);
    }

    // Create a read stream
    const stream = file.createReadStream();

    logger.info(`Streaming video from storage: ${videoUrl}`);
    return stream;
  } catch (error) {
    logger.error(`Failed to download video from storage:`, error);
    throw error;
  }
}

/**
 * Delete a video file from Google Cloud Storage
 */
export async function deleteVideoFromStorage(videoUrl: string): Promise<void> {
  try {
    // Parse the gs:// URL
    const urlParts = videoUrl.replace('gs://', '').split('/');
    const bucketName = urlParts[0];
    const fileName = urlParts.slice(1).join('/');

    const bucket = storage.bucket(bucketName);
    const file = bucket.file(fileName);

    await file.delete();
    logger.info(`Video deleted from storage: ${videoUrl}`);
  } catch (error) {
    logger.error(`Failed to delete video from storage:`, error);
    throw error;
  }
}

/**
 * Upload audio file to storage
 */
export async function uploadAudioToStorage(
  localFilePath: string,
  jobId: string
): Promise<string> {
  try {
    const bucket = storage.bucket(bucketName);
    const fileName = `audio/${jobId}/${path.basename(localFilePath)}`;

    await bucket.upload(localFilePath, {
      destination: fileName,
      metadata: {
        contentType: 'audio/mpeg',
      },
    });

    const publicUrl = `gs://${bucketName}/${fileName}`;
    logger.info(`Audio uploaded to storage: ${publicUrl}`);

    return publicUrl;
  } catch (error) {
    logger.error(`Failed to upload audio to storage:`, error);
    throw error;
  }
}

/**
 * Get file metadata from storage
 */
export async function getFileMetadata(videoUrl: string): Promise<any> {
  try {
    const urlParts = videoUrl.replace('gs://', '').split('/');
    const bucketName = urlParts[0];
    const fileName = urlParts.slice(1).join('/');

    const bucket = storage.bucket(bucketName);
    const file = bucket.file(fileName);

    const [metadata] = await file.getMetadata();
    return {
      size: metadata.size,
      contentType: metadata.contentType,
      created: metadata.timeCreated,
      updated: metadata.updated,
    };
  } catch (error) {
    logger.error(`Failed to get file metadata:`, error);
    throw error;
  }
}
