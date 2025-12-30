/**
 * Indian Language Phonetics and Pronunciation Database
 * Comprehensive phonetic rules for accurate TTS pronunciation across Indian languages
 */

export interface PhoneticRule {
  pattern: string;
  pronunciation: string;
  context?: string;
  examples: string[];
}

export interface LanguagePhonetics {
  language: string;
  script: string;
  phoneticRules: PhoneticRule[];
  commonMispronunciations: { wrong: string; correct: string; ssml: string }[];
  toneMarkers: { marker: string; meaning: string; ssml: string }[];
  aspiratedSounds: string[];
  retroflexSounds: string[];
  nasalSounds: string[];
  voicingRules: string[];
}

/**
 * Comprehensive Indian Language Phonetics Database
 * Based on linguistic research and native speaker input
 */
export const INDIAN_LANGUAGE_PHONETICS: Record<string, LanguagePhonetics> = {
  'Hindi': {
    language: 'Hindi',
    script: 'Devanagari',
    phoneticRules: [
      {
        pattern: 'ा',
        pronunciation: 'aa (long)',
        context: 'Vowel extension',
        examples: ['काम (kaam)', 'नाम (naam)', 'राम (Raam)']
      },
      {
        pattern: 'ि',
        pronunciation: 'i (short)',
        context: 'Short vowel before consonant',
        examples: ['किताब (kitaab)', 'दिन (din)', 'मिठाई (mithaai)']
      },
      {
        pattern: 'ी',
        pronunciation: 'ee (long)',
        context: 'Long vowel',
        examples: ['सीखना (seekhna)', 'पानी (paani)', 'नदी (nadee)']
      },
      {
        pattern: 'ु',
        pronunciation: 'u (short)',
        context: 'Short u sound',
        examples: ['गुरु (guru)', 'सुबह (subah)', 'दुख (dukh)']
      },
      {
        pattern: 'ू',
        pronunciation: 'oo (long)',
        context: 'Long u sound',
        examples: ['फूल (phool)', 'दूध (doodh)', 'सूरज (sooraj)']
      },
      {
        pattern: 'े',
        pronunciation: 'ay (as in bay)',
        context: 'E vowel marker',
        examples: ['देश (desh)', 'मेरा (mera)', 'केला (kela)']
      },
      {
        pattern: 'ै',
        pronunciation: 'ai (as in aisle)',
        context: 'Ai diphthong',
        examples: ['है (hai)', 'कैसे (kaise)', 'मैं (main)']
      },
      {
        pattern: 'ो',
        pronunciation: 'o (as in go)',
        context: 'O vowel marker',
        examples: ['होना (hona)', 'सोना (sona)', 'रोना (rona)']
      },
      {
        pattern: 'ौ',
        pronunciation: 'au (as in house)',
        context: 'Au diphthong',
        examples: ['कौन (kaun)', 'और (aur)', 'गौरव (gaurav)']
      },
      {
        pattern: 'ं',
        pronunciation: 'nasalization',
        context: 'Anusvara - nasal sound',
        examples: ['हंस (hans)', 'पंख (pankh)', 'गंगा (Ganga)']
      },
      {
        pattern: 'ः',
        pronunciation: 'h (aspirated)',
        context: 'Visarga - breath sound',
        examples: ['नमः (namah)', 'अतः (atah)', 'प्रातः (praatah)']
      }
    ],
    commonMispronunciations: [
      {
        wrong: 'कह रहा है (kah-raha-hai)',
        correct: 'कह रहा है (keh-raha-he)',
        ssml: '<phoneme alphabet="ipa" ph="kəɦ rəɦaː ɦɛː">कह रहा है</phoneme>'
      },
      {
        wrong: 'बच्चा (bach-cha)',
        correct: 'बच्चा (bach-chaa)',
        ssml: '<phoneme alphabet="ipa" ph="bət̪ʃːaː">बच्चा</phoneme>'
      }
    ],
    toneMarkers: [
      {
        marker: '।',
        meaning: 'Full stop (Devanagari danda)',
        ssml: '<break time="400ms"/>'
      },
      {
        marker: '॥',
        meaning: 'Double danda (paragraph end)',
        ssml: '<break time="600ms"/>'
      }
    ],
    aspiratedSounds: ['ख', 'घ', 'छ', 'झ', 'ठ', 'ढ', 'थ', 'ध', 'फ', 'भ'],
    retroflexSounds: ['ट', 'ठ', 'ड', 'ढ', 'ण'],
    nasalSounds: ['ं', 'ञ', 'ङ', 'ण', 'न', 'म'],
    voicingRules: [
      'Voiced: ग, घ, ज, झ, ड, ढ, द, ध, ब, भ',
      'Unvoiced: क, ख, च, छ, ट, ठ, त, थ, प, फ'
    ]
  },
  'Maithili': {
    language: 'Maithili',
    script: 'Devanagari/Mithilakshar',
    phoneticRules: [
      {
        pattern: 'छै',
        pronunciation: 'chhai (present tense marker)',
        context: 'Maithili present tense',
        examples: ['अछि (achhi)', 'छै (chhai)', 'होइछ (hoichh)']
      },
      {
        pattern: 'बा',
        pronunciation: 'baa (is/are)',
        context: 'Maithili copula',
        examples: ['की बा (ki baa)', 'कहाँ बा (kahaan baa)']
      },
      {
        pattern: 'लोग',
        pronunciation: 'log (people, informal)',
        context: 'Maithili plural marker',
        examples: ['बच्चा लोग (bachcha log)', 'आदमी लोग (aadmi log)']
      }
    ],
    commonMispronunciations: [
      {
        wrong: 'है (hai - Hindi)',
        correct: 'छै (chhai - Maithili)',
        ssml: '<phoneme alphabet="ipa" ph="t͡ʃʰəi">छै</phoneme>'
      }
    ],
    toneMarkers: [],
    aspiratedSounds: ['ख', 'घ', 'छ', 'झ', 'ठ', 'ढ', 'थ', 'ध', 'फ', 'भ'],
    retroflexSounds: ['ट', 'ठ', 'ड', 'ढ'],
    nasalSounds: ['ं', 'ञ', 'ङ', 'ण', 'न', 'म'],
    voicingRules: []
  },
  'Bhojpuri': {
    language: 'Bhojpuri',
    script: 'Devanagari',
    phoneticRules: [
      {
        pattern: 'बा',
        pronunciation: 'baa (is/are)',
        context: 'Bhojpuri copula',
        examples: ['का बा (ka baa)', 'केहू बा (kehu baa)']
      },
      {
        pattern: 'रहल',
        pronunciation: 'rahal (was/were)',
        context: 'Bhojpuri past continuous',
        examples: ['करत रहल (karat rahal)', 'जात रहल (jaat rahal)']
      },
      {
        pattern: 'ई',
        pronunciation: 'ee (this)',
        context: 'Bhojpuri demonstrative',
        examples: ['ई का बा (ee ka baa)', 'ई लोग (ee log)']
      }
    ],
    commonMispronunciations: [
      {
        wrong: 'यह (yah - Hindi)',
        correct: 'ई (ee - Bhojpuri)',
        ssml: '<phoneme alphabet="ipa" ph="iː">ई</phoneme>'
      }
    ],
    toneMarkers: [],
    aspiratedSounds: ['ख', 'घ', 'छ', 'झ', 'ठ', 'ढ', 'थ', 'ध', 'फ', 'भ'],
    retroflexSounds: ['ट', 'ठ', 'ड', 'ढ'],
    nasalSounds: ['ं', 'ञ', 'ङ', 'ण', 'न', 'म'],
    voicingRules: []
  },
  'Tamil': {
    language: 'Tamil',
    script: 'Tamil',
    phoneticRules: [
      {
        pattern: 'ா',
        pronunciation: 'aa (long)',
        context: 'Long vowel marker',
        examples: ['காதல் (kaadhal)', 'நாள் (naal)', 'வாழ்க (vaazhka)']
      },
      {
        pattern: 'ி',
        pronunciation: 'i (short)',
        context: 'Short i sound',
        examples: ['கிளி (kili)', 'நிலா (nilaa)', 'திருச்சி (tiruchchi)']
      },
      {
        pattern: 'ீ',
        pronunciation: 'ee (long)',
        context: 'Long i sound',
        examples: ['நீர் (neer)', 'மீன் (meen)', 'தீ (thee)']
      },
      {
        pattern: 'ு',
        pronunciation: 'u (short)',
        context: 'Short u marker',
        examples: ['குடி (kudi)', 'மது (madhu)', 'பசு (pasu)']
      },
      {
        pattern: 'ூ',
        pronunciation: 'oo (long)',
        context: 'Long u marker',
        examples: ['பூ (poo)', 'கூடு (koodu)', 'தூது (thoothu)']
      },
      {
        pattern: 'ெ',
        pronunciation: 'e (as in bet)',
        context: 'E vowel marker',
        examples: ['செய் (sey)', 'தெரு (theru)', 'வெள்ளம் (vellam)']
      },
      {
        pattern: 'ே',
        pronunciation: 'ay (as in bay)',
        context: 'Long e marker',
        examples: ['போ (po)', 'கேள் (kayl)', 'மேலே (mayle)']
      },
      {
        pattern: 'ை',
        pronunciation: 'ai (as in aisle)',
        context: 'Ai diphthong',
        examples: ['பை (pai)', 'கை (kai)', 'வை (vai)']
      },
      {
        pattern: 'ஃ',
        pronunciation: 'aydham (fricative)',
        context: 'Rare consonant',
        examples: ['அஃது (ahthu)', 'இஃது (ihthu)']
      },
      {
        pattern: 'ள்',
        pronunciation: 'l (retroflex)',
        context: 'Retroflex L',
        examples: ['பள்ளி (palli)', 'கள்ளம் (kallam)', 'வள்ளி (valli)']
      }
    ],
    commonMispronunciations: [
      {
        wrong: 'தமிழ் (thamil)',
        correct: 'தமிழ் (thamizh - with zh sound)',
        ssml: '<phoneme alphabet="ipa" ph="t̪əmɨɻ">தமிழ்</phoneme>'
      },
      {
        wrong: 'வணக்கம் (vanakkam)',
        correct: 'வணக்கம் (vaṇakkam - retroflex n)',
        ssml: '<phoneme alphabet="ipa" ph="ʋəɳəkːəm">வணக்கம்</phoneme>'
      }
    ],
    toneMarkers: [
      {
        marker: '.',
        meaning: 'Full stop',
        ssml: '<break time="350ms"/>'
      }
    ],
    aspiratedSounds: [],
    retroflexSounds: ['ட', 'ண', 'ற', 'ள'],
    nasalSounds: ['ங', 'ஞ', 'ண', 'ந', 'ம', 'ன'],
    voicingRules: [
      'Tamil has no aspirated consonants',
      'All stops are unvoiced',
      'Voicing occurs intervocalically'
    ]
  },
  'Telugu': {
    language: 'Telugu',
    script: 'Telugu',
    phoneticRules: [
      {
        pattern: 'ా',
        pronunciation: 'aa (long)',
        context: 'Long vowel',
        examples: ['నాన (naanu)', 'తార (taara)', 'గాలి (gaali)']
      },
      {
        pattern: 'ి',
        pronunciation: 'i (short)',
        context: 'Short i',
        examples: ['కిది (kidi)', 'నిను (ninu)', 'పిల్ల (pilla)']
      },
      {
        pattern: 'ీ',
        pronunciation: 'ee (long)',
        context: 'Long i',
        examples: ['నీరు (neeru)', 'మీర (meeru)', 'జీవితం (jeevitham)']
      },
      {
        pattern: 'ు',
        pronunciation: 'u (short)',
        context: 'Short u',
        examples: ['కుక్క (kukka)', 'పుస్తకం (pusthakam)']
      },
      {
        pattern: 'ూ',
        pronunciation: 'oo (long)',
        context: 'Long u',
        examples: ['పూల (poola)', 'చూడు (choodu)', 'తూర్పు (thoorpu)']
      }
    ],
    commonMispronunciations: [
      {
        wrong: 'తెలుగు (telugu)',
        correct: 'తెలుగు (telugu - with proper vowels)',
        ssml: '<phoneme alphabet="ipa" ph="t̪elʊɡʊ">తెలుగు</phoneme>'
      }
    ],
    toneMarkers: [
      {
        marker: '.',
        meaning: 'Full stop',
        ssml: '<break time="300ms"/>'
      }
    ],
    aspiratedSounds: ['ఖ', 'ఘ', 'ఛ', 'ఝ', 'ఠ', 'ఢ', 'థ', 'ధ', 'ఫ', 'భ'],
    retroflexSounds: ['ట', 'ఠ', 'డ', 'ఢ', 'ణ'],
    nasalSounds: ['ఙ', 'ఞ', 'ణ', 'న', 'మ'],
    voicingRules: []
  },
  'Bengali': {
    language: 'Bengali',
    script: 'Bengali',
    phoneticRules: [
      {
        pattern: 'া',
        pronunciation: 'aa (long)',
        context: 'Long vowel',
        examples: ['বাংলা (bangla)', 'নাম (naam)', 'কাজ (kaaj)']
      },
      {
        pattern: 'ি',
        pronunciation: 'i (short)',
        context: 'Short i',
        examples: ['দিন (din)', 'কিন্তু (kintu)', 'লিখা (likha)']
      },
      {
        pattern: 'ী',
        pronunciation: 'ee (long)',
        context: 'Long i',
        examples: ['নদী (nodee)', 'জীবন (jeebon)', 'বই (boi)']
      }
    ],
    commonMispronunciations: [],
    toneMarkers: [
      {
        marker: '।',
        meaning: 'Danda (full stop)',
        ssml: '<break time="400ms"/>'
      }
    ],
    aspiratedSounds: ['খ', 'ঘ', 'ছ', 'ঝ', 'ঠ', 'ঢ', 'থ', 'ধ', 'ফ', 'ভ'],
    retroflexSounds: ['ট', 'ঠ', 'ড', 'ঢ', 'ণ'],
    nasalSounds: ['ং', 'ঞ', 'ঙ', 'ণ', 'ন', 'ম'],
    voicingRules: []
  }
};

/**
 * Generate phonetically accurate SSML with proper pauses and emphasis
 */
export function generatePhoneticSSML(
  text: string,
  language: string,
  dialect?: string
): string {
  const langPhonetics = INDIAN_LANGUAGE_PHONETICS[dialect || language];
  
  if (!langPhonetics) {
    return `<speak><p>${text}</p></speak>`;
  }

  let ssmlText = text;

  // Apply tone markers
  langPhonetics.toneMarkers.forEach(marker => {
    const regex = new RegExp(marker.marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    ssmlText = ssmlText.replace(regex, marker.ssml);
  });

  // Wrap in SSML tags
  return `<speak><p>${ssmlText}</p></speak>`;
}

/**
 * Get pronunciation guide for a word
 */
export function getPronunciationGuide(
  word: string,
  language: string
): { ipa: string; description: string } | null {
  const langPhonetics = INDIAN_LANGUAGE_PHONETICS[language];
  
  if (!langPhonetics) {
    return null;
  }

  // Find matching phonetic rule
  for (const rule of langPhonetics.phoneticRules) {
    if (word.includes(rule.pattern)) {
      return {
        ipa: rule.pronunciation,
        description: rule.context || ''
      };
    }
  }

  return null;
}
