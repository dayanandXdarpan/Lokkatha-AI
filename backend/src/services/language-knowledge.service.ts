/**
 * External Knowledge Base Integration for Indian Languages
 * Fetches linguistic data, pronunciation guides, and dialect information from curated sources
 */

import axios from 'axios';
import logger from '../utils/logger';

export interface LanguageResource {
  source: string;
  type: 'dictionary' | 'phonetics' | 'grammar' | 'corpus';
  url: string;
  language: string;
  dialect?: string;
}

export interface PronunciationData {
  word: string;
  ipa: string;
  audio?: string;
  examples: string[];
  language: string;
}

/**
 * Curated External Resources for Indian Languages
 * These are reliable, publicly accessible linguistic databases
 */
export const EXTERNAL_LANGUAGE_RESOURCES: LanguageResource[] = [
  // Hindi Resources
  {
    source: 'Hindi WordNet (IIT Bombay)',
    type: 'dictionary',
    url: 'http://www.cfilt.iitb.ac.in/wordnet/webhwn',
    language: 'Hindi'
  },
  {
    source: 'TDIL (Technology Development for Indian Languages)',
    type: 'corpus',
    url: 'https://tdil-dc.in',
    language: 'Hindi'
  },
  
  // Tamil Resources
  {
    source: 'Tamil Virtual Academy',
    type: 'dictionary',
    url: 'https://tamilvu.org',
    language: 'Tamil'
  },
  {
    source: 'Madurai Tamil Lexicon',
    type: 'dictionary',
    url: 'https://dsal.uchicago.edu/dictionaries/tamil-lex',
    language: 'Tamil'
  },
  
  // Telugu Resources
  {
    source: 'Telugu WordNet',
    type: 'dictionary',
    url: 'http://telugu.webonary.org',
    language: 'Telugu'
  },
  
  // Bengali Resources
  {
    source: 'Bangla Academy Dictionary',
    type: 'dictionary',
    url: 'https://bn.wikipedia.org',
    language: 'Bengali'
  },
  
  // Multi-language Resources
  {
    source: 'Wiktionary (Indian Languages)',
    type: 'dictionary',
    url: 'https://en.wiktionary.org',
    language: 'Multiple'
  },
  {
    source: 'CLDR (Unicode Common Locale Data)',
    type: 'phonetics',
    url: 'http://cldr.unicode.org',
    language: 'Multiple'
  }
];

/**
 * Common Indian Language Vocabulary Database
 * High-frequency words with pronunciation guides
 */
