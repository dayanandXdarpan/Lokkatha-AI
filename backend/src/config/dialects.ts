/**
 * Regional Dialect Configuration for Indian States
 * Maps states to their primary dialects and language variations
 */

export interface DialectInfo {
  name: string;
  language: string; // Base language (Hindi, Tamil, etc.)
  languageCode: string; // ISO code for TTS
  state: string[];
  description: string;
  accent: string; // Accent identifier for TTS customization
  samplePhrases: string[]; // Example phrases in this dialect
}

/**
 * Comprehensive dialect mapping for Indian states and regions
 */
export const INDIAN_DIALECTS: Record<string, DialectInfo> = {
  // Hindi Belt Dialects
  bhojpuri: {
    name: 'Bhojpuri',
    language: 'Hindi',
    languageCode: 'hi-IN',
    state: ['Bihar', 'Uttar Pradesh', 'Jharkhand'],
    description: 'Spoken in eastern UP and western Bihar',
    accent: 'bhojpuri',
    samplePhrases: [
      'हम का करीं?', // What should I do?
      'तू कहाँ जा रहल बाड़ू?', // Where are you going?
      'ई बहुत बढ़िया बा', // This is very good
    ],
  },
  maithili: {
    name: 'Maithili',
    language: 'Hindi',
    languageCode: 'hi-IN',
    state: ['Bihar', 'Jharkhand', 'Nepal'],
    description: 'Spoken in Mithila region of Bihar',
    accent: 'maithili',
    samplePhrases: [
      'अहाँ केना छी?', // How are you?
      'ई की अछि?', // What is this?
      'हम जा रहल छी', // I am going
    ],
  },
  magahi: {
    name: 'Magahi',
    language: 'Hindi',
    languageCode: 'hi-IN',
    state: ['Bihar', 'Jharkhand'],
    description: 'Spoken in Magadh region of Bihar',
    accent: 'magahi',
    samplePhrases: [
      'तू कहाँ जात हऽ?', // Where are you going?
      'हम का करब?', // What should I do?
      'बहुत बढ़िया छै', // Very good
    ],
  },
  awadhi: {
    name: 'Awadhi',
    language: 'Hindi',
    languageCode: 'hi-IN',
    state: ['Uttar Pradesh'],
    description: 'Spoken in Awadh region of central UP',
    accent: 'awadhi',
    samplePhrases: [
      'तुम कहाँ जात हौ?', // Where are you going?
      'हम का करी?', // What should I do?
      'बहुत अच्छा है', // Very good
    ],
  },
  braj: {
    name: 'Braj Bhasha',
    language: 'Hindi',
    languageCode: 'hi-IN',
    state: ['Uttar Pradesh', 'Rajasthan', 'Haryana'],
    description: 'Spoken in Braj region around Mathura',
    accent: 'braj',
    samplePhrases: [
      'तुम कहाँ जात हो?', // Where are you going?
      'मैं क्या करूँ?', // What should I do?
      'बहुत सुंदर है', // Very beautiful
    ],
  },
  rajasthani: {
    name: 'Rajasthani',
    language: 'Hindi',
    languageCode: 'hi-IN',
    state: ['Rajasthan', 'Gujarat'],
    description: 'Spoken in Rajasthan',
    accent: 'rajasthani',
    samplePhrases: [
      'थे कठै जावो हो?', // Where are you going?
      'म्हे कांई करूं?', // What should I do?
      'बहुत घणो अच्छो', // Very good
    ],
  },
  haryanvi: {
    name: 'Haryanvi',
    language: 'Hindi',
    languageCode: 'hi-IN',
    state: ['Haryana', 'Delhi', 'Punjab'],
    description: 'Spoken in Haryana',
    accent: 'haryanvi',
    samplePhrases: [
      'तू किते जावै सै?', // Where are you going?
      'मैं के करूं?', // What should I do?
      'बहुत बढ़िया सै', // Very good
    ],
  },
  bundeli: {
    name: 'Bundeli',
    language: 'Hindi',
    languageCode: 'hi-IN',
    state: ['Madhya Pradesh', 'Uttar Pradesh'],
    description: 'Spoken in Bundelkhand region',
    accent: 'bundeli',
    samplePhrases: [
      'तुम कहाँ जात हो?', // Where are you going?
      'हम का करें?', // What should I do?
      'बहुत अच्छा है', // Very good
    ],
  },
  chhattisgarhi: {
    name: 'Chhattisgarhi',
    language: 'Hindi',
    languageCode: 'hi-IN',
    state: ['Chhattisgarh', 'Madhya Pradesh'],
    description: 'Spoken in Chhattisgarh',
    accent: 'chhattisgarhi',
    samplePhrases: [
      'तें कहाँ जावत हस?', // Where are you going?
      'मैं का करहूँ?', // What should I do?
      'बहुत बढ़िया हे', // Very good
    ],
  },

  // South Indian Languages
  tamil: {
    name: 'Tamil',
    language: 'Tamil',
    languageCode: 'ta-IN',
    state: ['Tamil Nadu', 'Puducherry'],
    description: 'Official language of Tamil Nadu',
    accent: 'tamil',
    samplePhrases: [
      'நீங்கள் எப்படி இருக்கிறீர்கள்?', // How are you?
      'நான் என்ன செய்ய வேண்டும்?', // What should I do?
      'மிகவும் நல்லது', // Very good
    ],
  },
  telugu: {
    name: 'Telugu',
    language: 'Telugu',
    languageCode: 'te-IN',
    state: ['Andhra Pradesh', 'Telangana'],
    description: 'Official language of Andhra Pradesh and Telangana',
    accent: 'telugu',
    samplePhrases: [
      'మీరు ఎలా ఉన్నారు?', // How are you?
      'నేను ఏమి చేయాలి?', // What should I do?
      'చాలా బాగుంది', // Very good
    ],
  },
  kannada: {
    name: 'Kannada',
    language: 'Kannada',
    languageCode: 'kn-IN',
    state: ['Karnataka'],
    description: 'Official language of Karnataka',
    accent: 'kannada',
    samplePhrases: [
      'ನೀವು ಹೇಗಿದ್ದೀರಿ?', // How are you?
      'ನಾನು ಏನು ಮಾಡಬೇಕು?', // What should I do?
      'ತುಂಬಾ ಚೆನ್ನಾಗಿದೆ', // Very good
    ],
  },
  malayalam: {
    name: 'Malayalam',
    language: 'Malayalam',
    languageCode: 'ml-IN',
    state: ['Kerala', 'Lakshadweep'],
    description: 'Official language of Kerala',
    accent: 'malayalam',
    samplePhrases: [
      'നിങ്ങൾക്ക് എങ്ങനെയുണ്ട്?', // How are you?
      'ഞാൻ എന്തു ചെയ്യണം?', // What should I do?
      'വളരെ നല്ലത്', // Very good
    ],
  },

  // West Indian Languages
  gujarati: {
    name: 'Gujarati',
    language: 'Gujarati',
    languageCode: 'gu-IN',
    state: ['Gujarat', 'Dadra and Nagar Haveli', 'Daman and Diu'],
    description: 'Official language of Gujarat',
    accent: 'gujarati',
    samplePhrases: [
      'તમે કેમ છો?', // How are you?
      'હું શું કરું?', // What should I do?
      'ખૂબ સારું', // Very good
    ],
  },
  marathi: {
    name: 'Marathi',
    language: 'Marathi',
    languageCode: 'mr-IN',
    state: ['Maharashtra', 'Goa'],
    description: 'Official language of Maharashtra',
    accent: 'marathi',
    samplePhrases: [
      'तुम्ही कसे आहात?', // How are you?
      'मी काय करू?', // What should I do?
      'खूप छान', // Very good
    ],
  },
  konkani: {
    name: 'Konkani',
    language: 'Konkani',
    languageCode: 'mr-IN', // Use Marathi as closer fallback (same region)
    state: ['Goa', 'Karnataka', 'Maharashtra'],
    description: 'Official language of Goa',
    accent: 'konkani',
    samplePhrases: [
      'तुवें कसो आसा?', // How are you?
      'हांव किदें करूं?', // What should I do?
      'खूब बरें', // Very good
    ],
  },

  // East Indian Languages
  bengali: {
    name: 'Bengali',
    language: 'Bengali',
    languageCode: 'bn-IN',
    state: ['West Bengal', 'Tripura'],
    description: 'Official language of West Bengal',
    accent: 'bengali',
    samplePhrases: [
      'আপনি কেমন আছেন?', // How are you?
      'আমি কী করব?', // What should I do?
      'খুব ভালো', // Very good
    ],
  },
  odia: {
    name: 'Odia',
    language: 'Odia',
    languageCode: 'or-IN', // Odia has limited Google TTS support
    state: ['Odisha'],
    description: 'Official language of Odisha',
    accent: 'odia',
    samplePhrases: [
      'ଆପଣ କେମିତି ଅଛନ୍ତି?', // How are you?
      'ମୁଁ କଣ କରିବି?', // What should I do?
      'ବହୁତ ଭଲ', // Very good
    ],
  },
  assamese: {
    name: 'Assamese',
    language: 'Assamese',
    languageCode: 'as-IN', // Assamese has limited Google TTS support
    state: ['Assam'],
    description: 'Official language of Assam',
    accent: 'assamese',
    samplePhrases: [
      'আপুনি কেনেকৈ আছে?', // How are you?
      'মই কি কৰিম?', // What should I do?
      'বহুত ভাল', // Very good
    ],
  },

  // North East Languages
  manipuri: {
    name: 'Manipuri',
    language: 'Manipuri',
    languageCode: 'mni-IN', // Manipuri/Meitei code
    state: ['Manipur'],
    description: 'Official language of Manipur',
    accent: 'manipuri',
    samplePhrases: [
      'নখোই করম্বা?', // How are you?
      'ঐনা করি তৌগদগে?', // What should I do?
      'য়াম্না ফজবা', // Very good
    ],
  },

  // Default/Standard Languages
  hindi: {
    name: 'Standard Hindi',
    language: 'Hindi',
    languageCode: 'hi-IN',
    state: ['Delhi', 'Uttarakhand', 'Himachal Pradesh'],
    description: 'Standard Hindi (Khari Boli)',
    accent: 'standard',
    samplePhrases: [
      'आप कैसे हैं?', // How are you?
      'मैं क्या करूं?', // What should I do?
      'बहुत अच्छा', // Very good
    ],
  },
  english: {
    name: 'English',
    language: 'English',
    languageCode: 'en-IN',
    state: ['Pan-India'],
    description: 'Indian English',
    accent: 'indian',
    samplePhrases: [
      'How are you?',
      'What should I do?',
      'Very good',
    ],
  },
  punjabi: {
    name: 'Punjabi',
    language: 'Punjabi',
    languageCode: 'pa-IN',
    state: ['Punjab', 'Chandigarh'],
    description: 'Official language of Punjab',
    accent: 'punjabi',
    samplePhrases: [
      'ਤੁਸੀਂ ਕਿਵੇਂ ਹੋ?', // How are you?
      'ਮੈਂ ਕੀ ਕਰਾਂ?', // What should I do?
      'ਬਹੁਤ ਵਧੀਆ', // Very good
    ],
  },
};

