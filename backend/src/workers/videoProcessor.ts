import dotenv from 'dotenv';
import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import path from 'path';
import { promises as fs } from 'fs';
import { generateScript } from '../services/gemini.service';
import { generateSpeechForScenes } from '../services/tts.service';
import { generateImagesForScenes } from '../services/image.service';
import { createVideo, createSubtitleFile, getVideoMetadata } from '../services/ffmpeg.service';
import { uploadVideoToStorage } from '../services/storage.service';
import logger from '../utils/logger';

// Load environment variables
dotenv.config();

// Verify critical environment variables
if (!process.env.GEMINI_API_KEY) {
  logger.error('GEMINI_API_KEY is not set in environment variables!');
} else {
  logger.info(`Gemini API Key loaded: ${process.env.GEMINI_API_KEY.substring(0, 20)}...`);
}

// Redis connection
const redisConnection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
});

// Job data interface
interface VideoJobData {
  jobId: string;
  topic: string;
  gradeLevel: string;
  language: string;
  duration: number;
  useImages: boolean;
  includeSubtitles: boolean;
  createdAt: string;
  currentStep?: string;
}

/**
 * Video processing worker
 * Orchestrates the entire video creation pipeline
 */
export const videoWorker = new Worker(
  'video-processing',
  async (job: Job<VideoJobData>) => {
    const { jobId, topic, gradeLevel, language, duration, useImages, includeSubtitles } = job.data;

    logger.info(`Starting video processing for job ${jobId}`, { topic, gradeLevel, language });

    try {
      // Create temporary working directory
      const workDir = path.join(process.env.VIDEO_OUTPUT_DIR || './temp/videos', jobId);
      await fs.mkdir(workDir, { recursive: true });

      // Step 1: Generate script (15%)
      await job.updateProgress(5);
      job.data.currentStep = 'Generating script...';
      logger.info(`[${jobId}] Generating script...`);

      const script = await generateScript({
        topic,
        gradeLevel,
        language,
        duration,
      });

      await job.updateProgress(15);

      // Step 2: Generate images (30%)
      job.data.currentStep = 'Creating visuals...';
      logger.info(`[${jobId}] Generating images for ${script.scenes.length} scenes...`);

      const imageDir = path.join(workDir, 'images');
      await fs.mkdir(imageDir, { recursive: true });

      const imageFiles = await generateImagesForScenes(
        script.scenes.map((scene) => ({
          visualDescription: scene.visualDescription,
          sceneNumber: scene.sceneNumber,
        })),
        imageDir,
        useImages
      );

      await job.updateProgress(45);

      // Step 3: Generate audio (25%)
      job.data.currentStep = 'Generating voice narration...';
      logger.info(`[${jobId}] Generating audio...`);

      const audioDir = path.join(workDir, 'audio');
      await fs.mkdir(audioDir, { recursive: true });

      const audioFiles = await generateSpeechForScenes(
        script.scenes.map((scene) => ({
          narration: scene.narration,
          sceneNumber: scene.sceneNumber,
        })),
        language,
        audioDir
      );

      // Merge audio files into one
      const finalAudioPath = path.join(audioDir, 'final_narration.mp3');
      await mergeAudioFiles(audioFiles, finalAudioPath);

      await job.updateProgress(70);

      // Step 4: Create subtitle file (5%)
      let subtitlePath: string | undefined;
      if (includeSubtitles) {
        job.data.currentStep = 'Adding subtitles...';
        logger.info(`[${jobId}] Creating subtitles...`);

        subtitlePath = path.join(workDir, 'subtitles.srt');
        await createSubtitleFile(script.scenes, subtitlePath);
      }

      await job.updateProgress(75);

      // Step 5: Assemble video with FFmpeg (15%)
      job.data.currentStep = 'Assembling video...';
      logger.info(`[${jobId}] Creating video with FFmpeg...`);

      const videoPath = path.join(workDir, `${jobId}.mp4`);
      const resolution = (process.env.VIDEO_RESOLUTION as '480p' | '720p' | '1080p') || '480p';

      await createVideo({
        imageFiles,
        audioFile: finalAudioPath,
        subtitleFile: subtitlePath,
        outputPath: videoPath,
        resolution,
        crf: parseInt(process.env.VIDEO_CRF || '23'),
        preset: process.env.VIDEO_PRESET || 'veryfast',
      });

      await job.updateProgress(90);

      // Step 6: Upload to cloud storage (5%) - Optional
      job.data.currentStep = 'Uploading video...';
      logger.info(`[${jobId}] Uploading video to cloud storage...`);

      let videoUrl: string;
      try {
        videoUrl = await uploadVideoToStorage(videoPath, jobId);
        logger.info(`[${jobId}] Video uploaded successfully to cloud storage`);
      } catch (uploadError: any) {
        // If cloud upload fails, use local file path as fallback
        logger.warn(`[${jobId}] Cloud upload failed, using local file path`, { error: uploadError.message });
        videoUrl = `/api/jobs/${jobId}/video`; // Use local endpoint
      }

      // Get video metadata
      const metadata = await getVideoMetadata(videoPath);

      await job.updateProgress(95);

      // Step 7: Cleanup temporary files
      logger.info(`[${jobId}] Cleaning up temporary files...`);
      await cleanupWorkDir(workDir);

      await job.updateProgress(100);

      // Return job result
      logger.info(`[${jobId}] Video processing completed successfully`);
      return {
        videoUrl,
        duration: metadata.duration,
        fileSize: metadata.fileSize,
        title: script.title,
        scenes: script.scenes.length,
      };
    } catch (error: any) {
      // Log only the error message, not the full error object to avoid circular references
      const errorMessage = error.message || 'Unknown error';
      const errorStack = error.stack ? error.stack.split('\n').slice(0, 3).join('\n') : '';
      logger.error(`[${jobId}] Video processing failed`, { 
        message: errorMessage,
        stack: errorStack
      });
      throw new Error(`Video processing failed: ${errorMessage}`);
    }
  },
  {
    connection: redisConnection,
    concurrency: parseInt(process.env.JOB_CONCURRENCY || '5'),
    limiter: {
      max: 10, // Maximum 10 jobs
      duration: 60000, // Per 60 seconds
    },
  }
);

