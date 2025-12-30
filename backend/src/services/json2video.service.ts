import axios from 'axios';
import logger from '../utils/logger';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Json2video API Service
 * Provides advanced video generation capabilities using Json2video API
 * API Key: TPe2D9nnZ0macwd5Js8oytCdg6HmTHBqETrs40wf
 */

const JSON2VIDEO_API_KEY = process.env.JSON2VIDEO_API_KEY || 'TPe2D9nnZ0macwd5Js8oytCdg6HmTHBqETrs40wf';
const JSON2VIDEO_API_URL = 'https://api.json2video.com/v2';

interface Json2VideoScene {
  duration: number;
  elements: Array<{
    type: 'text' | 'image' | 'audio' | 'video';
    source?: string;
    text?: string;
    settings: {
      x?: number;
      y?: number;
      width?: number;
      height?: number;
      fontSize?: number;
      fontFamily?: string;
      color?: string;
      backgroundColor?: string;
    };
  }>;
  transition?: {
    type: 'fade' | 'slide' | 'wipe';
    duration: number;
  };
}

interface Json2VideoProject {
  resolution: '360p' | '480p' | '720p' | '1080p';
  quality: 'low' | 'medium' | 'high';
  fps: number;
  scenes: Json2VideoScene[];
  soundtrack?: {
    source: string;
    volume: number;
  };
}

interface Json2VideoResponse {
  project: string;
  status: 'queued' | 'processing' | 'done' | 'error';
  url?: string;
  progress?: number;
  error?: string;
}

/**
 * Check if Json2video API is enabled and configured
 */
export function isJson2videoEnabled(): boolean {
  return !!JSON2VIDEO_API_KEY && process.env.ENABLE_JSON2VIDEO === 'true';
}

/**
 * Create a video project using Json2video API
 * This is the PRIMARY video generation method when enabled
 */
export async function createJson2VideoProject(
  project: Json2VideoProject
): Promise<string> {
  try {
    logger.info('Creating Json2video project', {
      resolution: project.resolution,
      scenes: project.scenes.length,
      quality: project.quality
    });

    const response = await axios.post<Json2VideoResponse>(
      `${JSON2VIDEO_API_URL}/movies`,
      {
        resolution: project.resolution,
        quality: project.quality,
        fps: project.fps,
        scenes: project.scenes,
        ...(project.soundtrack && { soundtrack: project.soundtrack })
      },
      {
        headers: {
          'x-api-key': JSON2VIDEO_API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 60000 // 60 seconds timeout
      }
    );

    if (!response.data.project) {
      throw new Error('No project ID returned from Json2video API');
    }

    logger.info('Json2video project created successfully', {
      projectId: response.data.project,
      status: response.data.status
    });

    return response.data.project;
  } catch (error: any) {
    logger.error('Failed to create Json2video project', {
      error: error.message,
      response: error.response?.data
    });
    throw new Error(`Json2video API error: ${error.message}`);
  }
}

/**
 * Check the status of a Json2video project
 */
export async function getJson2VideoStatus(
  projectId: string
): Promise<Json2VideoResponse> {
  try {
    const response = await axios.get<Json2VideoResponse>(
      `${JSON2VIDEO_API_URL}/movies/${projectId}`,
      {
        headers: {
          'x-api-key': JSON2VIDEO_API_KEY
        }
      }
    );

    return response.data;
  } catch (error: any) {
    logger.error('Failed to get Json2video status', {
      projectId,
      error: error.message
    });
    throw error;
  }
}

/**
 * Wait for Json2video project to complete
 * Polls the API until the video is ready
 */
export async function waitForJson2VideoCompletion(
  projectId: string,
  maxWaitTime: number = 600000, // 10 minutes default
  pollInterval: number = 5000 // 5 seconds
): Promise<string> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTime) {
    const status = await getJson2VideoStatus(projectId);

    logger.info('Json2video project status', {
      projectId,
      status: status.status,
      progress: status.progress,
      elapsed: Math.round((Date.now() - startTime) / 1000)
    });

    if (status.status === 'done' && status.url) {
      logger.info('Json2video project completed', {
        projectId,
        url: status.url,
        totalTime: Math.round((Date.now() - startTime) / 1000)
      });
      return status.url;
    }

    if (status.status === 'error') {
      throw new Error(`Json2video project failed: ${status.error}`);
    }

    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  throw new Error('Json2video project timed out');
}

