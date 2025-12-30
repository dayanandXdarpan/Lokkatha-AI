/**
 * Language and Dialect Validation API
 * Provides information about TTS support for various languages and dialects
 */

import { Router, Request, Response } from 'express';
import { getAllDialects, getDialectByName } from '../config/dialects';
import { languageCodeMap } from '../services/tts.service';
import * as indicTTS from '../services/indic-tts.service';
import logger from '../utils/logger';

const router = Router();

/**
 * Interface for language support information
 */
interface LanguageSupportInfo {
  name: string;
  languageCode: string;
  hasGoogleTTS: boolean;
  hasIndicTTS: boolean;
  isWavenet: boolean; // Premium quality voice
  fallbackRequired: boolean;
  fallbackTo?: string;
  supportLevel: 'full' | 'standard' | 'limited' | 'fallback';
  warning?: string;
}

/**
 * Check if a language code has Wavenet (premium) support
 */
function hasWavenetSupport(languageCode: string): boolean {
  const wavenetCodes = ['hi-IN', 'en-IN', 'ta-IN', 'mr-IN', 'bn-IN', 'gu-IN', 'kn-IN', 'ml-IN', 'pa-IN'];
  return wavenetCodes.includes(languageCode);
}

/**
 * Determine support level for a language
 */
function getLanguageSupportLevel(
  languageCode: string,
  hasGoogleTTS: boolean,
  hasIndicTTS: boolean,
  isWavenet: boolean
): 'full' | 'standard' | 'limited' | 'fallback' {
  if (isWavenet && (hasGoogleTTS || hasIndicTTS)) return 'full';
  if (hasGoogleTTS && hasIndicTTS) return 'full';
  if (hasGoogleTTS || hasIndicTTS) return 'standard';
  if (languageCode.includes('-IN')) return 'limited';
  return 'fallback';
}

/**
 * GET /api/languages/validate/:languageOrDialect
 * Validate if a language or dialect is supported and get capabilities
 */
router.get('/validate/:languageOrDialect', (req: Request, res: Response) => {
  try {
    const { languageOrDialect } = req.params;
    
    // Try to find dialect first
    const dialect = getDialectByName(languageOrDialect);
    const baseLanguage = dialect?.language || languageOrDialect;
    const languageCode = dialect?.languageCode || languageCodeMap[baseLanguage] || 'hi-IN';
    
    const hasGoogleTTS = !!languageCodeMap[baseLanguage];
    const hasIndicTTS = indicTTS.isLanguageSupported(baseLanguage);
    const isWavenet = hasWavenetSupport(languageCode);
    const supportLevel = getLanguageSupportLevel(languageCode, hasGoogleTTS, hasIndicTTS, isWavenet);
    
    const info: LanguageSupportInfo = {
      name: dialect?.name || baseLanguage,
      languageCode,
      hasGoogleTTS,
      hasIndicTTS,
      isWavenet,
      fallbackRequired: supportLevel === 'fallback' || supportLevel === 'limited',
      supportLevel,
    };
    
    // Add warnings for limited support
    if (supportLevel === 'limited') {
      info.warning = `Limited TTS support for ${info.name}. Audio quality may vary.`;
      info.fallbackTo = 'Hindi';
    } else if (supportLevel === 'fallback') {
      info.warning = `No native TTS support for ${info.name}. Will use Hindi fallback.`;
      info.fallbackTo = 'Hindi';
    }
    
    res.json({
      success: true,
      support: info,
    });
  } catch (error: any) {
    logger.error('Language validation error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/languages/supported
 * Get all supported languages with their capabilities
 */
router.get('/supported', (_req: Request, res: Response) => {
  try {
    const allDialects = getAllDialects();
    const supportInfo: LanguageSupportInfo[] = [];
    
    // Get unique base languages
    const uniqueLanguages = new Set(allDialects.map(d => d.language));
    
    for (const lang of uniqueLanguages) {
      const languageCode = languageCodeMap[lang] || 'hi-IN';
      const hasGoogleTTS = !!languageCodeMap[lang];
      const hasIndicTTS = indicTTS.isLanguageSupported(lang);
      const isWavenet = hasWavenetSupport(languageCode);
      const supportLevel = getLanguageSupportLevel(languageCode, hasGoogleTTS, hasIndicTTS, isWavenet);
      
      const info: LanguageSupportInfo = {
        name: lang,
        languageCode,
        hasGoogleTTS,
        hasIndicTTS,
        isWavenet,
        fallbackRequired: supportLevel === 'fallback' || supportLevel === 'limited',
        supportLevel,
      };
      
      if (supportLevel === 'limited' || supportLevel === 'fallback') {
        info.warning = `Limited or fallback TTS support for ${lang}`;
        info.fallbackTo = 'Hindi';
      }
      
      supportInfo.push(info);
    }
    
    // Sort by support level
    supportInfo.sort((a, b) => {
      const order = { full: 0, standard: 1, limited: 2, fallback: 3 };
      return order[a.supportLevel] - order[b.supportLevel];
    });
    
    res.json({
      success: true,
      languages: supportInfo,
      total: supportInfo.length,
    });
  } catch (error: any) {
    logger.error('Failed to get supported languages:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/languages/dialects
 * Get all dialects with their support information
 */
router.get('/dialects', (_req: Request, res: Response) => {
  try {
    const allDialects = getAllDialects();
    const dialectInfo = allDialects.map(dialect => {
      const languageCode = dialect.languageCode;
      const hasGoogleTTS = !!languageCodeMap[dialect.language];
      const hasIndicTTS = indicTTS.isLanguageSupported(dialect.language);
      const isWavenet = hasWavenetSupport(languageCode);
      const supportLevel = getLanguageSupportLevel(languageCode, hasGoogleTTS, hasIndicTTS, isWavenet);
      
      return {
        name: dialect.name,
        language: dialect.language,
        languageCode: dialect.languageCode,
        states: dialect.state,
        accent: dialect.accent,
        hasGoogleTTS,
        hasIndicTTS,
        isWavenet,
        supportLevel,
        fallbackRequired: supportLevel === 'fallback' || supportLevel === 'limited',
      };
    });
    
    res.json({
      success: true,
      dialects: dialectInfo,
      total: dialectInfo.length,
    });
  } catch (error: any) {
    logger.error('Failed to get dialects:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/languages/test-tts
 * Test connectivity to TTS providers
 */
router.get('/test-tts', async (_req: Request, res: Response) => {
  try {
    const googleTTSAvailable = !!process.env.GOOGLE_APPLICATION_CREDENTIALS;
    const indicTTSAvailable = await indicTTS.testIndicTTSConnection();
    
    res.json({
      success: true,
      providers: {
        googleCloudTTS: {
          available: googleTTSAvailable,
          configured: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
        },
        indicTTS: {
          available: indicTTSAvailable,
          apiUrl: process.env.INDIC_TTS_API_URL || 'https://models.ai4bharat.org',
        },
      },
    });
  } catch (error: any) {
    logger.error('TTS provider test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
