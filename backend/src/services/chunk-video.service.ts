import ffmpeg from 'fluent-ffmpeg';
import { promises as fs } from 'fs';
import path from 'path';
import logger from '../utils/logger';

/**
 * Chunk-Based Video Assembly Service
 * Creates perfectly synced video clips per chunk, then concatenates them.
 * This ensures perfect audio/video/subtitle sync for each scene.
 */

export interface EncodingSettings {
  resolution: '360p' | '480p' | '720p' | '1080p';
  crf: number;
  preset: string;
  audioBitrate: string;
  codec?: 'h264' | 'h265'; // New: Support for H.265/HEVC
  pixelFormat?: string; // For H.265 compatibility
}

export interface ChunkVideoParams {
  imageFile: string;
  audioFile: string;
  subtitleText: string;
  sceneNumber: number;
  outputPath: string;
  resolution?: '360p' | '480p' | '720p' | '1080p';
  encodingSettings?: EncodingSettings;
}

/**
 * Create a single video chunk with perfect sync
 * Each chunk has: 1 image + 1 audio + burned-in subtitle
 */
export async function createChunkVideo(params: ChunkVideoParams): Promise<string> {
  const { imageFile, audioFile, subtitleText, sceneNumber, outputPath, resolution = '480p', encodingSettings } = params;

  logger.info(`Creating chunk video ${sceneNumber}`, { imageFile, audioFile, outputPath, resolution });

  // Resolution settings
  const resolutionMap = {
    '360p': { width: 640, height: 360 },
    '480p': { width: 854, height: 480 },
    '720p': { width: 1280, height: 720 },
    '1080p': { width: 1920, height: 1080 },
  };

  const { width, height } = resolutionMap[resolution];
  
  // Use encoding settings if provided, otherwise use defaults
  const crf = encodingSettings?.crf || 23;
  const preset = encodingSettings?.preset || 'veryfast';
  const audioBitrate = encodingSettings?.audioBitrate || '128k';
  const codec = encodingSettings?.codec || 'h264';
  const pixelFormat = encodingSettings?.pixelFormat || 'yuv420p';

  // Select video codec
  const videoCodec = codec === 'h265' ? 'libx265' : 'libx264';
  
  logger.info(`Encoding with ${codec.toUpperCase()}`, { videoCodec, crf, preset });

  // Create a temporary subtitle file for this chunk
  const srtPath = outputPath.replace('.mp4', '.srt');
  await createChunkSubtitle(subtitleText, srtPath);

  return new Promise((resolve, reject) => {
    const ffmpegCommand = ffmpeg()
      .input(imageFile)
      .loop() // Loop image for duration of audio
      .input(audioFile)
      .videoFilters([
        `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`,
        `subtitles=${srtPath.replace(/\\/g, '/')}:force_style='FontName=Arial,FontSize=20,PrimaryColour=&HFFFFFF&,OutlineColour=&H000000&,Outline=2,Shadow=1,MarginV=30'`
      ])
      .videoCodec(videoCodec)
      .audioCodec('aac')
      .audioBitrate(audioBitrate)
      .outputOptions([
        '-shortest', // Match audio duration
        `-preset ${preset}`,
        `-crf ${crf}`,
        `-pix_fmt ${pixelFormat}`,
        '-movflags +faststart' // Enable streaming
      ]);
    
    // Add H.265 specific options for better compression
    if (codec === 'h265') {
      ffmpegCommand.outputOptions([
        '-x265-params log-level=error', // Reduce x265 logging
        '-tag:v hvc1' // QuickTime compatibility
      ]);
    }
    
    ffmpegCommand
      .output(outputPath)
      .on('start', (cmd) => {
        logger.debug(`FFmpeg chunk command: ${cmd}`);
      })
      .on('end', () => {
        logger.info(`Chunk video created: ${outputPath}`);
        resolve(outputPath);
      })
      .on('error', (err) => {
        logger.error(`Failed to create chunk video ${sceneNumber}`, { error: err.message });
        reject(err);
      })
      .run();
  });
}

