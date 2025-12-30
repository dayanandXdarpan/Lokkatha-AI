import ffmpeg from 'fluent-ffmpeg';
import { promises as fs } from 'fs';
import path from 'path';
import logger from '../utils/logger';

export interface VideoProcessingParams {
  imageFiles: string[];
  audioFile: string;
  subtitleFile?: string;
  outputPath: string;
  resolution?: '480p' | '720p' | '1080p';
  crf?: number;
  preset?: string;
}

export interface VideoMetadata {
  duration: number;
  fileSize: number;
  resolution: string;
  codec: string;
}

/**
 * Create video from images, audio, and subtitles using FFmpeg
 */
export async function createVideo(
  params: VideoProcessingParams
): Promise<string> {
  try {
    const {
      imageFiles,
      audioFile,
      subtitleFile,
      outputPath,
      resolution = '480p',
      crf = 23,
      preset = 'veryfast',
    } = params;

    logger.info('Starting video creation with FFmpeg', {
      imageCount: imageFiles.length,
      resolution,
      crf,
      preset,
    });

    // Ensure output directory exists with absolute path
    const absoluteOutputPath = path.resolve(outputPath);
    const outputDir = path.dirname(absoluteOutputPath);
    await fs.mkdir(outputDir, { recursive: true, mode: 0o755 });

    // Verify directory is writable
    try {
      await fs.access(outputDir, fs.constants.W_OK);
      logger.info(`Output directory verified: ${outputDir}`);
    } catch (error) {
      throw new Error(`Cannot write to output directory: ${outputDir}`);
    }

    // Create concat file for images
    const concatFilePath = path.join(outputDir, 'concat_list.txt');
    await createConcatFile(imageFiles, concatFilePath);

    // Get resolution dimensions
    const dimensions = getResolutionDimensions(resolution);

    // Convert paths to forward slashes for FFmpeg
    const ffmpegOutputPath = absoluteOutputPath.replace(/\\/g, '/');
    const ffmpegConcatPath = concatFilePath.replace(/\\/g, '/');
    const ffmpegAudioPath = path.resolve(audioFile).replace(/\\/g, '/');
    const ffmpegSubtitlePath = subtitleFile ? path.resolve(subtitleFile).replace(/\\/g, '/') : null;

    logger.info('FFmpeg paths:', {
      concat: ffmpegConcatPath,
      audio: ffmpegAudioPath,
      subtitle: ffmpegSubtitlePath,
      output: ffmpegOutputPath,
    });

    return new Promise((resolve, reject) => {
      let command = ffmpeg();

      // Add images using concat demuxer
      command
        .input(ffmpegConcatPath)
        .inputOptions([
          '-f concat',
          '-safe 0',
        ]);

      // Add audio input
      command.input(ffmpegAudioPath);

      // Build video filter
      let videoFilter = `scale=${dimensions.width}:${dimensions.height}:force_original_aspect_ratio=decrease,pad=${dimensions.width}:${dimensions.height}:(ow-iw)/2:(oh-ih)/2`;

      // Add subtitles to filter if provided
      if (ffmpegSubtitlePath) {
        // On Windows, we need to properly escape the path for the subtitles filter
        // Replace backslashes and colons that might cause issues
        const escapedSubtitlePath = ffmpegSubtitlePath.replace(/\\/g, '/').replace(/:/g, '\\:');
        videoFilter += `,subtitles='${escapedSubtitlePath}':force_style='Fontsize=24,PrimaryColour=&HFFFFFF&,OutlineColour=&H000000&,Outline=2'`;
      }

      // Set video codec and quality settings
      command
        .videoCodec('libx264')
        .outputOptions([
          '-profile:v baseline',
          '-level 3.0',
          `-crf ${crf}`,
          `-preset ${preset}`,
          '-pix_fmt yuv420p',
          '-movflags +faststart',
          `-vf ${videoFilter}`,
        ]);

      // Set audio codec
      command
        .audioCodec('aac')
        .audioBitrate('128k')
        .audioChannels(2);

      // Set output duration to match audio
      command.outputOptions(['-shortest']);

      // Set output format
      command.format('mp4');

      // Handle progress
      command.on('progress', (progress) => {
        if (progress.percent) {
          logger.info(`FFmpeg progress: ${Math.round(progress.percent)}%`);
        }
      });

      // Handle errors
      command.on('error', (err) => {
        logger.error('FFmpeg error:', err);
        reject(new Error(`Video creation failed: ${err.message}`));
      });

      // Handle completion
      command.on('end', async () => {
        // Clean up concat file
        try {
          await fs.unlink(concatFilePath);
        } catch (err) {
          logger.warn('Failed to delete concat file:', err);
        }
        logger.info(`Video created successfully: ${absoluteOutputPath}`);
        resolve(absoluteOutputPath);
      });

      // Run the command
      command.save(ffmpegOutputPath);
    });
  } catch (error: any) {
    logger.error('Failed to create video:', error);
    throw new Error(`Video creation failed: ${error.message}`);
  }
}

