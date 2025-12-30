/**
 * Simple, friendly messages for rural teachers with no technical knowledge
 * All messages are bilingual (Hindi/English) and use emoji for clarity
 */

export interface SimpleMessage {
	en: string;
	hi: string;
	emoji?: string;
}

export const SIMPLE_MESSAGES = {
	// Scanning & Reading
	readingText: {
		en: 'Reading the text...',
		hi: 'पाठ पढ़ रहे हैं...',
		emoji: '📖'
	},
	improvingText: {
		en: 'Making it better...',
		hi: 'सुधार कर रहे हैं...',
		emoji: '✨'
	},
	creatingVoice: {
		en: 'Creating voice...',
		hi: 'आवाज़ बना रहे हैं...',
		emoji: '🎤'
	},
	makingVideo: {
		en: 'Making your video...',
		hi: 'वीडियो बन रहा है...',
		emoji: '🎬'
	},
	findingPictures: {
		en: 'Finding pictures...',
		hi: 'तस्वीरें ढूंढ रहे हैं...',
		emoji: '🖼️'
	},
	writingStory: {
		en: 'Writing the story...',
		hi: 'कहानी लिख रहे हैं...',
		emoji: '📝'
	},

	// Success Messages
	allDone: {
		en: 'All done!',
		hi: 'हो गया!',
		emoji: '✅'
	},
	videoReady: {
		en: 'Video is ready!',
		hi: 'वीडियो तैयार है!',
		emoji: '🎉'
	},
	textExtracted: {
		en: 'Text found successfully!',
		hi: 'पाठ मिल गया!',
		emoji: '✓'
	},

	// Error Messages (Simple & Friendly)
	noInternet: {
		en: 'No internet. Please check connection.',
		hi: 'इंटरनेट नहीं है। कृपया जाँचें।',
		emoji: '📡'
	},
	tryAgain: {
		en: 'Something went wrong. Try again?',
		hi: 'कुछ गड़बड़ हुई। फिर कोशिश करें?',
		emoji: '🔄'
	},
	notEnoughSpace: {
		en: 'Not enough space. Delete old lessons.',
		hi: 'जगह कम है। पुराने पाठ हटाएं।',
		emoji: '💾'
	},
	poorPhoto: {
		en: 'Photo not clear. Take again with more light.',
		hi: 'फोटो साफ नहीं है। रोशनी में फिर से लें।',
		emoji: '💡'
	},
	cantReadText: {
		en: 'Cannot read text clearly. Try better photo.',
		hi: 'पाठ स्पष्ट नहीं। बेहतर फोटो लें।',
		emoji: '📷'
	},

	// Actions
	takePhoto: {
		en: 'Take Photo',
		hi: 'फोटो लें',
		emoji: '📷'
	},
	fromGallery: {
		en: 'From Gallery',
		hi: 'गैलरी से',
		emoji: '🖼️'
	},
	uploadPDF: {
		en: 'Upload PDF',
		hi: 'PDF अपलोड करें',
		emoji: '📄'
	},
	retake: {
		en: 'Take Again',
		hi: 'फिर से लें',
		emoji: '🔄'
	},
	useThis: {
		en: 'Use This',
		hi: 'इसे चुनें',
		emoji: '✅'
	},

	// Progress
	pleaseWait: {
		en: 'Please wait...',
		hi: 'कृपया प्रतीक्षा करें...',
		emoji: '⏳'
	},
	almostDone: {
		en: 'Almost done!',
		hi: 'लगभग हो गया!',
		emoji: '⌛'
	},

	// Storage
	spaceUsed: {
		en: 'Space used',
		hi: 'जगह भरी',
		emoji: '💾'
	},
	spaceLeft: {
		en: 'Space left',
		hi: 'जगह बची',
		emoji: '📦'
	},

	// Quality
	goodQuality: {
		en: 'Good quality!',
		hi: 'अच्छी गुणवत्ता!',
		emoji: '⭐'
	},
	okayQuality: {
		en: 'Okay quality',
		hi: 'ठीक गुणवत्ता',
		emoji: '👍'
	},
	poorQuality: {
		en: 'Need better photo',
		hi: 'बेहतर फोटो चाहिए',
		emoji: '⚠️'
	}
};

/**
 * Get message in specified language
 */
export function getMessage(
	key: keyof typeof SIMPLE_MESSAGES,
	language: string = 'en'
): string {
	const message = SIMPLE_MESSAGES[key];
	if (!message) return key;

	const lang = language.toLowerCase().startsWith('hi') ? 'hi' : 'en';
	const text = message[lang as 'en' | 'hi'];
	const emoji = message.emoji ? `${message.emoji} ` : '';

	return `${emoji}${text}`;
}

/**
 * Format error message in simple, friendly way
 */
export function simplifyError(error: Error | string, language: string = 'en'): string {
	const errorMsg = typeof error === 'string' ? error : error.message;
	const lang = language.toLowerCase().startsWith('hi') ? 'hi' : 'en';

	// Map technical errors to friendly messages
	if (errorMsg.includes('network') || errorMsg.includes('fetch') || errorMsg.includes('connection')) {
		return getMessage('noInternet', language);
	}

	if (errorMsg.includes('quota') || errorMsg.includes('storage') || errorMsg.includes('space')) {
		return getMessage('notEnoughSpace', language);
	}

	if (errorMsg.includes('quality') || errorMsg.includes('confidence') || errorMsg.includes('blur')) {
		return getMessage('poorPhoto', language);
	}

	if (errorMsg.includes('OCR') || errorMsg.includes('text') || errorMsg.includes('extract')) {
		return getMessage('cantReadText', language);
	}

	// Default friendly error
	return getMessage('tryAgain', language);
}

/**
 * Get quality message based on score
 */
export function getQualityMessage(score: number, language: string = 'en'): string {
	if (score >= 80) {
		return getMessage('goodQuality', language);
	} else if (score >= 60) {
		return getMessage('okayQuality', language);
	} else {
		return getMessage('poorQuality', language);
	}
}
