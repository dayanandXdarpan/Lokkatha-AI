import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { createStoryLimiter } from '../middleware/rateLimiter';
import { addVideoJob } from '../services/queue.service';
import logger from '../utils/logger';

const router = Router();

/**
 * Interface for story creation request
 */
interface CreateStoryRequest {
  topic: string;
  gradeLevel: string;
  language: string;
  duration?: number;
  useImages?: boolean;
  includeSubtitles?: boolean;
}

/**
 * POST /api/create/story
 * Creates a new story video generation job
 */
router.post('/story', createStoryLimiter, async (req: Request, res: Response) => {
  try {
    const {
      topic,
      gradeLevel,
      language,
      duration = 300, // Default 5 minutes
      useImages = true,
      includeSubtitles = true,
    }: CreateStoryRequest = req.body;

    // Validate required fields
    if (!topic || !gradeLevel || !language) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Missing required fields: topic, gradeLevel, and language are required',
        },
      });
      return;
    }

    // Validate duration
    const maxDuration = parseInt(process.env.MAX_VIDEO_DURATION_SECONDS || '600');
    if (duration > maxDuration) {
      res.status(400).json({
        success: false,
        error: {
          message: `Duration exceeds maximum allowed value of ${maxDuration} seconds`,
        },
      });
      return;
    }

    // Generate unique job ID
    const jobId = uuidv4();

    // Create job data
    const jobData = {
      jobId,
      topic,
      gradeLevel,
      language,
      duration,
      useImages,
      includeSubtitles,
      createdAt: new Date().toISOString(),
    };

    // Add job to queue
    await addVideoJob(jobId, jobData);

    logger.info(`Created video generation job: ${jobId}`, { topic, gradeLevel, language });

    // Return job ID immediately
    res.status(202).json({
      success: true,
      data: {
        jobId,
        status: 'queued',
        message: 'Video generation job has been queued',
        estimatedTime: '5-10 minutes',
      },
    });
  } catch (error: any) {
    logger.error('Error creating story job:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to create video generation job',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
    });
  }
});

export default router;
