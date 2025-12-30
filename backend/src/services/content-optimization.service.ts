import logger from '../utils/logger';

/**
 * Content-Aware Optimization Service
 * Analyzes scenes and adjusts encoding/duration based on content complexity
 */

export interface SceneComplexity {
  sceneNumber: number;
  visualComplexity: 'low' | 'medium' | 'high';
  textLength: number;
  optimalDuration: number;
  recommendedCRF: number;
}

export interface AudioOptimizationSettings {
  sampleRate: number;
  bitrate: string;
  channels: number; // 1 = mono, 2 = stereo
  codec: 'aac' | 'opus';
}

/**
 * Analyze visual complexity of a scene based on description
 * Simple scenes (landscapes, single objects) can use higher CRF (more compression)
 * Complex scenes (crowds, detailed scenes) need lower CRF (better quality)
 */
export function analyzeVisualComplexity(imagePrompt: string): 'low' | 'medium' | 'high' {
  const prompt = imagePrompt.toLowerCase();
  
  // Keywords indicating high complexity
  const highComplexityKeywords = [
    'crowd', 'people', 'many', 'detailed', 'intricate', 'busy',
    'complex', 'multiple', 'group', 'city', 'market', 'festival'
  ];
  
  // Keywords indicating low complexity
  const lowComplexityKeywords = [
    'simple', 'single', 'one', 'plain', 'clear', 'minimal',
    'sky', 'water', 'landscape', 'mountain', 'field', 'ocean'
  ];
  
  const highMatches = highComplexityKeywords.filter(keyword => prompt.includes(keyword)).length;
  const lowMatches = lowComplexityKeywords.filter(keyword => prompt.includes(keyword)).length;
  
  if (highMatches > lowMatches && highMatches >= 2) {
    return 'high';
  } else if (lowMatches > highMatches && lowMatches >= 2) {
    return 'low';
  }
  
  return 'medium';
}

/**
 * Calculate optimal scene duration based on narration length
 * Faster reading for simple sentences, slower for complex ones
 */
export function calculateOptimalDuration(
  narration: string,
  baseWordsPerMinute: number = 140
): number {
  const words = narration.trim().split(/\s+/).length;
  
  // Adjust reading speed based on sentence complexity
  let adjustedWPM = baseWordsPerMinute;
  
  // Slower for longer sentences (more complex)
  if (words > 30) {
    adjustedWPM = baseWordsPerMinute * 0.9; // 10% slower
  } else if (words < 10) {
    adjustedWPM = baseWordsPerMinute * 1.1; // 10% faster
  }
  
  // Calculate duration in seconds
  const durationSeconds = (words / adjustedWPM) * 60;
  
  // Add 1-2 seconds buffer for comprehension
  const buffer = words > 20 ? 2 : 1;
  
  return Math.ceil(durationSeconds + buffer);
}

/**
 * Analyze scene and provide optimization recommendations
 */
export function analyzeScene(
  sceneNumber: number,
  imagePrompt: string,
  narration: string,
  baseQuality: 'low' | 'medium' | 'high'
): SceneComplexity {
  const visualComplexity = analyzeVisualComplexity(imagePrompt);
  const textLength = narration.length;
  const optimalDuration = calculateOptimalDuration(narration);
  
  // Adjust CRF based on visual complexity
  // Higher CRF = more compression (good for simple visuals)
  // Lower CRF = better quality (needed for complex visuals)
  const baseCRF = { low: 28, medium: 23, high: 20 }[baseQuality];
  
  let crfAdjustment = 0;
  if (visualComplexity === 'low') {
    crfAdjustment = +3; // More compression for simple scenes
  } else if (visualComplexity === 'high') {
    crfAdjustment = -2; // Better quality for complex scenes
  }
  
  const recommendedCRF = Math.max(18, Math.min(32, baseCRF + crfAdjustment));
  
  return {
    sceneNumber,
    visualComplexity,
    textLength,
    optimalDuration,
    recommendedCRF
  };
}

/**
 * Analyze all scenes for optimization
 */
export function analyzeScenes(
  scenes: Array<{ sceneNumber: number; imagePrompt: string; narration: string }>,
  baseQuality: 'low' | 'medium' | 'high'
): SceneComplexity[] {
  logger.info(`Analyzing ${scenes.length} scenes for content-aware optimization`);
  
  const analyses = scenes.map(scene =>
    analyzeScene(scene.sceneNumber, scene.imagePrompt, scene.narration, baseQuality)
  );
  
  // Log summary
  const avgComplexity = analyses.filter(a => a.visualComplexity === 'high').length / scenes.length;
  const avgDuration = analyses.reduce((sum, a) => sum + a.optimalDuration, 0) / scenes.length;
  
  logger.info(`Scene analysis complete`, {
    totalScenes: scenes.length,
    highComplexityPercent: (avgComplexity * 100).toFixed(1) + '%',
    avgOptimalDuration: avgDuration.toFixed(1) + 's'
  });
  
  return analyses;
}