/**
 * Create concat file for FFmpeg
 */
async function createConcatFile(imageFiles: string[], outputPath: string): Promise<void> {
  const content = imageFiles
    .map((file) => {
      const absolutePath = path.resolve(file);
      const ffmpegPath = absolutePath.replace(/\\/g, '/');
      // Each image shows for 5 seconds
      return `file '${ffmpegPath}'\nduration 5`;
    })
    .join('\n');

  // Add the last image again without duration for FFmpeg concat
  const lastImage = path.resolve(imageFiles[imageFiles.length - 1]).replace(/\\/g, '/');
  const finalContent = content + `\nfile '${lastImage}'`;

  await fs.writeFile(outputPath, finalContent, 'utf-8');
  logger.info(`Concat file created: ${outputPath}`);
}

/**
 * Get resolution dimensions
 */
function getResolutionDimensions(resolution: string): { width: number; height: number } {
  switch (resolution) {
    case '1080p':
      return { width: 1920, height: 1080 };
    case '720p':
      return { width: 1280, height: 720 };
    case '480p':
    default:
      return { width: 854, height: 480 };
  }
}

/**
 * Get video metadata using FFprobe
 */
export async function getVideoMetadata(videoPath: string): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        logger.error('Failed to get video metadata:', err);
        reject(err);
        return;
      }

      const videoStream = metadata.streams.find((s) => s.codec_type === 'video');
      const duration = metadata.format.duration || 0;
      const fileSize = metadata.format.size || 0;

      resolve({
        duration,
        fileSize,
        resolution: videoStream ? `${videoStream.width}x${videoStream.height}` : 'unknown',
        codec: videoStream?.codec_name || 'unknown',
      });
    });
  });
}

/**
 * Create SRT subtitle file from script scenes
 */
export async function createSubtitleFile(
  scenes: Array<{ narration: string; sceneNumber: number; duration: number }>,
  outputPath: string
): Promise<string> {
  try {
    let srtContent = '';
    let currentTime = 0;

    for (const scene of scenes) {
      const startTime = formatSRTTime(currentTime);
      const endTime = formatSRTTime(currentTime + scene.duration);

      srtContent += `${scene.sceneNumber}\n`;
      srtContent += `${startTime} --> ${endTime}\n`;
      srtContent += `${scene.narration}\n\n`;

      currentTime += scene.duration;
    }

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    await fs.mkdir(outputDir, { recursive: true });

    await fs.writeFile(outputPath, srtContent, 'utf-8');
    logger.info(`Subtitle file created: ${outputPath}`);

    return outputPath;
  } catch (error: any) {
    logger.error('Failed to create subtitle file:', error);
    throw error;
  }
}

/**
 * Format time in SRT format (HH:MM:SS,mmm)
 */
function formatSRTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const milliseconds = Math.floor((seconds % 1) * 1000);

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`;
}

/**
 * Compress an existing video
 */
export async function compressVideo(
  inputPath: string,
  outputPath: string,
  crf: number = 28
): Promise<string> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoCodec('libx264')
      .outputOptions([
        `-crf ${crf}`,
        '-preset veryfast',
        '-movflags +faststart',
      ])
      .on('end', () => {
        logger.info(`Video compressed: ${outputPath}`);
        resolve(outputPath);
      })
      .on('error', (err) => {
        logger.error('Video compression failed:', err);
        reject(err);
      })
      .save(outputPath);
  });
}