/**
 * Download video from Json2video URL
 */
export async function downloadJson2Video(
  videoUrl: string,
  outputPath: string
): Promise<string> {
  try {
    logger.info('Downloading Json2video output', { videoUrl, outputPath });

    const response = await axios.get(videoUrl, {
      responseType: 'stream',
      timeout: 300000 // 5 minutes for download
    });

    // Ensure directory exists
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    // Write stream to file
    const writer = require('fs').createWriteStream(outputPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        logger.info('Json2video download completed', { outputPath });
        resolve(outputPath);
      });
      writer.on('error', reject);
    });
  } catch (error: any) {
    logger.error('Failed to download Json2video output', {
      error: error.message,
      videoUrl
    });
    throw error;
  }
}

/**
 * Convert our script format to Json2video format
 * This is the bridge between our existing pipeline and Json2video API
 */
export function convertScriptToJson2Video(
  script: any,
  imagePaths: string[],
  audioPath: string,
  options: {
    resolution: '360p' | '480p' | '720p' | '1080p';
    quality: 'low' | 'medium' | 'high';
  }
): Json2VideoProject {
  const scenes: Json2VideoScene[] = script.scenes.map((scene: any, index: number) => {
    const sceneElements = [];

    // Add image/video background
    if (imagePaths[index]) {
      sceneElements.push({
        type: 'image' as const,
        source: imagePaths[index],
        settings: {
          x: 0,
          y: 0,
          width: 1920,
          height: 1080
        }
      });
    }

    // Add subtitle text overlay
    if (scene.narration) {
      sceneElements.push({
        type: 'text' as const,
        text: scene.narration,
        settings: {
          x: 960, // Center horizontally
          y: 950, // Near bottom
          width: 1600,
          height: 200,
          fontSize: 48,
          fontFamily: 'Arial',
          color: '#FFFFFF',
          backgroundColor: 'rgba(0, 0, 0, 0.7)'
        }
      });
    }

    return {
      duration: scene.duration || 5, // Default 5 seconds per scene
      elements: sceneElements,
      transition: {
        type: 'fade',
        duration: 0.5
      }
    };
  });

  return {
    resolution: options.resolution,
    quality: options.quality,
    fps: 30,
    scenes,
    soundtrack: audioPath ? {
      source: audioPath,
      volume: 0.8
    } : undefined
  };
}

/**
 * Main function: Generate video using Json2video API
 * This replaces the FFmpeg pipeline when enabled
 */
export async function generateVideoWithJson2Video(
  script: any,
  imagePaths: string[],
  audioPath: string,
  outputPath: string,
  options: {
    resolution: '360p' | '480p' | '720p' | '1080p';
    quality: 'low' | 'medium' | 'high';
  }
): Promise<string> {
  try {
    // Convert our format to Json2video format
    const project = convertScriptToJson2Video(script, imagePaths, audioPath, options);

    // Create project
    const projectId = await createJson2VideoProject(project);

    // Wait for completion
    const videoUrl = await waitForJson2VideoCompletion(projectId);

    // Download the final video
    const finalPath = await downloadJson2Video(videoUrl, outputPath);

    logger.info('Json2video generation completed successfully', {
      projectId,
      outputPath: finalPath
    });

    return finalPath;
  } catch (error: any) {
    logger.error('Json2video generation failed', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Health check for Json2video API
 */
export async function checkJson2VideoHealth(): Promise<boolean> {
  try {
    await axios.get(`${JSON2VIDEO_API_URL}/movies`, {
      headers: {
        'x-api-key': JSON2VIDEO_API_KEY
      },
      timeout: 10000
    });
    return true;
  } catch (error) {
    logger.error('Json2video API health check failed', { error });
    return false;
  }
}