export const COMMON_VOCABULARY: Record<string, PronunciationData[]> = {
  'Hindi': [
    {
      word: 'बच्चा',
      ipa: 'bət̪ʃːaː',
      examples: ['बच्चा खेल रहा है', 'बच्चों को पढ़ाओ'],
      language: 'Hindi'
    },
    {
      word: 'पानी',
      ipa: 'paːniː',
      examples: ['पानी पीना', 'पानी का चक्र'],
      language: 'Hindi'
    },
    {
      word: 'समझना',
      ipa: 'səməd͡ʒʰnaː',
      examples: ['समझे?', 'समझ गए?'],
      language: 'Hindi'
    },
    {
      word: 'सीखना',
      ipa: 'siːkʰnaː',
      examples: ['चलो सीखें', 'आज हम सीखेंगे'],
      language: 'Hindi'
    },
    {
      word: 'ध्यान',
      ipa: 'd̪ʱjaːn',
      examples: ['ध्यान दो', 'ध्यान से सुनो'],
      language: 'Hindi'
    }
  ],
  'Maithili': [
    {
      word: 'छै',
      ipa: 't͡ʃʰəi',
      examples: ['की छै', 'कहाँ छै'],
      language: 'Maithili'
    },
    {
      word: 'बा',
      ipa: 'baː',
      examples: ['की बा', 'कहाँ बा'],
      language: 'Maithili'
    },
    {
      word: 'लोग',
      ipa: 'loːɡ',
      examples: ['बच्चा लोग', 'आदमी लोग'],
      language: 'Maithili'
    },
    {
      word: 'सीखब',
      ipa: 'siːkʰəb',
      examples: ['हम सीखब', 'आइ सीखब'],
      language: 'Maithili'
    }
  ],
  'Bhojpuri': [
    {
      word: 'बा',
      ipa: 'baː',
      examples: ['का बा', 'केहू बा'],
      language: 'Bhojpuri'
    },
    {
      word: 'ई',
      ipa: 'iː',
      examples: ['ई का बा', 'ई लोग'],
      language: 'Bhojpuri'
    },
    {
      word: 'रहल',
      ipa: 'rəɦəl',
      examples: ['करत रहल', 'जात रहल'],
      language: 'Bhojpuri'
    },
    {
      word: 'बहुते',
      ipa: 'bəɦʊt̪eː',
      examples: ['बहुते अच्छा', 'बहुते पुरान'],
      language: 'Bhojpuri'
    }
  ],
  'Tamil': [
    {
      word: 'குழந்தை',
      ipa: 'kuɻəndəi',
      examples: ['குழந்தைகள்', 'குழந்தை விளையாடுகிறது'],
      language: 'Tamil'
    },
    {
      word: 'நீர்',
      ipa: 'niːr',
      examples: ['நீர் குடிக்க', 'நீர் சுழற்சி'],
      language: 'Tamil'
    },
    {
      word: 'புரிந்து',
      ipa: 'purindu',
      examples: ['புரிந்ததா?', 'புரிந்து கொள்ளுங்கள்'],
      language: 'Tamil'
    },
    {
      word: 'கற்க',
      ipa: 'kaːrkə',
      examples: ['கற்க வாருங்கள்', 'இன்று நாம் கற்போம்'],
      language: 'Tamil'
    }
  ],
  'Telugu': [
    {
      word: 'పిల్ల',
      ipa: 'pillə',
      examples: ['పిల్లలు', 'పిల్ల ఆడుతున్నారు'],
      language: 'Telugu'
    },
    {
      word: 'నీరు',
      ipa: 'niːru',
      examples: ['నీరు త్రాగు', 'నీటి చక్రం'],
      language: 'Telugu'
    },
    {
      word: 'అర్థం',
      ipa: 'ərd̪ʱəm',
      examples: ['అర్థమైందా?', 'అర్థం చేసుకోండి'],
      language: 'Telugu'
    },
    {
      word: 'నేర్చు',
      ipa: 'neːrt͡ʃu',
      examples: ['నేర్చుకుందాం', 'ఈ రోజు మనం నేర్చుకుందాం'],
      language: 'Telugu'
    }
  ]
};

/**
 * Fetch pronunciation data from external sources (simulated)
 * In production, this would make actual API calls to linguistic databases
 */
export async function fetchPronunciationData(
  word: string,
  language: string
): Promise<PronunciationData | null> {
  try {
    // First, check our local cache
    const localData = COMMON_VOCABULARY[language]?.find(
      item => item.word === word
    );
    
    if (localData) {
      logger.info(`Found pronunciation in local cache: ${word} (${language})`);
      return localData;
    }

    // In production, you would make API calls here:
    // const response = await axios.get(`https://api.example.com/pronunciation`, {
    //   params: { word, language }
    // });
    
    logger.warn(`Pronunciation data not found for: ${word} (${language})`);
    return null;
  } catch (error: any) {
    logger.error('Error fetching pronunciation data:', {
      error: error.message,
      word,
      language
    });
    return null;
  }
}

/**
 * Enhanced subtitle generation with phonetic accuracy
 * Breaks text into optimal chunks for readability and sync
 */
export function generateEnhancedSubtitles(
  narration: string,
  language: string,
  startTime: number,
  wordsPerMinute: number = 140
): Array<{
  start: string;
  end: string;
  text: string;
}> {
  const subtitles: Array<{ start: string; end: string; text: string }> = [];
  
  // Split by sentences first
  const sentenceRegex = /[।.!?]+/g;
  const sentences = narration.split(sentenceRegex).filter(s => s.trim().length > 0);
  
  let currentTime = startTime;
  
  sentences.forEach(sentence => {
    const words = sentence.trim().split(/\s+/);
    
    // Break into chunks of 6-8 words for optimal subtitle readability
    const chunkSize = 7;
    for (let i = 0; i < words.length; i += chunkSize) {
      const chunk = words.slice(i, i + chunkSize).join(' ');
      const wordCount = chunk.split(/\s+/).length;
      
      // Calculate duration based on speaking rate
      const duration = (wordCount / wordsPerMinute) * 60;
      
      const startTimeStr = formatSubtitleTime(currentTime);
      const endTimeStr = formatSubtitleTime(currentTime + duration);
      
      subtitles.push({
        start: startTimeStr,
        end: endTimeStr,
        text: chunk
      });
      
      currentTime += duration;
    }
  });
  
  return subtitles;
}

