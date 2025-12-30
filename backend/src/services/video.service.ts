import Redis from 'ioredis';
import logger from '../utils/logger';
import type { VideoMetadata, VideoFilter, VideoSort, ExploreVideosResponse } from '../models/video.model';

const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

redisClient.on('error', (err: Error) => logger.error('Redis Client Error:', err));
redisClient.on('connect', () => logger.info('Redis connected for video service'));

const VIDEO_KEY_PREFIX = 'video:metadata:';
const PUBLIC_VIDEOS_SET = 'videos:public';
const USER_VIDEOS_SET_PREFIX = 'videos:user:';
const VIDEO_VIEWS_KEY_PREFIX = 'video:views:';
const VIDEO_LIKES_KEY_PREFIX = 'video:likes:';

/**
 * Save video metadata
 */
export async function saveVideoMetadata(metadata: VideoMetadata): Promise<void> {
  try {
    const key = `${VIDEO_KEY_PREFIX}${metadata.jobId}`;
    await redisClient.set(key, JSON.stringify(metadata));
    
    // Add to user's videos set
    if (metadata.createdBy) {
      const userSetKey = `${USER_VIDEOS_SET_PREFIX}${metadata.createdBy}`;
      await redisClient.sadd(userSetKey, metadata.jobId);
    }
    
    // If public, add to public videos sorted set (by createdAt timestamp)
    if (metadata.isPublic) {
      const timestamp = new Date(metadata.createdAt).getTime();
      await redisClient.zadd(PUBLIC_VIDEOS_SET, timestamp, metadata.jobId);
    }
    
    logger.info(`Video metadata saved: ${metadata.jobId}`);
  } catch (error) {
    logger.error('Error saving video metadata:', error);
    throw error;
  }
}

/**
 * Get video metadata by jobId
 */
export async function getVideoMetadata(jobId: string): Promise<VideoMetadata | null> {
  try {
    const key = `${VIDEO_KEY_PREFIX}${jobId}`;
    const data = await redisClient.get(key);
    
    if (!data) {
      return null;
    }
    
    return JSON.parse(data) as VideoMetadata;
  } catch (error) {
    logger.error(`Error getting video metadata for ${jobId}:`, error);
    return null;
  }
}

/**
 * Publish or unpublish a video
 */
export async function toggleVideoPublish(jobId: string, isPublic: boolean): Promise<VideoMetadata | null> {
  try {
    const metadata = await getVideoMetadata(jobId);
    
    if (!metadata) {
      throw new Error('Video not found');
    }
    
    metadata.isPublic = isPublic;
    metadata.publishedAt = isPublic ? new Date().toISOString() : undefined;
    
    // Update metadata
    const key = `${VIDEO_KEY_PREFIX}${jobId}`;
    await redisClient.set(key, JSON.stringify(metadata));
    
    // Add/remove from public videos set
    if (isPublic) {
      const timestamp = new Date(metadata.createdAt).getTime();
      await redisClient.zadd(PUBLIC_VIDEOS_SET, timestamp, jobId);
      logger.info(`Video published to Explore: ${jobId}`);
    } else {
      await redisClient.zrem(PUBLIC_VIDEOS_SET, jobId);
      logger.info(`Video unpublished from Explore: ${jobId}`);
    }
    
    return metadata;
  } catch (error) {
    logger.error(`Error toggling publish status for ${jobId}:`, error);
    throw error;
  }
}

/**
 * Increment video views
 */
export async function incrementVideoViews(jobId: string): Promise<number> {
  try {
    const viewsKey = `${VIDEO_VIEWS_KEY_PREFIX}${jobId}`;
    const newViews = await redisClient.incr(viewsKey);
    
    // Update metadata
    const metadata = await getVideoMetadata(jobId);
    if (metadata) {
      metadata.views = newViews;
      const key = `${VIDEO_KEY_PREFIX}${jobId}`;
      await redisClient.set(key, JSON.stringify(metadata));
    }
    
    return newViews;
  } catch (error) {
    logger.error(`Error incrementing views for ${jobId}:`, error);
    return 0;
  }
}

/**
 * Toggle video like
 */
export async function toggleVideoLike(jobId: string, userId: string): Promise<{ liked: boolean; totalLikes: number }> {
  try {
    const likesKey = `${VIDEO_LIKES_KEY_PREFIX}${jobId}`;
    
    // Check if user already liked
    const isLiked = await redisClient.sismember(likesKey, userId);
    
    if (isLiked) {
      // Unlike
      await redisClient.srem(likesKey, userId);
    } else {
      // Like
      await redisClient.sadd(likesKey, userId);
    }
    
    const totalLikes = await redisClient.scard(likesKey);
    
    // Update metadata
    const metadata = await getVideoMetadata(jobId);
    if (metadata) {
      metadata.likes = totalLikes;
      const key = `${VIDEO_KEY_PREFIX}${jobId}`;
      await redisClient.set(key, JSON.stringify(metadata));
    }
    
    return { liked: !isLiked, totalLikes };
  } catch (error) {
    logger.error(`Error toggling like for ${jobId}:`, error);
    return { liked: false, totalLikes: 0 };
  }
}

/**
 * Increment share count
 */