/**
 * Get dialect by state name
 */
export function getDialectsByState(stateName: string): DialectInfo[] {
  const dialects: DialectInfo[] = [];
  
  for (const [, dialect] of Object.entries(INDIAN_DIALECTS)) {
    if (dialect.state.some(s => s.toLowerCase() === stateName.toLowerCase())) {
      dialects.push(dialect);
    }
  }
  
  // If no specific dialect found, return standard Hindi and English
  if (dialects.length === 0) {
    dialects.push(INDIAN_DIALECTS.hindi, INDIAN_DIALECTS.english);
  }
  
  return dialects;
}

/**
 * Get dialect by name
 */
export function getDialectByName(dialectName: string): DialectInfo | undefined {
  const key = dialectName.toLowerCase().replace(/\s+/g, '');
  return INDIAN_DIALECTS[key];
}

/**
 * Get all available dialects
 */
export function getAllDialects(): DialectInfo[] {
  return Object.values(INDIAN_DIALECTS);
}

/**
 * State to dialect mapping for quick lookup
 */
export const STATE_DIALECT_MAP: Record<string, string[]> = {
  'Bihar': ['bhojpuri', 'maithili', 'magahi', 'hindi'],
  'Uttar Pradesh': ['bhojpuri', 'awadhi', 'braj', 'bundeli', 'hindi'],
  'Madhya Pradesh': ['bundeli', 'chhattisgarhi', 'hindi'],
  'Rajasthan': ['rajasthani', 'braj', 'hindi'],
  'Haryana': ['haryanvi', 'braj', 'hindi'],
  'Punjab': ['punjabi', 'hindi'],
  'Chhattisgarh': ['chhattisgarhi', 'hindi'],
  'Jharkhand': ['bhojpuri', 'maithili', 'magahi', 'hindi'],
  'Delhi': ['hindi', 'haryanvi', 'english'],
  'Tamil Nadu': ['tamil', 'english'],
  'Andhra Pradesh': ['telugu', 'english'],
  'Telangana': ['telugu', 'english'],
  'Karnataka': ['kannada', 'konkani', 'english'],
  'Kerala': ['malayalam', 'english'],
  'West Bengal': ['bengali', 'hindi', 'english'],
  'Odisha': ['odia', 'hindi', 'english'],
  'Gujarat': ['gujarati', 'hindi', 'english'],
  'Maharashtra': ['marathi', 'konkani', 'hindi', 'english'],
  'Goa': ['konkani', 'marathi', 'hindi', 'english'],
  'Assam': ['assamese', 'bengali', 'hindi', 'english'],
  'Manipur': ['manipuri', 'hindi', 'english'],
  'Tripura': ['bengali', 'hindi', 'english'],
};

/**
 * Get recommended dialects for a state (prioritized list)
 */
export function getRecommendedDialects(stateName: string): DialectInfo[] {
  const dialectKeys = STATE_DIALECT_MAP[stateName] || ['hindi', 'english'];
  return dialectKeys.map(key => INDIAN_DIALECTS[key]).filter(Boolean);
}
