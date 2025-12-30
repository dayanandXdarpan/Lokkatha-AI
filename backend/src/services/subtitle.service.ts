import { promises as fs } from 'fs';
import path from 'path';
import logger from '../utils/logger';

/**
 * Subtitle Generation Service with Multi-language Support
 * Generates SRT and WebVTT subtitle files with proper character encoding
 */

export interface SubtitleSegment {
  index: number;
  startTime: number; // seconds
  endTime: number; // seconds
  text: string;
  language?: string;
}

/**
 * Format time for SRT (00:00:00,000)
 */
function formatSRTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const milliseconds = Math.floor((seconds % 1) * 1000);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`;
}

/**
 * Format time for WebVTT (00:00:00.000)
 */
function formatVTTTime(seconds: number): string {
  const srtTime = formatSRTTime(seconds);
  return srtTime.replace(',', '.');
}

/**
 * Split text into subtitle-friendly chunks
 * Max 2 lines, ~40 characters per line for readability
 */
export function splitTextIntoSubtitleChunks(text: string, language: string): string[] {
  const maxCharsPerLine = 40;
  
  // Language-specific word separators
  const wordSeparators: Record<string, RegExp> = {
    'Hindi': /[\s।,;:!?]+/,
    'Tamil': /[\s.,;:!?]+/,
    'Telugu': /[\s.,;:!?]+/,
    'Bengali': /[\s।,;:!?]+/,
    'Marathi': /[\s।,;:!?]+/,
    'English': /[\s,;:!?]+/,
    'default': /[\s,;:!?]+/
  };
  
  const separator = wordSeparators[language] || wordSeparators['default'];
  const words = text.split(separator).filter(w => w.trim().length > 0);
  
  const chunks: string[] = [];
  let currentChunk = '';
  let currentLine = '';
  let lineCount = 0;
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    
    if (testLine.length > maxCharsPerLine) {
      if (currentLine) {
        if (lineCount === 0) {
          currentChunk = currentLine;
          lineCount = 1;
          currentLine = word;
        } else {
          // Complete current chunk
          currentChunk += '\n' + currentLine;
          chunks.push(currentChunk.trim());
          
          // Start new chunk
          currentChunk = '';
          currentLine = word;
          lineCount = 0;
        }
      } else {
        // Single word too long, add as is
        if (lineCount === 0) {
          currentChunk = word;
          lineCount = 1;
          currentLine = '';
        } else {
          currentChunk += '\n' + word;
          chunks.push(currentChunk.trim());
          currentChunk = '';
          currentLine = '';
          lineCount = 0;
        }
      }
    } else {
      currentLine = testLine;
    }
  }
  
  // Add remaining text
  if (currentLine) {
    if (lineCount === 0) {
      chunks.push(currentLine.trim());
    } else {
      chunks.push((currentChunk + '\n' + currentLine).trim());
    }
  } else if (currentChunk) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

/**
 * Generate SRT subtitle file from segments
 */
export async function generateSRT(
  segments: SubtitleSegment[],
  outputPath: string,
  language: string = 'English'
): Promise<string> {
  try {
    let srtContent = '';
    
    for (const segment of segments) {
      srtContent += `${segment.index}\n`;
      srtContent += `${formatSRTTime(segment.startTime)} --> ${formatSRTTime(segment.endTime)}\n`;
      srtContent += `${segment.text}\n\n`;
    }
    
    // Write with UTF-8 encoding to support all languages
    await fs.writeFile(outputPath, srtContent, { encoding: 'utf-8' });
    
    logger.info(`Generated SRT subtitle file: ${outputPath}`, {
      language,
      segments: segments.length,
      size: srtContent.length
    });
    
    return outputPath;
  } catch (error: any) {
    logger.error('Failed to generate SRT subtitles', { error: error.message });
    throw error;
  }
}

/**
 * Generate WebVTT subtitle file from segments
 */
export async function generateWebVTT(
  segments: SubtitleSegment[],
  outputPath: string,
  language: string = 'English'
): Promise<string> {
  try {
    let vttContent = 'WEBVTT\n\n';
    
    // Add language metadata
    vttContent += `NOTE\nLanguage: ${language}\n\n`;
    
    for (const segment of segments) {
      vttContent += `${segment.index}\n`;
      vttContent += `${formatVTTTime(segment.startTime)} --> ${formatVTTTime(segment.endTime)}\n`;
      vttContent += `${segment.text}\n\n`;
    }
    
    // Write with UTF-8 encoding
    await fs.writeFile(outputPath, vttContent, { encoding: 'utf-8' });
    
    logger.info(`Generated WebVTT subtitle file: ${outputPath}`, {
      language,
      segments: segments.length,
      size: vttContent.length
    });
    
    return outputPath;
  } catch (error: any) {
    logger.error('Failed to generate WebVTT subtitles', { error: error.message });
    throw error;
  }
}

/**
 * Generate subtitles from script scenes with audio duration matching
 */
export async function generateSubtitlesFromScenes(
  scenes: Array<{
    sceneNumber: number;
    narration: string;
    audioDuration?: number; // Actual audio duration in seconds
  }>,
  outputDir: string,
  language: string = 'English',
  format: 'srt' | 'vtt' | 'both' = 'both'
): Promise<{ srt?: string; vtt?: string }> {
  try {
    const segments: SubtitleSegment[] = [];
    let currentTime = 0;
    let segmentIndex = 1;
    
    for (const scene of scenes) {
      // Calculate duration based on audio or estimate from text
      const duration = scene.audioDuration || estimateDuration(scene.narration, language);
      
      // Split narration into subtitle chunks
      const chunks = splitTextIntoSubtitleChunks(scene.narration, language);
      const chunkDuration = duration / chunks.length;
      
      for (const chunk of chunks) {
        segments.push({
          index: segmentIndex++,
          startTime: currentTime,
          endTime: currentTime + chunkDuration,
          text: chunk,
          language
        });
        
        currentTime += chunkDuration;
      }
    }
    
    const result: { srt?: string; vtt?: string } = {};
    
    // Generate SRT
    if (format === 'srt' || format === 'both') {
      const srtPath = path.join(outputDir, 'subtitles.srt');
      result.srt = await generateSRT(segments, srtPath, language);
    }
    
    // Generate WebVTT
    if (format === 'vtt' || format === 'both') {
      const vttPath = path.join(outputDir, 'subtitles.vtt');
      result.vtt = await generateWebVTT(segments, vttPath, language);
    }
    
    return result;
  } catch (error: any) {
    logger.error('Failed to generate subtitles from scenes', { error: error.message });
    throw error;
  }
}

/**
 * Estimate duration from text length (language-specific speaking rates)
 */
function estimateDuration(text: string, language: string): number {
  const speakingRates: Record<string, number> = {
    'English': 140, // words per minute
    'Hindi': 150,
    'Tamil': 130,
    'Telugu': 145,
    'Marathi': 150,
    'Bengali': 140,
    'Gujarati': 145,
    'Kannada': 135,
    'Malayalam': 130,
    'Punjabi': 150
  };
  
  const rate = speakingRates[language] || 140;
  
  // Count words (handle different scripts)
  const words = text.split(/[\s।,;:!?]+/).filter(w => w.trim().length > 0).length;
  
  const minutes = words / rate;
  return Math.max(3, Math.ceil(minutes * 60)); // Minimum 3 seconds
}

/**
 * Adjust subtitle timing based on actual audio durations
 */
export function adjustSubtitleTiming(
  segments: SubtitleSegment[],
  audioDurations: number[]
): SubtitleSegment[] {
  if (segments.length !== audioDurations.length) {
    logger.warn('Subtitle segments and audio durations count mismatch', {
      segments: segments.length,
      audio: audioDurations.length
    });
    return segments;
  }
  
  let currentTime = 0;
  
  return segments.map((segment, index) => {
    const startTime = currentTime;
    const duration = audioDurations[index];
    const endTime = startTime + duration;
    
    currentTime = endTime;
    
    return {
      ...segment,
      startTime,
      endTime
    };
  });
}

/**
 * Convert SRT to WebVTT format
 */
export async function convertSRTtoVTT(
  srtPath: string,
  vttPath: string
): Promise<string> {
  try {
    const srtContent = await fs.readFile(srtPath, 'utf-8');
    
    // Convert time format from SRT (,) to VTT (.)
    const vttContent = 'WEBVTT\n\n' + srtContent.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
    
    await fs.writeFile(vttPath, vttContent, 'utf-8');
    
    logger.info(`Converted SRT to WebVTT: ${vttPath}`);
    return vttPath;
  } catch (error: any) {
    logger.error('Failed to convert SRT to WebVTT', { error: error.message });
    throw error;
  }
}

/**
 * Validate subtitle file encoding and content
 */
export async function validateSubtitles(filePath: string): Promise<{
  valid: boolean;
  encoding: string;
  segments: number;
  errors: string[];
}> {
  const errors: string[] = [];
  
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    
    // Check if content is readable (not garbled)
    const hasGarbledText = /[\uFFFD]/.test(content);
    if (hasGarbledText) {
      errors.push('File contains garbled characters (encoding issue)');
    }
    
    // Count segments
    const isSRT = filePath.endsWith('.srt');
    const isVTT = filePath.endsWith('.vtt');
    
    let segments = 0;
    if (isSRT) {
      segments = (content.match(/\d+\n\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}/g) || []).length;
    } else if (isVTT) {
      segments = (content.match(/\d+\n\d{2}:\d{2}:\d{2}\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3}/g) || []).length;
    }
    
    if (segments === 0) {
      errors.push('No valid subtitle segments found');
    }
    
    return {
      valid: errors.length === 0,
      encoding: 'UTF-8',
      segments,
      errors
    };
  } catch (error: any) {
    return {
      valid: false,
      encoding: 'unknown',
      segments: 0,
      errors: [error.message]
    };
  }
}

export default {
  generateSRT,
  generateWebVTT,
  generateSubtitlesFromScenes,
  splitTextIntoSubtitleChunks,
  adjustSubtitleTiming,
  convertSRTtoVTT,
  validateSubtitles
};