/**
 * Get optimal audio settings based on content and quality
 */
export function getOptimalAudioSettings(
  quality: 'low' | 'medium' | 'high',
  contentType: 'narration' | 'music' | 'dialogue' = 'narration'
): AudioOptimizationSettings {
  // Narration doesn't need stereo or high sample rates
  // This can save 30-40% on audio file size
  
  if (contentType === 'narration') {
    // Voice-optimized settings
    const settingsMap = {
      low: {
        sampleRate: 22050, // 22kHz sufficient for voice
        bitrate: '64k',    // Mono voice at 64k is clear
        channels: 1,       // Mono for narration
        codec: 'aac' as const
      },
      medium: {
        sampleRate: 24000, // 24kHz for slightly better quality
        bitrate: '96k',    // Good quality for voice
        channels: 1,       // Mono
        codec: 'aac' as const
      },
      high: {
        sampleRate: 32000, // 32kHz for high quality voice
        bitrate: '128k',   // Excellent voice quality
        channels: 1,       // Still mono (stereo not needed for narration)
        codec: 'opus' as const // Opus codec better for speech
      }
    };
    
    return settingsMap[quality];
  }
  
  // Music/dialogue needs better quality
  const settingsMap = {
    low: {
      sampleRate: 44100,
      bitrate: '96k',
      channels: 2,
      codec: 'aac' as const
    },
    medium: {
      sampleRate: 44100,
      bitrate: '128k',
      channels: 2,
      codec: 'aac' as const
    },
    high: {
      sampleRate: 48000,
      bitrate: '192k',
      channels: 2,
      codec: 'opus' as const
    }
  };
  
  return settingsMap[quality];
}

/**
 * Calculate estimated file size savings from optimizations
 */
export function estimateOptimizationSavings(
  sceneAnalyses: SceneComplexity[],
  baseQuality: 'low' | 'medium' | 'high',
  videoDurationSeconds: number
): {
  visualOptimizationSavings: number; // Percentage
  audioOptimizationSavings: number;  // Percentage
  totalSavings: number;              // Percentage
  estimatedFileSizeMB: number;
} {
  // Calculate average CRF increase from content-aware optimization
  const baseCRF = { low: 28, medium: 23, high: 20 }[baseQuality];
  const avgCRF = sceneAnalyses.reduce((sum, a) => sum + a.recommendedCRF, 0) / sceneAnalyses.length;
  const crfIncrease = avgCRF - baseCRF;
  
  // Each CRF increase of ~6 halves the file size
  // So each CRF point saves about 8-10%
  const visualSavings = Math.max(0, crfIncrease * 9); // 9% per CRF point
  
  // Audio optimization savings (mono vs stereo, lower bitrate)
  const audioSavings = baseQuality === 'high' ? 30 : baseQuality === 'medium' ? 25 : 15;
  
  // Combined savings (not additive, use compound)
  const totalSavings = visualSavings + audioSavings - (visualSavings * audioSavings / 100);
  
  // Estimate file size
  const baseFileSizePerMinute = { low: 4, medium: 8, high: 16 }[baseQuality]; // MB per minute
  const durationMinutes = videoDurationSeconds / 60;
  const baseFileSize = baseFileSizePerMinute * durationMinutes;
  const optimizedFileSize = baseFileSize * (1 - totalSavings / 100);
  
  return {
    visualOptimizationSavings: Math.round(visualSavings),
    audioOptimizationSavings: Math.round(audioSavings),
    totalSavings: Math.round(totalSavings),
    estimatedFileSizeMB: Math.round(optimizedFileSize * 10) / 10
  };
}

/**
 * Apply fine-tuning to encoding settings based on scene analysis
 */
export function fineTuneEncodingSettings(
  sceneAnalysis: SceneComplexity,
  baseSettings: {
    crf: number;
    preset: string;
    audioBitrate: string;
  }
): {
  crf: number;
  preset: string;
  audioBitrate: string;
} {
  return {
    crf: sceneAnalysis.recommendedCRF,
    preset: baseSettings.preset,
    audioBitrate: baseSettings.audioBitrate
  };
}

/**
 * Get scene-specific encoding settings with content-aware optimization
 */
export interface SceneEncodingSettings {
  sceneNumber: number;
  crf: number;
  duration: number;
  complexity: 'low' | 'medium' | 'high';
}

export function getSceneEncodingSettings(
  scenes: Array<{ sceneNumber: number; imagePrompt: string; narration: string }>,
  baseQuality: 'low' | 'medium' | 'high'
): SceneEncodingSettings[] {
  const analyses = analyzeScenes(scenes, baseQuality);
  
  return analyses.map(analysis => ({
    sceneNumber: analysis.sceneNumber,
    crf: analysis.recommendedCRF,
    duration: analysis.optimalDuration,
    complexity: analysis.visualComplexity
  }));
}