/**
 * Merge multiple audio files into one
 * This is a simplified version - in production, you'd use FFmpeg for this
 */
async function mergeAudioFiles(audioFiles: string[], outputPath: string): Promise<void> {
  try {
    if (audioFiles.length === 1) {
      // If only one file, just copy it
      await fs.copyFile(audioFiles[0], outputPath);
    } else {
      // TODO: Implement proper audio concatenation using FFmpeg
      // For now, just use the first file
      logger.warn('Audio merging not fully implemented, using first audio file');
      await fs.copyFile(audioFiles[0], outputPath);
    }
  } catch (error) {
    logger.error('Failed to merge audio files:', error);
    throw error;
  }
}

/**
 * Clean up temporary working directory
 */
async function cleanupWorkDir(workDir: string): Promise<void> {
  try {
    await fs.rm(workDir, { recursive: true, force: true });
    logger.info(`Cleaned up working directory: ${workDir}`);
  } catch (error) {
    logger.warn(`Failed to cleanup working directory ${workDir}:`, error);
    // Don't throw - cleanup failure shouldn't fail the job
  }
}

// Worker event handlers
videoWorker.on('completed', (job) => {
  logger.info(`Job ${job.id} completed successfully`);
});

videoWorker.on('failed', (job, err) => {
  logger.error(`Job ${job?.id} failed:`, err);
});

videoWorker.on('error', (err) => {
  logger.error('Worker error:', err);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Shutting down video worker...');
  await videoWorker.close();
  await redisConnection.quit();
  process.exit(0);
});

logger.info('Video processing worker started');
