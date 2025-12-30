import ffmpeg from 'fluent-ffmpeg';
import logger from '../utils/logger';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Get video duration in seconds
 */
export async function getVideoDuration(videoPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        logger.error('Failed to get video duration:', err);
        reject(err);
      } else {
        const duration = metadata.format.duration || 0;
        resolve(duration);
      }
    });
  });
}

/**
 * Trim video to exact target duration
 */
export async function trimVideo(
  inputPath: string,
  targetDuration: number,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    logger.info(`Trimming video to ${targetDuration}s`, { inputPath });
    
    ffmpeg(inputPath)
      .setDuration(targetDuration)
      .output(outputPath)
      .on('start', (cmd) => {
        logger.debug('FFmpeg trim command:', cmd);
      })
      .on('progress', (progress) => {
        if (progress.percent) {
          logger.debug(`Trim progress: ${Math.round(progress.percent)}%`);
        }
      })
      .on('end', () => {
        logger.info('Video trimmed successfully');
        resolve();
      })
      .on('error', (err) => {
        logger.error('Video trim failed:', err);
        reject(err);
      })
      .run();
  });
}

/**
 * Extend video by freezing last frame
 */
export async function extendVideo(
  inputPath: string,
  targetDuration: number,
  outputPath: string
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const currentDuration = await getVideoDuration(inputPath);
      const extendBy = targetDuration - currentDuration;
      
      if (extendBy <= 0) {
        logger.warn('Video is already longer than target, no extension needed');
        // Just copy the file
        await fs.copyFile(inputPath, outputPath);
        resolve();
        return;
      }
      
      logger.info(`Extending video by ${extendBy.toFixed(2)}s (freeze frame)`, { inputPath });
      
      // Create temporary freeze frame video from last frame
      const tempDir = path.dirname(outputPath);
      const lastFramePath = path.join(tempDir, 'last_frame.png');
      const freezeFramePath = path.join(tempDir, 'freeze_frame.mp4');
      
      // Step 1: Extract last frame as image
      logger.info('Extracting last frame...');
      await new Promise<void>((res, rej) => {
        ffmpeg(inputPath)
          .seekInput(currentDuration - 0.5) // Seek to near end
          .frames(1)
          .output(lastFramePath)
          .on('end', () => {
            logger.info('Last frame extracted');
            res();
          })
          .on('error', (err) => {
            logger.error('Failed to extract last frame:', err);
            rej(err);
          })
          .run();
      });
      
      // Step 2: Create freeze frame video from image
      logger.info(`Creating ${extendBy.toFixed(2)}s freeze frame video...`);
      await new Promise<void>((res, rej) => {
        ffmpeg()
          .input(lastFramePath)
          .inputOptions([
            '-loop', '1',        // Loop the image indefinitely
            '-framerate', '30',  // Input framerate
          ])
          .outputOptions([
            '-c:v', 'libx264',
            '-t', extendBy.toFixed(2), // EXACT duration (with decimals)
            '-pix_fmt', 'yuv420p',
            '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', // Ensure even dimensions
          ])
          .output(freezeFramePath)
          .on('start', (cmd) => {
            logger.debug('FFmpeg freeze frame command:', cmd);
          })
          .on('end', () => {
            logger.info('Freeze frame video created');
            res();
          })
          .on('error', (err) => {
            logger.error('Failed to create freeze frame video:', err);
            rej(err);
          })
          .run();
      });
      
      // Step 3: Concatenate original video with freeze frame
      const concatListPath = path.join(tempDir, 'concat_list.txt');

      // Use absolute, ffmpeg-friendly paths in the concat list to avoid
      // working-directory and path-format issues on Windows.
      const absoluteInput = path.resolve(inputPath).replace(/\\/g, '/');
      const absoluteFreeze = path.resolve(freezeFramePath).replace(/\\/g, '/');

      const concatContent = `file '${absoluteInput}'\nfile '${absoluteFreeze}'`;
      await fs.writeFile(concatListPath, concatContent, 'utf-8');
      logger.info('Concat list written for extension:', { concatListPath });

      // Verify file exists before invoking ffmpeg
      try {
        await fs.access(concatListPath);
      } catch (err) {
        logger.error('Concat list missing before ffmpeg run:', err);
        throw err;
      }

      // Run ffmpeg concat using the absolute path (forward slashes)
      logger.info('Concatenating original + freeze frame...');
      await new Promise<void>((res, rej) => {
        const ffmpegConcatPath = path.resolve(concatListPath).replace(/\\/g, '/');

        ffmpeg()
          .input(ffmpegConcatPath)
          .inputOptions(['-f', 'concat', '-safe', '0'])
          .outputOptions(['-c', 'copy'])
          .output(outputPath)
          .on('start', (cmd) => {
            logger.debug('FFmpeg concat command:', cmd);
          })
          .on('end', () => {
            logger.info('Video extended successfully');
            res();
          })
          .on('error', (err) => {
            logger.error('Video extension failed:', err);
            rej(err);
          })
          .run();
      });

      // Cleanup temp files
      await fs.unlink(lastFramePath).catch(() => {});
      await fs.unlink(freezeFramePath).catch(() => {});
      await fs.unlink(concatListPath).catch(() => {});
      
      resolve();
    } catch (error) {
      logger.error('Video extension failed:', error);
      reject(error);
    }
  });
}

