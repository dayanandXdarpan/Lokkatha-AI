import { Router, Request, Response } from 'express';
import { createStoryLimiter } from '../middleware/rateLimiter';
import {
  getVideoMetadata,
  toggleVideoPublish,
  incrementVideoViews,
  toggleVideoLike,
  incrementShareCount,
  getExploreVideos,
  getUserVideos,
  deleteVideoMetadata,
} from '../services/video.service';
import logger from '../utils/logger';

const router = Router();

/**
 * GET /api/videos/explore
 * Get public videos for Explore page
 */
router.get('/explore', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 12;
    
    const filters = {
      search: req.query.search as string,
      gradeLevel: req.query.gradeLevel as string,
      language: req.query.language as string,
      subject: req.query.subject as string,
      quality: req.query.quality as string,
    };
    
    const sort = {
      sortBy: (req.query.sortBy as 'newest' | 'popular' | 'views' | 'likes' | 'duration') || 'newest',
      order: (req.query.order as 'asc' | 'desc') || 'desc',
    };
    
    const result = await getExploreVideos(page, pageSize, filters, sort);
    
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error('Error fetching explore videos:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch explore videos',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
    });
  }
});

/**
 * GET /api/videos/:jobId
 * Get video metadata by jobId
 */
router.get('/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const metadata = await getVideoMetadata(jobId);
    
    if (!metadata) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Video not found',
        },
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      data: metadata,
    });
  } catch (error: any) {
    logger.error(`Error fetching video metadata for ${req.params.jobId}:`, error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch video metadata',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
    });
  }
});

/**
 * PATCH /api/videos/:jobId/publish
 * Toggle video publish status
 */
router.patch('/:jobId/publish', createStoryLimiter, async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const { isPublic } = req.body;
    
    if (typeof isPublic !== 'boolean') {
      res.status(400).json({
        success: false,
        error: {
          message: 'isPublic must be a boolean value',
        },
      });
      return;
    }
    
    const metadata = await toggleVideoPublish(jobId, isPublic);
    
    if (!metadata) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Video not found',
        },
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      data: metadata,
      message: isPublic ? 'Video published to Explore' : 'Video removed from Explore',
    });
  } catch (error: any) {
    logger.error(`Error toggling publish status for ${req.params.jobId}:`, error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to toggle publish status',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
    });
  }
});

/**
 * POST /api/videos/:jobId/view
 * Increment video view count
 */
router.post('/:jobId/view', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const views = await incrementVideoViews(jobId);
    
    res.status(200).json({
      success: true,
      data: { views },
    });
  } catch (error: any) {
    logger.error(`Error incrementing views for ${req.params.jobId}:`, error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to increment view count',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
    });
  }
});

/**
 * POST /api/videos/:jobId/like
 * Toggle video like
 */
router.post('/:jobId/like', createStoryLimiter, async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      res.status(400).json({
        success: false,
        error: {
          message: 'userId is required',
        },
      });
      return;
    }
    
    const result = await toggleVideoLike(jobId, userId);
    
    res.status(200).json({
      success: true,
      data: result,
      message: result.liked ? 'Video liked' : 'Video unliked',
    });
  } catch (error: any) {
    logger.error(`Error toggling like for ${req.params.jobId}:`, error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to toggle like',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
    });
  }
});

/**
 * POST /api/videos/:jobId/share
 * Increment share count
 */
router.post('/:jobId/share', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const shareCount = await incrementShareCount(jobId);
    
    res.status(200).json({
      success: true,
      data: { shareCount },
    });
  } catch (error: any) {
    logger.error(`Error incrementing share count for ${req.params.jobId}:`, error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to increment share count',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
    });
  }
});

/**
 * GET /api/videos/user/:userId
 * Get user's videos
 */
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const videos = await getUserVideos(userId);
    
    res.status(200).json({
      success: true,
      data: { videos, total: videos.length },
    });
  } catch (error: any) {
    logger.error(`Error fetching videos for user ${req.params.userId}:`, error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch user videos',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
    });
  }
});

/**
 * DELETE /api/videos/:jobId
 * Delete video metadata
 */
router.delete('/:jobId', createStoryLimiter, async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    await deleteVideoMetadata(jobId);
    
    res.status(200).json({
      success: true,
      message: 'Video metadata deleted successfully',
    });
  } catch (error: any) {
    logger.error(`Error deleting video metadata for ${req.params.jobId}:`, error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to delete video metadata',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
    });
  }
});

export default router;
