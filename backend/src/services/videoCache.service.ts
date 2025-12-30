import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import logger from '../utils/logger';

interface CachedVideo {
  jobId: string;
  videoUrl: string;
  duration: number;
  fileSize: number;
  thumbnailUrl?: string;
  cachedAt: string;
  expiresAt: string;
}

// Cache for 7 days
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const CACHE_DIR = path.join(process.cwd(), 'cache', 'videos');

/**
 * Generate cache key from video request parameters
 */
export function generateVideoCacheKey(
  topic: string,
  language: string,
  gradeLevel: string
): string {
  const normalized = `${topic.trim().toLowerCase()}-${language}-${gradeLevel}`;
  return crypto.createHash('md5').update(normalized).digest('hex').substring(0, 16);
}

/**
 * Ensure cache directory exists
 */
async function ensureCacheDir(): Promise<void> {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  } catch (error) {
    logger.error('Failed to create cache directory:', error);
  }
}

/**
 * Get cached video if it exists and is not expired
 */
export async function getCachedVideo(cacheKey: string): Promise<CachedVideo | null> {
  try {
    const cacheFile = path.join(CACHE_DIR, `${cacheKey}.json`);
    
    try {
      const data = await fs.readFile(cacheFile, 'utf-8');
      const cached: CachedVideo = JSON.parse(data);
      
      // Check if expired
      if (new Date(cached.expiresAt) < new Date()) {
        logger.info(`Cache expired for key ${cacheKey}`);
        await fs.unlink(cacheFile).catch(() => {}); // Delete expired cache
        return null;
      }
      
      logger.info(`Cache hit for key ${cacheKey}`);
      return cached;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return null; // Cache miss
      }
      throw error;
    }
  } catch (error) {
    logger.error(`Failed to get cached video for key ${cacheKey}:`, error);
    return null;
  }
}

/**
 * Store video result in cache
 */
export async function setCachedVideo(
  cacheKey: string,
  jobId: string,
  result: {
    videoUrl: string;
    duration: number;
    fileSize: number;
    thumbnailUrl?: string;
  }
): Promise<void> {
  try {
    await ensureCacheDir();
    
    const cached: CachedVideo = {
      jobId,
      videoUrl: result.videoUrl,
      duration: result.duration,
      fileSize: result.fileSize,
      thumbnailUrl: result.thumbnailUrl,
      cachedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + CACHE_TTL_MS).toISOString(),
    };
    
    const cacheFile = path.join(CACHE_DIR, `${cacheKey}.json`);
    await fs.writeFile(cacheFile, JSON.stringify(cached, null, 2), 'utf-8');
    
    logger.info(`Cached video result for key ${cacheKey}`);
  } catch (error) {
    logger.error(`Failed to cache video for key ${cacheKey}:`, error);
  }
}

/**
 * Clear expired cache entries
 */
export async function cleanExpiredCache(): Promise<void> {
  try {
    await ensureCacheDir();
    const files = await fs.readdir(CACHE_DIR);
    
    let cleaned = 0;
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      
      const filePath = path.join(CACHE_DIR, file);
      try {
        const data = await fs.readFile(filePath, 'utf-8');
        const cached: CachedVideo = JSON.parse(data);
        
        if (new Date(cached.expiresAt) < new Date()) {
          await fs.unlink(filePath);
          cleaned++;
        }
      } catch (error) {
        logger.error(`Failed to process cache file ${file}:`, error);
      }
    }
    
    if (cleaned > 0) {
      logger.info(`Cleaned ${cleaned} expired cache entries`);
    }
  } catch (error) {
    logger.error('Failed to clean expired cache:', error);
  }
}