/**
 * Get audio duration in seconds
 */
export async function getAudioDuration(audioPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(audioPath, (err, metadata) => {
      if (err) {
        logger.error('Failed to get audio duration:', err);
        reject(err);
      } else {
        const duration = metadata.format.duration || 0;
        resolve(duration);
      }
    });
  });
}

/**
 * Extend audio with silence to match target duration
 * Uses audio filter instead of lavfi (Windows compatible)
 */
export async function extendAudio(
  inputPath: string,
  targetDuration: number,
  outputPath: string
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const currentDuration = await getAudioDuration(inputPath);
      const extendBy = targetDuration - currentDuration;
      
      if (extendBy <= 0) {
        logger.warn('Audio is already longer than target, no extension needed');
        await fs.copyFile(inputPath, outputPath);
        resolve();
        return;
      }
      
      logger.info(`Extending audio by ${extendBy.toFixed(2)}s with silence`, { inputPath });
      
      // Use FFmpeg audio filter to pad with silence (Windows compatible)
      // This is more reliable than lavfi input format
      await new Promise<void>((res, rej) => {
        ffmpeg(inputPath)
          .audioFilters([
            `apad=whole_dur=${targetDuration}` // Pad audio with silence to target duration
          ])
          .audioCodec('libmp3lame')
          .audioBitrate('128k')
          .output(outputPath)
          .on('start', (cmd) => {
            logger.debug('FFmpeg audio pad command:', cmd);
          })
          .on('end', () => {
            logger.info('Audio extended successfully with silence padding');
            res();
          })
          .on('error', (err) => {
            logger.error('Failed to extend audio with padding:', err);
            rej(err);
          })
          .run();
      });
      
      resolve();
    } catch (error) {
      logger.error('Audio extension failed:', error);
      reject(error);
    }
  });
}

/**
 * Match video duration to target (trim if longer, extend if shorter)
 * Also extends/trims audio to match
 */
export async function matchVideoDuration(
  inputPath: string,
  targetDuration: number,
  outputPath: string,
  audioPath?: string,
  tolerance: number = 1.0
): Promise<void> {
  try {
    const currentDuration = await getVideoDuration(inputPath);
    const difference = Math.abs(currentDuration - targetDuration);
    
    logger.info('Duration matching:', {
      current: currentDuration,
      target: targetDuration,
      difference,
      tolerance,
      hasAudio: !!audioPath
    });
    
    // If within tolerance, no need to adjust
    if (difference <= tolerance) {
      logger.info(`Video duration within tolerance (${difference}s ≈ ${tolerance}s), copying file`);
      await fs.copyFile(inputPath, outputPath);
      return;
    }
    
    // Trim if too long
    if (currentDuration > targetDuration) {
      logger.info(`Video too long (${currentDuration}s > ${targetDuration}s), trimming...`);
      await trimVideo(inputPath, targetDuration, outputPath);
      
      // If audio provided, trim it too
      if (audioPath) {
        const audioDuration = await getAudioDuration(audioPath);
        if (audioDuration > targetDuration + tolerance) {
          logger.info(`Audio too long (${audioDuration}s > ${targetDuration}s), trimming audio...`);
          const tempAudioPath = audioPath + '.trimmed.mp3';
          await new Promise<void>((resolve, reject) => {
            ffmpeg(audioPath)
              .setDuration(targetDuration)
              .output(tempAudioPath)
              .on('end', () => resolve())
              .on('error', reject)
              .run();
          });
          await fs.rename(tempAudioPath, audioPath);
          logger.info('Audio trimmed to match video duration');
        }
      }
    }
    // Extend if too short
    else {
      logger.info(`Video too short (${currentDuration}s < ${targetDuration}s), extending...`);
      
      // First extend audio if provided
      if (audioPath) {
        const audioDuration = await getAudioDuration(audioPath);
        if (audioDuration < targetDuration - tolerance) {
          logger.info(`Audio too short (${audioDuration}s < ${targetDuration}s), extending audio with silence...`);
          const tempAudioPath = audioPath + '.extended.mp3';
          await extendAudio(audioPath, targetDuration, tempAudioPath);
          await fs.rename(tempAudioPath, audioPath);
          logger.info('Audio extended to match target duration');
        }
      }
      
      // Then extend video
      await extendVideo(inputPath, targetDuration, outputPath);
    }
    
    // Verify final duration
    const finalDuration = await getVideoDuration(outputPath);
    logger.info(`Final video duration: ${finalDuration}s (target: ${targetDuration}s)`);
    
    if (audioPath) {
      const finalAudioDuration = await getAudioDuration(audioPath);
      logger.info(`Final audio duration: ${finalAudioDuration}s (target: ${targetDuration}s)`);
    }
    
  } catch (error) {
    logger.error('Duration matching failed:', error);
    throw error;
  }
}