export async function incrementShareCount(jobId: string): Promise<number> {
  try {
    const metadata = await getVideoMetadata(jobId);
    if (metadata) {
      metadata.shareCount = (metadata.shareCount || 0) + 1;
      const key = `${VIDEO_KEY_PREFIX}${jobId}`;
      await redisClient.set(key, JSON.stringify(metadata));
      return metadata.shareCount;
    }
    return 0;
  } catch (error) {
    logger.error(`Error incrementing share count for ${jobId}:`, error);
    return 0;
  }
}

/**
 * Get explore videos with filters, sorting, and pagination
 */
export async function getExploreVideos(
  page: number = 1,
  pageSize: number = 12,
  filters?: VideoFilter,
  sort?: VideoSort
): Promise<ExploreVideosResponse> {
  try {
    // Get all public video IDs (sorted by newest by default)
    const allJobIds = await redisClient.zrevrange(PUBLIC_VIDEOS_SET, 0, -1);
    
    // Fetch all metadata
    const allVideos = await Promise.all(
      allJobIds.map(async (jobId: string) => await getVideoMetadata(jobId))
    );
    
    // Filter out null values
    let videos = allVideos.filter((v): v is VideoMetadata => v !== null);
    
    // Apply filters
    if (filters) {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        videos = videos.filter(
          (v: VideoMetadata) =>
            v.title.toLowerCase().includes(searchLower) ||
            v.topic.toLowerCase().includes(searchLower) ||
            v.description?.toLowerCase().includes(searchLower) ||
            v.tags?.some((tag: string) => tag.toLowerCase().includes(searchLower))
        );
      }
      
      if (filters.gradeLevel) {
        videos = videos.filter((v: VideoMetadata) => v.gradeLevel === filters.gradeLevel);
      }
      
      if (filters.language) {
        videos = videos.filter((v: VideoMetadata) => v.language === filters.language);
      }
      
      if (filters.subject) {
        videos = videos.filter((v: VideoMetadata) => v.subject === filters.subject);
      }
      
      if (filters.quality) {
        videos = videos.filter((v: VideoMetadata) => v.quality === filters.quality);
      }
    }
    
    // Apply sorting
    if (sort) {
      videos.sort((a: VideoMetadata, b: VideoMetadata) => {
        let comparison = 0;
        
        switch (sort.sortBy) {
          case 'newest':
            comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            break;
          case 'views':
            comparison = (b.views || 0) - (a.views || 0);
            break;
          case 'likes':
            comparison = (b.likes || 0) - (a.likes || 0);
            break;
          case 'popular':
            // Popularity = (views * 0.3 + likes * 0.5 + shareCount * 0.2) / max(1, views)
            // Higher engagement ratio = more popular
            const scoreA = ((a.views || 0) * 0.3 + (a.likes || 0) * 0.5 + (a.shareCount || 0) * 0.2) / Math.max(1, a.views || 1);
            const scoreB = ((b.views || 0) * 0.3 + (b.likes || 0) * 0.5 + (b.shareCount || 0) * 0.2) / Math.max(1, b.views || 1);
            comparison = scoreB - scoreA;
            break;
          case 'duration':
            comparison = b.duration - a.duration;
            break;
        }
        
        return sort.order === 'asc' ? -comparison : comparison;
      });
    }
    
    // Pagination
    const total = videos.length;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedVideos = videos.slice(startIndex, endIndex);
    
    return {
      videos: paginatedVideos,
      total,
      page,
      pageSize,
      hasMore: endIndex < total,
    };
  } catch (error) {
    logger.error('Error getting explore videos:', error);
    return {
      videos: [],
      total: 0,
      page,
      pageSize,
      hasMore: false,
    };
  }
}

/**
 * Get user's videos
 */
export async function getUserVideos(userId: string): Promise<VideoMetadata[]> {
  try {
    const userSetKey = `${USER_VIDEOS_SET_PREFIX}${userId}`;
    const jobIds = await redisClient.smembers(userSetKey);
    
    const videos = await Promise.all(
      jobIds.map(async (jobId: string) => await getVideoMetadata(jobId))
    );
    
    return videos.filter((v): v is VideoMetadata => v !== null)
      .sort((a: VideoMetadata, b: VideoMetadata) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    logger.error(`Error getting videos for user ${userId}:`, error);
    return [];
  }
}

/**
 * Delete video metadata
 */
export async function deleteVideoMetadata(jobId: string): Promise<void> {
  try {
    const metadata = await getVideoMetadata(jobId);
    
    if (metadata) {
      // Remove from user's set
      if (metadata.createdBy) {
        const userSetKey = `${USER_VIDEOS_SET_PREFIX}${metadata.createdBy}`;
        await redisClient.srem(userSetKey, jobId);
      }
      
      // Remove from public set if published
      if (metadata.isPublic) {
        await redisClient.zrem(PUBLIC_VIDEOS_SET, jobId);
      }
    }
    
    // Delete metadata
    const key = `${VIDEO_KEY_PREFIX}${jobId}`;
    await redisClient.del(key);
    
    // Delete views and likes
    await redisClient.del(`${VIDEO_VIEWS_KEY_PREFIX}${jobId}`);
    await redisClient.del(`${VIDEO_LIKES_KEY_PREFIX}${jobId}`);
    
    logger.info(`Video metadata deleted: ${jobId}`);
  } catch (error) {
    logger.error(`Error deleting video metadata for ${jobId}:`, error);
    throw error;
  }
}

export { redisClient };