/**
 * Create subtitle file for a single chunk
 * SRT format with proper timing
 */
async function createChunkSubtitle(text: string, outputPath: string): Promise<void> {
  // Simple SRT format: subtitle appears from start to end of clip
  const srtContent = `1
00:00:00,000 --> 00:10:00,000
${text}
`;

  await fs.writeFile(outputPath, srtContent, 'utf-8');
}

/**
 * Concatenate multiple chunk videos into final video
 * Uses FFmpeg concat demuxer for fast, lossless concatenation
 */
export async function concatenateChunks(chunkPaths: string[], outputPath: string): Promise<string> {
  logger.info(`Concatenating ${chunkPaths.length} chunk videos`);

  // Create concat list file
  const concatListPath = path.join(path.dirname(outputPath), 'chunk_concat_list.txt');
  const concatContent = chunkPaths.map(p => `file '${path.basename(p)}'`).join('\n');
  await fs.writeFile(concatListPath, concatContent, 'utf-8');

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(concatListPath)
      .inputOptions(['-f', 'concat', '-safe', '0'])
      .outputOptions(['-c', 'copy']) // Copy streams without re-encoding (fast!)
      .output(outputPath)
      .on('start', (cmd) => {
        logger.debug(`FFmpeg concat command: ${cmd}`);
      })
      .on('end', () => {
        logger.info(`Final video concatenated: ${outputPath}`);
        resolve(outputPath);
      })
      .on('error', (err) => {
        logger.error('Failed to concatenate chunks', { error: err.message });
        reject(err);
      })
      .run();
  });
}

/**
 * Create video using chunk-based assembly (parallel)
 * This is the new professional workflow
 */
export async function createVideoFromChunks(
  scenes: Array<{
    imageFile: string;
    audioFile: string;
    narration: string;
    sceneNumber: number;
  }>,
  outputPath: string,
  resolution: '360p' | '480p' | '720p' | '1080p' = '480p',
  encodingSettings?: EncodingSettings
): Promise<string> {
  logger.info(`Creating video from ${scenes.length} chunks using parallel assembly`, { resolution, encodingSettings });

  const workDir = path.dirname(outputPath);
  const chunkPaths: string[] = [];

  // Step 1: Create all chunk videos in parallel
  const chunkPromises = scenes.map(async (scene) => {
    const chunkOutputPath = path.join(workDir, `chunk_${scene.sceneNumber}.mp4`);
    
    await createChunkVideo({
      imageFile: scene.imageFile,
      audioFile: scene.audioFile,
      subtitleText: scene.narration,
      sceneNumber: scene.sceneNumber,
      outputPath: chunkOutputPath,
      resolution,
      encodingSettings,
    });

    return chunkOutputPath;
  });

  // Wait for all chunks to complete
  const results = await Promise.allSettled(chunkPromises);

  // Collect successful chunks
  for (const result of results) {
    if (result.status === 'fulfilled') {
      chunkPaths.push(result.value);
    } else {
      logger.error('Chunk creation failed', { error: result.reason });
      throw new Error(`Chunk creation failed: ${result.reason}`);
    }
  }

  logger.info(`Created ${chunkPaths.length} chunk videos, now concatenating...`);

  // Step 2: Concatenate all chunks into final video
  await concatenateChunks(chunkPaths, outputPath);

  // Step 3: Cleanup chunk files (optional)
  try {
    await Promise.all(chunkPaths.map(p => fs.unlink(p)));
    await fs.unlink(path.join(workDir, 'chunk_concat_list.txt'));
    // Also cleanup chunk SRT files
    await Promise.all(chunkPaths.map(p => fs.unlink(p.replace('.mp4', '.srt')).catch(() => {})));
  } catch (cleanupError) {
    logger.warn('Cleanup of chunk files failed (non-critical)', { error: cleanupError });
  }

  logger.info('Video creation from chunks completed successfully');
  return outputPath;
}
