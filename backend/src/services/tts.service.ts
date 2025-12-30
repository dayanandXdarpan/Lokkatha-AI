import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { promises as fs } from 'fs';
import path from 'path';
import logger from '../utils/logger';

// Initialize Google TTS client
const ttsClient = new TextToSpeechClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

export interface TTSParams {
  text: string;
  language: string;
  outputPath: string;
  voiceGender?: 'MALE' | 'FEMALE' | 'NEUTRAL';
  speakingRate?: number;
  pitch?: number;
  volumeGain?: number;
  useSSML?: boolean;
  ssmlText?: string;
  voiceName?: string;
}

export interface SSMLOptions {
  emphasis?: 'strong' | 'moderate' | 'reduced' | 'none';
  breakTime?: string; // e.g., "500ms", "2s"
  prosody?: {
    rate?: string; // e.g., "slow", "medium", "fast", "80%", "120%"
    pitch?: string; // e.g., "low", "medium", "high", "+2st", "-3st"
    volume?: string; // e.g., "soft", "medium", "loud", "+6dB", "-3dB"
  };
}

/**
 * Language code mapping
 */
const languageCodeMap: Record<string, string> = {
  'English': 'en-IN',
  'Hindi': 'hi-IN',
  'Tamil': 'ta-IN',
  'Telugu': 'te-IN',
  'Marathi': 'mr-IN',
  'Bengali': 'bn-IN',
  'Gujarati': 'gu-IN',
  'Kannada': 'kn-IN',
  'Malayalam': 'ml-IN',
  'Punjabi': 'pa-IN',
};

/**
 * Generate SSML text with advanced markup
 */
export function generateSSML(text: string, options?: SSMLOptions): string {
  let ssml = '<speak>';
  
  if (options?.prosody) {
    const { rate, pitch, volume } = options.prosody;
    const prosodyAttrs: string[] = [];
    
    if (rate) prosodyAttrs.push(`rate="${rate}"`);
    if (pitch) prosodyAttrs.push(`pitch="${pitch}"`);
    if (volume) prosodyAttrs.push(`volume="${volume}"`);
    
    ssml += `<prosody ${prosodyAttrs.join(' ')}>`;
  }
  
  if (options?.emphasis && options.emphasis !== 'none') {
    ssml += `<emphasis level="${options.emphasis}">${text}</emphasis>`;
  } else {
    ssml += text;
  }
  
  if (options?.prosody) {
    ssml += '</prosody>';
  }
  
  if (options?.breakTime) {
    ssml += `<break time="${options.breakTime}"/>`;
  }
  
  ssml += '</speak>';
  
  return ssml;
}

/**
 * Convert text to speech using Google TTS with SSML support
 */
export async function generateSpeech(params: TTSParams): Promise<string> {
  try {
    const {
      text,
      language,
      outputPath,
      voiceGender = 'NEUTRAL',
      speakingRate = parseFloat(process.env.DEFAULT_SPEAKING_RATE || '1.0'),
      pitch = parseFloat(process.env.DEFAULT_PITCH || '0.0'),
      volumeGain = parseFloat(process.env.DEFAULT_VOLUME_GAIN || '0.0'),
      useSSML = process.env.ENABLE_SSML === 'true',
      ssmlText,
      voiceName,
    } = params;

    logger.info('Generating speech with Google Cloud TTS', {
      language,
      textLength: text.length,
      useSSML,
      speakingRate,
      pitch,
      volumeGain,
    });

    // Get language code
    const languageCode = languageCodeMap[language] || 'en-IN';

    // Prepare input (SSML or plain text)
    const input = useSSML && ssmlText 
      ? { ssml: ssmlText }
      : useSSML 
        ? { ssml: generateSSML(text) }
        : { text };

    // Configure voice settings
    const voice: any = {
      languageCode,
      ssmlGender: voiceGender as any,
    };
    
    // Use specific voice name if provided (better quality)
    if (voiceName) {
      voice.name = voiceName;
    }

    // Configure the TTS request with SSML support
    const request = {
      input,
      voice,
      audioConfig: {
        audioEncoding: 'MP3' as any,
        speakingRate, // 0.25 to 4.0 (1.0 is normal)
        pitch, // -20.0 to 20.0 (0.0 is normal)
        volumeGainDb: volumeGain, // -96.0 to 16.0 (0.0 is normal)
        effectsProfileId: ['headphone-class-device'], // Optimize for headphones
      },
    };

    // Perform the text-to-speech request
    const [response] = await ttsClient.synthesizeSpeech(request);

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    await fs.mkdir(outputDir, { recursive: true });

    // Write the binary audio content to file
    if (response.audioContent) {
      await fs.writeFile(outputPath, response.audioContent, 'binary');
      logger.info(`Audio file generated with SSML: ${outputPath}`);
      return outputPath;
    } else {
      throw new Error('No audio content received from TTS API');
    }
  } catch (error: any) {
    logger.error('Failed to generate speech:', error);
    throw new Error(`Google Cloud TTS generation failed: ${error.message}`);
  }
}

/**
 * Generate speech for multiple text segments
 */
export async function generateSpeechForScenes(
  scenes: Array<{ narration: string; sceneNumber: number }>,
  language: string,
  outputDir: string
): Promise<string[]> {
  try {
    logger.info(`Generating speech for ${scenes.length} scenes`);

    const audioFiles: string[] = [];

    // Generate audio for each scene in parallel
    const promises = scenes.map(async (scene) => {
      const outputPath = path.join(outputDir, `scene_${scene.sceneNumber}.mp3`);
      await generateSpeech({
        text: scene.narration,
        language,
        outputPath,
      });
      return outputPath;
    });

    const results = await Promise.all(promises);
    audioFiles.push(...results);

    logger.info(`Generated ${audioFiles.length} audio files`);
    return audioFiles;
  } catch (error: any) {
    logger.error('Failed to generate speech for scenes:', error);
    throw error;
  }
}

/**
 * Get estimated audio duration from text
 * Rough estimation: average speaking rate is ~150 words per minute
 */
export function estimateAudioDuration(text: string): number {
  const words = text.trim().split(/\s+/).length;
  const minutes = words / 150;
  const seconds = Math.ceil(minutes * 60);
  return seconds;
}

/**
 * Split long text into smaller chunks for better TTS quality
 */
export function splitTextIntoChunks(text: string, maxLength: number = 5000): string[] {
  const chunks: string[] = [];
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  
  let currentChunk = '';
  
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxLength) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        // Single sentence is longer than maxLength, split it
        chunks.push(sentence.trim());
      }
    } else {
      currentChunk += sentence;
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

/**
 * Get available voices for a language
 */
export async function getAvailableVoices(languageCode: string) {
  try {
    const [result] = await ttsClient.listVoices({ languageCode });
    return result.voices;
  } catch (error) {
    logger.error(`Failed to get voices for ${languageCode}:`, error);
    throw error;
  }
}
