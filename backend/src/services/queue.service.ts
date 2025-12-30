import { Queue } from 'bullmq';
import Redis from 'ioredis';
import logger from '../utils/logger';

// Redis connection configuration
const redisConnection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
});

// Create video processing queue
export const videoQueue = new Queue('video-processing', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: parseInt(process.env.MAX_JOB_RETRIES || '3'),
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      count: 100, // Keep last 100 completed jobs
      age: 24 * 3600, // Keep completed jobs for 24 hours
    },
    removeOnFail: {
      count: 50, // Keep last 50 failed jobs
    },
  },
});

/**
 * Job status interface
 */
export interface JobStatus {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  currentStep?: string;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

/**
 * Job result interface
 */
export interface JobResult {
  videoUrl: string;
  duration: number;
  fileSize: number;
  thumbnailUrl?: string;
  transcriptUrl?: string;
}

/**
 * Add a video processing job to the queue
 */
export async function addVideoJob(jobId: string, jobData: any): Promise<void> {
  try {
    await videoQueue.add(
      'generate-video',
      jobData,
      {
        jobId
      }
    );
    logger.info(`Job ${jobId} added to queue`);
  } catch (error) {
    logger.error(`Failed to add job ${jobId} to queue:`, error);
    throw error;
  }
}

/**
 * Get the status of a job
 */
export async function getJobStatus(jobId: string): Promise<JobStatus | null> {
  try {
    const job = await videoQueue.getJob(jobId);
    
    if (!job) {
      return null;
    }

    const state = await job.getState();
    const progress = job.progress as number || 0;
    
    let status: JobStatus['status'];
    switch (state) {
      case 'completed':
        status = 'completed';
        break;
      case 'failed':
        status = 'failed';
        break;
      case 'active':
        status = 'processing';
        break;
      default:
        status = 'queued';
    }

    return {
      jobId: job.id!,
      status,
      progress,
      currentStep: job.data.currentStep,
      error: job.failedReason,
      createdAt: new Date(job.timestamp).toISOString(),
      completedAt: job.finishedOn ? new Date(job.finishedOn).toISOString() : undefined,
    };
  } catch (error) {
    logger.error(`Failed to get status for job ${jobId}:`, error);
    throw error;
  }
}

/**
 * Get the result of a completed job
 */
export async function getJobResult(jobId: string): Promise<JobResult | null> {
  try {
    const job = await videoQueue.getJob(jobId);
    
    if (!job) {
      return null;
    }

    const state = await job.getState();
    if (state !== 'completed') {
      return null;
    }

    return job.returnvalue as JobResult;
  } catch (error) {
    logger.error(`Failed to get result for job ${jobId}:`, error);
    throw error;
  }
}

/**
 * Delete a job from the queue
 */
export async function deleteJob(jobId: string): Promise<void> {
  try {
    const job = await videoQueue.getJob(jobId);
    if (job) {
      await job.remove();
      logger.info(`Job ${jobId} removed from queue`);
    }
  } catch (error) {
    logger.error(`Failed to delete job ${jobId}:`, error);
    throw error;
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Closing video queue...');
  await videoQueue.close();
  await redisConnection.quit();
});
