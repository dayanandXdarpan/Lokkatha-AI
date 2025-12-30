import * as indicTTS from './indic-tts.service';
import * as googleTTS from './tts.service';
import logger from '../utils/logger';

/**
 * Unified TTS Orchestrator
 * Intelligently routes TTS requests to Indic-TTS or Google Cloud TTS
 * with automatic fallback capability
 */

export type TTSProvider = 'indic-tts' | 'google-cloud' | 'auto';

export interface UnifiedTTSParams {
  text: string;
  language: string;
  outputPath: string;
  provider?: TTSProvider;
  voiceGender?: 'MALE' | 'FEMALE' | 'NEUTRAL';
  speakingRate?: number;
  pitch?: number;
  volumeGain?: number;
  useSSML?: boolean;
  ssmlText?: string;
}

/**
 * Configuration for TTS providers
 */
const config = {
  primaryProvider: (process.env.TTS_PRIMARY_PROVIDER || 'indic-tts') as TTSProvider,
  fallbackProvider: (process.env.TTS_FALLBACK_PROVIDER || 'google-cloud') as TTSProvider,
  enableFallback: true,
};

/**
 * Determine the best TTS provider for a given language
 */
function selectProvider(language: string, requestedProvider?: TTSProvider): TTSProvider {
  // If specific provider requested, use it
  if (requestedProvider && requestedProvider !== 'auto') {
    return requestedProvider;
  }

  // Check if Indic-TTS supports this language
  if (indicTTS.isLanguageSupported(language)) {
    return config.primaryProvider;
  }

  // Fallback to Google Cloud TTS
  return 'google-cloud';
}

/**
 * Generate speech using the unified TTS orchestrator
 * Automatically selects best provider and handles fallback
 */
export async function generateUnifiedSpeech(params: UnifiedTTSParams): Promise<{
  audioPath: string;
  provider: TTSProvider;
  fallbackUsed: boolean;
}> {
  const {
    text,
    language,
    outputPath,
    provider = 'auto',
    voiceGender = 'NEUTRAL',
    speakingRate = 1.0,
    pitch = 0,
    volumeGain = 0,
    useSSML = false,
    ssmlText,
  } = params;

  const selectedProvider = selectProvider(language, provider);

  logger.info('Unified TTS orchestrator processing request', {
    language,
    requestedProvider: provider,
    selectedProvider,
    textLength: text.length,
  });

  try {
    // Try primary provider
    if (selectedProvider === 'indic-tts') {
      logger.info('Attempting speech generation with Indic-TTS');
      
      // Map voice gender to Indic-TTS format
      const gender = voiceGender === 'MALE' ? 'male' : 'female';
      
      const audioPath = await indicTTS.generateIndicSpeech({
        text,
        language,
        outputPath,
        gender,
        speakingRate,
      });

      return {
        audioPath,
        provider: 'indic-tts',
        fallbackUsed: false,
      };
    } else {
      logger.info('Attempting speech generation with Google Cloud TTS');
      
      const audioPath = await googleTTS.generateSpeech({
        text,
        language,
        outputPath,
        voiceGender,
        speakingRate,
        pitch,
        volumeGain,
        useSSML,
        ssmlText,
      });

      return {
        audioPath,
        provider: 'google-cloud',
        fallbackUsed: false,
      };
    }
  } catch (error: any) {
    logger.warn(`Primary TTS provider (${selectedProvider}) failed:`, error.message);

    // Try fallback if enabled
    if (config.enableFallback) {
      logger.info(`Attempting fallback to ${config.fallbackProvider}`);
      
      try {
        if (config.fallbackProvider === 'google-cloud') {
          const audioPath = await googleTTS.generateSpeech({
            text,
            language,
            outputPath,
            voiceGender,
            speakingRate,
            pitch,
            volumeGain,
            useSSML,
            ssmlText,
          });

          return {
            audioPath,
            provider: 'google-cloud',
            fallbackUsed: true,
          };
        } else {
          // Fallback to Indic-TTS
          const gender = voiceGender === 'MALE' ? 'male' : 'female';
          const audioPath = await indicTTS.generateIndicSpeech({
            text,
            language,
            outputPath,
            gender,
            speakingRate,
          });

          return {
            audioPath,
            provider: 'indic-tts',
            fallbackUsed: true,
          };
        }
      } catch (fallbackError: any) {
        logger.error('Fallback TTS provider also failed:', fallbackError);
        throw new Error(
          `All TTS providers failed. Primary: ${error.message}, Fallback: ${fallbackError.message}`
        );
      }
    }

    // No fallback, throw original error
    throw error;
  }
}

