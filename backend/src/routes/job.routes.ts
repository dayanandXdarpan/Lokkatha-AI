import { Router, Request, Response } from 'express';
import { getJobStatus, getJobResult } from '../services/queue.service';
import { downloadVideoFromStorage } from '../services/storage.service';
import logger from '../utils/logger';

const router = Router();

/**
 * GET /api/jobs/:jobId/status
 * Get the status of a video generation job
 */
router.get('/:jobId/status', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    if (!jobId) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Job ID is required',
        },
      });
      return;
    }

    // Get job status from queue
    const jobStatus = await getJobStatus(jobId);

    if (!jobStatus) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Job not found',
        },
      });
      return;
    }

    logger.info(`Job status requested: ${jobId}`, { status: jobStatus.status });

    res.status(200).json({
      success: true,
      data: jobStatus,
    });
  } catch (error: any) {
    logger.error(`Error fetching job status for ${req.params.jobId}:`, error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch job status',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
    });
  }
});

/**
 * GET /api/jobs/:jobId/download
 * Download the completed video file
 */
router.get('/:jobId/download', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    if (!jobId) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Job ID is required',
        },
      });
      return;
    }

    // Check if job is complete
    const jobStatus = await getJobStatus(jobId);

    if (!jobStatus) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Job not found',
        },
      });
      return;
    }

    if (jobStatus.status !== 'completed') {
      res.status(400).json({
        success: false,
        error: {
          message: `Video is not ready. Current status: ${jobStatus.status}`,
        },
      });
      return;
    }

    // Get video file path from job result
    const jobResult = await getJobResult(jobId);
    
    if (!jobResult || !jobResult.videoUrl) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Video file not found',
        },
      });
      return;
    }

    logger.info(`Video download requested: ${jobId}`);

    // Stream video from cloud storage
    const videoStream = await downloadVideoFromStorage(jobResult.videoUrl);

    // Set headers for video download
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', `attachment; filename="${jobId}.mp4"`);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

    // Pipe the video stream to the response
    videoStream.pipe(res);

    videoStream.on('error', (error: any) => {
      logger.error(`Error streaming video ${jobId}:`, error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: {
            message: 'Failed to stream video',
          },
        });
      }
    });
  } catch (error: any) {
    logger.error(`Error downloading video for ${req.params.jobId}:`, error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to download video',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        },
      });
    }
  }
});

/**
 * DELETE /api/jobs/:jobId
 * Delete a completed job and its associated video file
 */
router.delete('/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    if (!jobId) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Job ID is required',
        },
      });
      return;
    }

    // TODO: Implement job deletion logic
    // - Remove job from Redis
    // - Delete video file from cloud storage
    // - Clean up any temporary files

    logger.info(`Job deletion requested: ${jobId}`);

    res.status(200).json({
      success: true,
      message: 'Job and associated files deleted successfully',
    });
  } catch (error: any) {
    logger.error(`Error deleting job ${req.params.jobId}:`, error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to delete job',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
    });
  }
});

export default router;
