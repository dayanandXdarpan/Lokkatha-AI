import axios from 'axios';
import { promises as fs } from 'fs';
import path from 'path';
import logger from '../utils/logger';

/**
 * AI4Bharat Indic-TTS Service
 * Documentation: https://github.com/AI4Bharat/Indic-TTS
 */

const INDIC_TTS_API_URL = process.env.INDIC_TTS_API_URL || 'https://models.ai4bharat.org';

export interface IndicTTSParams {
  text: string;
  language: string;
  outputPath: string;
  gender?: 'male' | 'female';
  speakingRate?: number;
}

/**
 * Language code mapping for Indic-TTS
 * Supported languages: Hindi, Bengali, Rajasthani, Tamil, Telugu, Gujarati, 
 * Kannada, Malayalam, Punjabi, Marathi, Odia, Assamese
 */
const indicLanguageCodeMap: Record<string, string> = {
  'Hindi': 'hi',
  'Bengali': 'bn',
  'Tamil': 'ta',
  'Telugu': 'te',
  'Gujarati': 'gu',
  'Kannada': 'kn',
  'Malayalam': 'ml',
  'Punjabi': 'pa',
  'Marathi': 'mr',
  'Odia': 'or',
  'Assamese': 'as',
  'Rajasthani': 'raj',
};

/**
 * Voice names for Indic-TTS (speaker IDs)
 */
const voiceNameMap: Record<string, { male: string; female: string }> = {
  'hi': { male: 'hi_male', female: 'hi_female' },
  'bn': { male: 'bn_male', female: 'bn_female' },
  'ta': { male: 'ta_male', female: 'ta_female' },
  'te': { male: 'te_male', female: 'te_female' },
  'gu': { male: 'gu_male', female: 'gu_female' },
  'kn': { male: 'kn_male', female: 'kn_female' },
  'ml': { male: 'ml_male', female: 'ml_female' },
  'pa': { male: 'pa_male', female: 'pa_female' },
  'mr': { male: 'mr_male', female: 'mr_female' },
  'or': { male: 'or_male', female: 'or_female' },
  'as': { male: 'as_male', female: 'as_female' },
  'raj': { male: 'raj_male', female: 'raj_female' },
};

/**
 * Check if a language is supported by Indic-TTS
 */
export function isLanguageSupported(language: string): boolean {
  return language in indicLanguageCodeMap;
}

/**
 * Get supported languages
 */
export function getSupportedLanguages(): string[] {
  return Object.keys(indicLanguageCodeMap);
}

/**
 * Generate speech using AI4Bharat Indic-TTS
 */
export async function generateIndicSpeech(params: IndicTTSParams): Promise<string> {
  try {
    const {
      text,
      language,
      outputPath,
      gender = 'female',
      speakingRate = 1.0,
    } = params;

    // Check if language is supported
    if (!isLanguageSupported(language)) {
      throw new Error(
        `Language "${language}" is not supported by Indic-TTS. Supported: ${getSupportedLanguages().join(', ')}`
      );
    }

    logger.info('Generating speech with AI4Bharat Indic-TTS', {
      language,
      textLength: text.length,
      gender,
      speakingRate,
    });

    const languageCode = indicLanguageCodeMap[language];
    const voiceName = voiceNameMap[languageCode]?.[gender] || voiceNameMap[languageCode]?.female;

    // Prepare request payload
    const requestPayload = {
      input: text,
      gender: gender,
      lang: languageCode,
      speaker: voiceName,
      speed: speakingRate, // Speed control (0.5 to 2.0)
    };

    // Make request to Indic-TTS API
    const response = await axios.post(
      `${INDIC_TTS_API_URL}/tts/synthesize`,
      requestPayload,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer',
        timeout: 60000, // 60 seconds timeout
      }
    );

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    await fs.mkdir(outputDir, { recursive: true });

    // Write the audio content to file
    await fs.writeFile(outputPath, Buffer.from(response.data));
    
    logger.info(`Indic-TTS audio file generated: ${outputPath}`);
    return outputPath;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      logger.error('Indic-TTS API request failed:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
      throw new Error(
        `Indic-TTS API failed: ${error.response?.status} ${error.response?.statusText}`
      );
    }
    
    logger.error('Failed to generate speech with Indic-TTS:', error);
    throw new Error(`Indic-TTS generation failed: ${error.message}`);
  }
}

/**
 * Generate speech for multiple text segments using Indic-TTS
 */
export async function generateIndicSpeechForScenes(
  scenes: Array<{ narration: string; sceneNumber: number }>,
  language: string,
  outputDir: string
): Promise<string[]> {
  try {
    if (!isLanguageSupported(language)) {
      throw new Error(`Language "${language}" is not supported by Indic-TTS`);
    }

    logger.info(`Generating speech for ${scenes.length} scenes with Indic-TTS`);

    const audioFiles: string[] = [];

    // Generate audio for each scene sequentially (to avoid rate limits)
    for (const scene of scenes) {
      const outputPath = path.join(outputDir, `scene_${scene.sceneNumber}.mp3`);
      await generateIndicSpeech({
        text: scene.narration,
        language,
        outputPath,
      });
      audioFiles.push(outputPath);
      
      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    logger.info(`Generated ${audioFiles.length} audio files with Indic-TTS`);
    return audioFiles;
  } catch (error: any) {
    logger.error('Failed to generate speech for scenes with Indic-TTS:', error);
    throw error;
  }
}

/**
 * Test Indic-TTS API connectivity
 */
export async function testIndicTTSConnection(): Promise<boolean> {
  try {
    const response = await axios.get(`${INDIC_TTS_API_URL}/health`, {
      timeout: 10000,
    });
    return response.status === 200;
  } catch (error) {
    logger.error('Indic-TTS API health check failed:', error);
    return false;
  }
}

/**
 * Get available voices for a language
 */
export function getAvailableVoices(language: string): string[] {
  const languageCode = indicLanguageCodeMap[language];
  if (!languageCode || !voiceNameMap[languageCode]) {
    return [];
  }
  return Object.values(voiceNameMap[languageCode]);
}