/**
 * Generate speech for multiple scenes with unified orchestrator
 */
export async function generateUnifiedSpeechForScenes(
  scenes: Array<{ narration: string; sceneNumber: number }>,
  language: string,
  outputDir: string,
  provider: TTSProvider = 'auto'
): Promise<{
  audioFiles: string[];
  provider: TTSProvider;
  fallbackUsed: boolean;
}> {
  logger.info(`Generating speech for ${scenes.length} scenes with unified orchestrator`);

  const audioFiles: string[] = [];
  let usedProvider: TTSProvider = 'google-cloud';
  let anyFallbackUsed = false;

  for (const scene of scenes) {
    const outputPath = `${outputDir}/scene_${scene.sceneNumber}.mp3`;
    
    const result = await generateUnifiedSpeech({
      text: scene.narration,
      language,
      outputPath,
      provider,
    });

    audioFiles.push(result.audioPath);
    usedProvider = result.provider;
    
    if (result.fallbackUsed) {
      anyFallbackUsed = true;
    }
  }

  logger.info(`Generated ${audioFiles.length} audio files`, {
    provider: usedProvider,
    fallbackUsed: anyFallbackUsed,
  });

  return {
    audioFiles,
    provider: usedProvider,
    fallbackUsed: anyFallbackUsed,
  };
}

/**
 * Get TTS capabilities for a language
 */
export function getTTSCapabilities(language: string): {
  indicTTSSupported: boolean;
  googleCloudSupported: boolean;
  recommendedProvider: TTSProvider;
  availableVoices: {
    indicTTS: string[];
    googleCloud: string[];
  };
} {
  const indicTTSSupported = indicTTS.isLanguageSupported(language);
  const googleCloudSupported = true; // Google Cloud TTS supports all languages
  
  return {
    indicTTSSupported,
    googleCloudSupported,
    recommendedProvider: indicTTSSupported ? 'indic-tts' : 'google-cloud',
    availableVoices: {
      indicTTS: indicTTS.getAvailableVoices(language),
      googleCloud: [], // Would need to query Google Cloud API
    },
  };
}

/**
 * Test connectivity to all TTS providers
 */
export async function testAllProviders(): Promise<{
  indicTTS: boolean;
  googleCloud: boolean;
}> {
  logger.info('Testing connectivity to all TTS providers');

  const results = {
    indicTTS: false,
    googleCloud: false,
  };

  try {
    results.indicTTS = await indicTTS.testIndicTTSConnection();
    logger.info('Indic-TTS connection test:', results.indicTTS ? 'PASSED' : 'FAILED');
  } catch (error) {
    logger.error('Indic-TTS connection test failed:', error);
  }

  try {
    // Test Google Cloud TTS by listing voices
    await googleTTS.getAvailableVoices('en-IN');
    results.googleCloud = true;
    logger.info('Google Cloud TTS connection test: PASSED');
  } catch (error) {
    logger.error('Google Cloud TTS connection test failed:', error);
  }

  return results;
}

/**
 * Generate SSML text for advanced speech control
 * This wraps the Google TTS SSML generator
 */
export function generateSSML(text: string, options?: googleTTS.SSMLOptions): string {
  return googleTTS.generateSSML(text, options);
}

// Export types for external use
export type { SSMLOptions } from './tts.service';
