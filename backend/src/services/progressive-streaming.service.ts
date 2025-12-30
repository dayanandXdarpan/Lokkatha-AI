import { promises as fs } from 'fs';
import logger from '../utils/logger';

/**
 * Progressive Video Streaming Service
 * Enables streaming video chunks as they're generated
 * Provides early playback without waiting for full video
 */

export interface ChunkInfo {
  chunkNumber: number;
  chunkPath: string;
  duration: number;
  size: number;
  ready: boolean;
}

export interface VideoStreamState {
  jobId: string;
  totalChunks: number;
  readyChunks: ChunkInfo[];
  isComplete: boolean;
  finalVideoPath?: string;
}

// In-memory state for active video streams
const activeStreams = new Map<string, VideoStreamState>();

/**
 * Initialize progressive streaming for a job
 */
export function initializeStream(jobId: string, totalChunks: number): void {
  logger.info(`Initializing progressive stream for job ${jobId}`, { totalChunks });
  
  activeStreams.set(jobId, {
    jobId,
    totalChunks,
    readyChunks: [],
    isComplete: false
  });
}

/**
 * Mark a chunk as ready for streaming
 */
export async function markChunkReady(
  jobId: string,
  chunkNumber: number,
  chunkPath: string
): Promise<void> {
  const stream = activeStreams.get(jobId);
  
  if (!stream) {
    logger.warn(`No stream found for job ${jobId}`);
    return;
  }
  
  try {
    const stats = await fs.stat(chunkPath);
    
    const chunkInfo: ChunkInfo = {
      chunkNumber,
      chunkPath,
      duration: 0, // Will be updated when we have ffprobe data
      size: stats.size,
      ready: true
    };
    
    stream.readyChunks.push(chunkInfo);
    stream.readyChunks.sort((a, b) => a.chunkNumber - b.chunkNumber);
    
    logger.info(`Chunk ${chunkNumber} ready for streaming`, {
      jobId,
      totalReady: stream.readyChunks.length,
      totalChunks: stream.totalChunks
    });
  } catch (error) {
    logger.error(`Failed to mark chunk ${chunkNumber} as ready`, { error });
  }
}

/**
 * Mark stream as complete with final video path
 */
export function completeStream(jobId: string, finalVideoPath: string): void {
  const stream = activeStreams.get(jobId);
  
  if (!stream) {
    logger.warn(`No stream found for job ${jobId}`);
    return;
  }
  
  stream.isComplete = true;
  stream.finalVideoPath = finalVideoPath;
  
  logger.info(`Stream completed for job ${jobId}`, { finalVideoPath });
}

/**
 * Get stream state for a job
 */
export function getStreamState(jobId: string): VideoStreamState | null {
  return activeStreams.get(jobId) || null;
}

/**
 * Check if early playback is available (first N chunks ready)
 */
export function canStartEarlyPlayback(jobId: string, minChunks: number = 3): boolean {
  const stream = activeStreams.get(jobId);
  
  if (!stream) {
    return false;
  }
  
  return stream.readyChunks.length >= minChunks;
}

/**
 * Get chunks ready for streaming
 */
export function getReadyChunks(jobId: string): ChunkInfo[] {
  const stream = activeStreams.get(jobId);
  
  if (!stream) {
    return [];
  }
  
  return stream.readyChunks;
}

/**
 * Calculate streaming progress
 */
export function getStreamProgress(jobId: string): {
  chunksReady: number;
  totalChunks: number;
  percentReady: number;
  canStartPlayback: boolean;
  isComplete: boolean;
} {
  const stream = activeStreams.get(jobId);
  
  if (!stream) {
    return {
      chunksReady: 0,
      totalChunks: 0,
      percentReady: 0,
      canStartPlayback: false,
      isComplete: false
    };
  }
  
  const chunksReady = stream.readyChunks.length;
  const percentReady = (chunksReady / stream.totalChunks) * 100;
  const canStartPlayback = canStartEarlyPlayback(stream.jobId);
  
  return {
    chunksReady,
    totalChunks: stream.totalChunks,
    percentReady: Math.round(percentReady),
    canStartPlayback,
    isComplete: stream.isComplete
  };
}

/**
 * Stream a chunk file to response
 */
export async function streamChunk(chunkPath: string): Promise<Buffer> {
  try {
    const buffer = await fs.readFile(chunkPath);
    return buffer;
  } catch (error) {
    logger.error('Failed to stream chunk', { chunkPath, error });
    throw error;
  }
}

/**
 * Cleanup stream state after video is complete
 */
export function cleanupStream(jobId: string, keepForMinutes: number = 30): void {
  setTimeout(() => {
    const deleted = activeStreams.delete(jobId);
    if (deleted) {
      logger.info(`Cleaned up stream state for job ${jobId}`);
    }
  }, keepForMinutes * 60 * 1000);
}

/**
 * Create a playlist file (M3U8) for progressive streaming
 * Useful for HLS-style streaming
 */
export async function createStreamingPlaylist(
  jobId: string,
  outputPath: string
): Promise<void> {
  const stream = activeStreams.get(jobId);
  
  if (!stream) {
    throw new Error(`No stream found for job ${jobId}`);
  }
  
  // Create M3U8 playlist
  let playlist = '#EXTM3U\n';
  playlist += '#EXT-X-VERSION:3\n';
  playlist += '#EXT-X-TARGETDURATION:10\n';
  playlist += '#EXT-X-MEDIA-SEQUENCE:0\n\n';
  
  for (const chunk of stream.readyChunks) {
    playlist += `#EXTINF:${chunk.duration || 10},\n`;
    playlist += `chunk_${chunk.chunkNumber}.mp4\n`;
  }
  
  if (stream.isComplete) {
    playlist += '#EXT-X-ENDLIST\n';
  }
  
  await fs.writeFile(outputPath, playlist);
  logger.info(`Created streaming playlist: ${outputPath}`);
}

/**
 * Get estimated time until first chunks are ready
 */
export function getEstimatedTimeToPlayback(
  jobId: string,
  averageChunkTimeSeconds: number = 15
): number | null {
  const stream = activeStreams.get(jobId);
  
  if (!stream) {
    return null;
  }
  
  if (canStartEarlyPlayback(jobId)) {
    return 0; // Already ready!
  }
  
  const chunksNeeded = 3; // Minimum for playback
  const chunksReady = stream.readyChunks.length;
  const chunksRemaining = Math.max(0, chunksNeeded - chunksReady);
  
  return chunksRemaining * averageChunkTimeSeconds;
}

/**
 * Enable progressive loading for a video generation job
 */
export interface ProgressiveLoadingOptions {
  enableStreaming: boolean;
  minChunksBeforePlayback: number;
  notifyOnChunkReady?: (chunkNumber: number) => void;
}

export const defaultProgressiveOptions: ProgressiveLoadingOptions = {
  enableStreaming: true,
  minChunksBeforePlayback: 3,
  notifyOnChunkReady: undefined
};