/**
 * Format time for SRT subtitle format (HH:MM:SS,mmm)
 */
function formatSubtitleTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const milliseconds = Math.floor((seconds % 1) * 1000);
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`;
}

/**
 * Generate SRT subtitle file content
 */
export function generateSRTContent(
  subtitles: Array<{ start: string; end: string; text: string }>
): string {
  return subtitles.map((subtitle, index) => {
    return `${index + 1}\n${subtitle.start} --> ${subtitle.end}\n${subtitle.text}\n`;
  }).join('\n');
}

/**
 * Dialect-specific vocabulary corrections
 * Ensures authentic dialect usage in generated content
 */
export const DIALECT_VOCABULARY_CORRECTIONS: Record<string, Record<string, string>> = {
  'Maithili': {
    'है': 'छै',
    'हैं': 'छथि',
    'था': 'छल',
    'थे': 'छलाह',
    'यह': 'ई',
    'वह': 'ओ',
    'क्या': 'की',
    'कहाँ': 'कतय',
    'कैसे': 'कोना',
    'बच्चे': 'बच्चा लोग',
    'लोग (people)': 'लोग',
    'जाएंगे': 'जाएब',
    'आएंगे': 'आएब',
    'करेंगे': 'करब',
    'सीखेंगे': 'सीखब'
  },
  'Bhojpuri': {
    'है': 'बा',
    'हैं': 'बाड़े',
    'था': 'रहल',
    'थे': 'रहल',
    'यह': 'ई',
    'वह': 'ऊ',
    'क्या': 'का',
    'कहाँ': 'कहाँ',
    'कैसे': 'केहू',
    'बच्चे': 'बच्चा लोग',
    'बहुत': 'बहुते',
    'पुराना': 'पुरान',
    'जाएंगे': 'जाई',
    'आएंगे': 'आई',
    'करेंगे': 'करी',
    'सीखेंगे': 'सीखी'
  },
  'Awadhi': {
    'है': 'हवै',
    'हैं': 'हैं',
    'था': 'रहे',
    'थे': 'रहे',
    'यह': 'यह',
    'वह': 'ऊ',
    'जाएंगे': 'जइहें',
    'आएंगे': 'आइहें',
    'करेंगे': 'करिहैं'
  },
  'Haryanvi': {
    'है': 'सै',
    'हैं': 'सै',
    'था': 'था',
    'क्या': 'के',
    'कैसे': 'किंयां',
    'बहुत': 'घणा'
  }
};

/**
 * Apply dialect corrections to text
 */
export function applyDialectCorrections(
  text: string,
  dialect: string
): string {
  const corrections = DIALECT_VOCABULARY_CORRECTIONS[dialect];
  
  if (!corrections) {
    return text;
  }

  let correctedText = text;
  
  // Apply each correction
  Object.entries(corrections).forEach(([standardWord, dialectWord]) => {
    // Use word boundaries to avoid partial matches
    const regex = new RegExp(`\\b${standardWord}\\b`, 'g');
    correctedText = correctedText.replace(regex, dialectWord);
  });
  
  logger.info(`Applied ${Object.keys(corrections).length} dialect corrections for ${dialect}`);
  
  return correctedText;
}

/**
 * Validate pronunciation accuracy
 * Checks if generated text uses proper dialect vocabulary
 */
export function validateDialectAccuracy(
  text: string,
  baseLanguage: string,
  dialect: string
): {
  isAccurate: boolean;
  suggestions: string[];
  score: number;
} {
  const corrections = DIALECT_VOCABULARY_CORRECTIONS[dialect];
  
  if (!corrections) {
    return { isAccurate: true, suggestions: [], score: 100 };
  }

  const suggestions: string[] = [];
  let incorrectCount = 0;
  
  // Check for standard language words that should be dialect words
  Object.entries(corrections).forEach(([standardWord, dialectWord]) => {
    const regex = new RegExp(`\\b${standardWord}\\b`, 'g');
    const matches = text.match(regex);
    
    if (matches) {
      incorrectCount += matches.length;
      suggestions.push(`Replace "${standardWord}" with "${dialectWord}"`);
    }
  });
  
  const totalWords = text.split(/\s+/).length;
  const score = Math.max(0, 100 - (incorrectCount / totalWords) * 100);
  
  return {
    isAccurate: score >= 80,
    suggestions: suggestions.slice(0, 5), // Top 5 suggestions
    score: Math.round(score)
  };
}
