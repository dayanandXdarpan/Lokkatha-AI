export type Language = 'en' | 'hi' | 'ta' | 'te' | 'kn' | 'ml' | 'bn' | 'mr' | 'gu';

export interface LanguageConfig {
	code: Language;
	name: string;
	nativeName: string;
	font: string;
	direction: 'ltr' | 'rtl';
}

export const languages: Record<Language, LanguageConfig> = {
	en: {
		code: 'en',
		name: 'English',
		nativeName: 'English',
		font: 'Inter, system-ui, sans-serif',
		direction: 'ltr'
	},
	hi: {
		code: 'hi',
		name: 'Hindi',
		nativeName: 'हिंदी',
		font: 'Noto Sans Devanagari, sans-serif',
		direction: 'ltr'
	},
	ta: {
		code: 'ta',
		name: 'Tamil',
		nativeName: 'தமிழ்',
		font: 'Noto Sans Tamil, sans-serif',
		direction: 'ltr'
	},
	te: {
		code: 'te',
		name: 'Telugu',
		nativeName: 'తెలుగు',
		font: 'Noto Sans Telugu, sans-serif',
		direction: 'ltr'
	},
	kn: {
		code: 'kn',
		name: 'Kannada',
		nativeName: 'ಕನ್ನಡ',
		font: 'Noto Sans Kannada, sans-serif',
		direction: 'ltr'
	},
	ml: {
		code: 'ml',
		name: 'Malayalam',
		nativeName: 'മലയാളം',
		font: 'Noto Sans Malayalam, sans-serif',
		direction: 'ltr'
	},
	bn: {
		code: 'bn',
		name: 'Bengali',
		nativeName: 'বাংলা',
		font: 'Noto Sans Bengali, sans-serif',
		direction: 'ltr'
	},
	mr: {
		code: 'mr',
		name: 'Marathi',
		nativeName: 'मराठी',
		font: 'Noto Sans Devanagari, sans-serif',
		direction: 'ltr'
	},
	gu: {
		code: 'gu',
		name: 'Gujarati',
		nativeName: 'ગુજરાતી',
		font: 'Noto Sans Gujarati, sans-serif',
		direction: 'ltr'
	}
};

export const translations: Record<Language, Record<string, string>> = {
	en: {
		// App
		appName: 'LokKatha AI',
		appTagline: 'Learn Anywhere, Anytime',

		// Navigation
		navHome: 'Home',
		navCreate: 'Create',
		navLessons: 'My Lessons',
		navSettings: 'Settings',

		// Network Status
		networkOnline: 'Online',
		networkOffline: 'Offline',
		networkOfflineMessage: 'You are offline. Only saved lessons are available.',

		// Home
		homeWelcome: 'Welcome Teacher!',
		homeCreateNew: 'Create New Lesson',
		homeMyLessons: 'My Lessons',
		homeStorage: 'Storage',

		// Create Lesson - Step 1
		createTitle: 'Create Lesson',
		createStep1: 'What topic?',
		createTopicPlaceholder: 'Example: Solar System, Fractions, History of India',
		createStep2: 'Which grade?',
		createGrade: 'Grade {grade}',
		createStep3: 'Which language?',
		createStep4: 'How long?',
		createDuration: '{minutes} minutes',
		createNext: 'Next',
		createBack: 'Back',
		createStart: 'Create Lesson',

		// Create Options
		createOptions: 'Lesson Options',
		createQuality: 'Video Quality',
		createQualityLow: 'Low (saves space)',
		createQualityMedium: 'Medium (balanced)',
		createQualityHigh: 'High (best quality)',
		createSubtitles: 'Include Subtitles',
		createSubtitlesYes: 'Yes',
		createSubtitlesNo: 'No',
		createEstimatedSize: 'Estimated Size: {size}MB',

		// Progress
		progressCreating: 'Creating Your Lesson...',
		progressStep1: 'Writing the story...',
		progressStep2: 'Finding pictures...',
		progressStep3: 'Recording voice...',
		progressStep4: 'Adding subtitles...',
		progressStep5: 'Making video...',
		progressStep6: 'Saving...',
		progressStep7: 'Almost done!',
		progressComplete: 'Lesson Ready!',
		progressFailed: 'Something went wrong',
		progressRetry: 'Try Again',
		progressDownload: 'Download Lesson',

		// Lessons Library
		lessonsTitle: 'My Lessons',
		lessonsEmpty: 'No lessons yet',
		lessonsEmptyHint: 'Tap + to create your first lesson',
		lessonsLoading: 'Loading lessons...',
		lessonsCount: '{count} lessons',
		lessonsPlay: 'Play',
		lessonsDelete: 'Delete',
		lessonsDeleteConfirm: 'Delete this lesson?',
		lessonsDeleteMessage: 'This will permanently delete the lesson from your device.',
		lessonsDeleteYes: 'Delete',
		lessonsDeleteCancel: 'Cancel',
		lessonsToday: 'Today',
		lessonsYesterday: 'Yesterday',
		lessonsDaysAgo: '{days} days ago',

		// Storage
		storageTitle: 'Storage',
		storageUsed: 'Used: {used}MB of {total}MB',
		storageFree: 'Free: {free}MB',
		storageWarning: 'Storage almost full!',
		storageWarningHint: 'Delete old lessons to free space',
		storageManage: 'Manage Storage',

		// Settings
		settingsTitle: 'Settings',
		settingsLanguage: 'App Language',
		settingsFont: 'Font Size',
		settingsFontSmall: 'Small',
		settingsFontMedium: 'Medium',
		settingsFontLarge: 'Large',
		settingsAbout: 'About',
		settingsVersion: 'Version {version}',

		// Errors
		errorNetwork: 'No internet connection',
		errorNetworkHint: 'Connect to internet to create lessons',
		errorStorage: 'Not enough storage space',
		errorStorageHint: 'Delete old lessons to free space',
		errorGeneric: 'Something went wrong',
		errorTryAgain: 'Try Again',

		// Common
		ok: 'OK',
		cancel: 'Cancel',
		close: 'Close',
		loading: 'Loading...',
		retry: 'Retry'
	},
	hi: {
		// App
		appName: 'लोककथा AI',
		appTagline: 'कहीं भी, कभी भी सीखें',

		// Navigation
		navCreate: 'बनाएं',
		navLessons: 'मेरे पाठ',
		navSettings: 'सेटिंग्स',

		// Home
		homeWelcome: 'स्वागत शिक्षक जी!',
		homeCreateNew: 'नया पाठ बनाएं',
		homeMyLessons: 'मेरे पाठ',
		homeStorage: 'स्टोरेज',

		// Create Lesson - Step 1
		createTitle: 'पाठ बनाएं',
		createStep1: 'कौन सा विषय?',
		createTopicPlaceholder: 'उदाहरण: सौर मंडल, भिन्न, भारत का इतिहास',
		createStep2: 'कौन सी कक्षा?',
		createGrade: 'कक्षा {grade}',
		createStep3: 'कौन सी भाषा?',
		createStep4: 'कितने मिनट?',
		createDuration: '{minutes} मिनट',
		createNext: 'आगे',
		createBack: 'पीछे',
		createStart: 'पाठ बनाएं',

		// Create Options
		createOptions: 'पाठ विकल्प',
		createQuality: 'वीडियो गुणवत्ता',
		createQualityLow: 'कम (जगह बचाता है)',
		createQualityMedium: 'मध्यम (संतुलित)',
		createQualityHigh: 'उच्च (सर्वश्रेष्ठ)',
		createSubtitles: 'उपशीर्षक शामिल करें',
		createSubtitlesYes: 'हाँ',
		createSubtitlesNo: 'नहीं',
		createEstimatedSize: 'अनुमानित आकार: {size}MB',

		// Progress
		progressCreating: 'आपका पाठ बन रहा है...',
		progressStep1: 'कहानी लिख रहे हैं...',
		progressStep2: 'चित्र ढूंढ रहे हैं...',
		progressStep3: 'आवाज़ रिकॉर्ड कर रहे हैं...',
		progressStep4: 'उपशीर्षक जोड़ रहे हैं...',
		progressStep5: 'वीडियो बना रहे हैं...',
		progressStep6: 'सहेज रहे हैं...',
		progressStep7: 'लगभग हो गया!',
		progressComplete: 'पाठ तैयार है!',
		progressFailed: 'कुछ गलत हो गया',
		progressRetry: 'फिर कोशिश करें',
		progressDownload: 'पाठ डाउनलोड करें',

		// Lessons Library
		lessonsTitle: 'मेरे पाठ',
		lessonsEmpty: 'अभी कोई पाठ नहीं',
		lessonsEmptyHint: 'अपना पहला पाठ बनाने के लिए + दबाएं',
		lessonsCount: '{count} पाठ',
		lessonsPlay: 'चलाएं',
		lessonsDelete: 'मिटाएं',
		lessonsDeleteConfirm: 'इस पाठ को मिटाएं?',
		lessonsDeleteYes: 'मिटाएं',
		lessonsDeleteNo: 'रद्द करें',

		// Storage
		storageTitle: 'स्टोरेज',
		storageUsed: 'उपयोग: {used}MB में से {total}MB',
		storageFree: 'खाली: {free}MB',
		storageWarning: 'स्टोरेज लगभग भर गया!',
		storageWarningHint: 'जगह खाली करने के लिए पुराने पाठ मिटाएं',
		storageManage: 'स्टोरेज प्रबंधित करें',

		// Settings
		settingsTitle: 'सेटिंग्स',
		settingsLanguage: 'ऐप भाषा',
		settingsFont: 'फ़ॉन्ट आकार',
		settingsFontSmall: 'छोटा',
		settingsFontMedium: 'मध्यम',
		settingsFontLarge: 'बड़ा',
		settingsAbout: 'के बारे में',
		settingsVersion: 'संस्करण {version}',

		// Errors
		errorNetwork: 'इंटरनेट कनेक्शन नहीं',
		errorNetworkHint: 'पाठ बनाने के लिए इंटरनेट से कनेक्ट करें',
		errorStorage: 'पर्याप्त स्टोरेज नहीं',
		errorStorageHint: 'जगह खाली करने के लिए पुराने पाठ मिटाएं',
		errorGeneric: 'कुछ गलत हो गया',
		errorTryAgain: 'फिर कोशिश करें',

		// Common
		ok: 'ठीक है',
		cancel: 'रद्द करें',
		close: 'बंद करें',
		loading: 'लोड हो रहा है...',
		retry: 'फिर कोशिश करें'
	},
	ta: {
		// App
		appName: 'லோக்கதா AI',
		appTagline: 'எங்கும், எப்போதும் கற்றல்',

		// Navigation
		navCreate: 'உருவாக்கு',
		navLessons: 'என் பாடங்கள்',
		navSettings: 'அமைப்புகள்',

		// Home
		homeWelcome: 'வணக்கம் ஆசிரியரே!',
		homeCreateNew: 'புதிய பாடம் உருவாக்கு',
		homeMyLessons: 'என் பாடங்கள்',
		homeStorage: 'சேமிப்பகம்',

		// Create Lesson
		createTitle: 'பாடம் உருவாக்கு',
		createStep1: 'என்ன தலைப்பு?',
		createTopicPlaceholder: 'எடுத்துக்காட்டு: சூரிய மண்டலம், பின்னங்கள்',
		createStep2: 'எந்த வகுப்பு?',
		createGrade: 'வகுப்பு {grade}',
		createStep3: 'எந்த மொழி?',
		createStep4: 'எவ்வளவு நேரம்?',
		createDuration: '{minutes} நிமிடங்கள்',
		createNext: 'அடுத்து',
		createBack: 'பின்னால்',
		createStart: 'பாடம் தொடங்கு',

		// Rest of translations...
		createOptions: 'பாடம் விருப்பங்கள்',
		createQuality: 'வீடியோ தரம்',
		createQualityLow: 'குறைவான (இடம் சேமிக்கும்)',
		createQualityMedium: 'நடுத்தரம் (சமநிலை)',
		createQualityHigh: 'உயர் (சிறந்த தரம்)',
		createSubtitles: 'வசன வரிகள் சேர்க்கவும்',
		createSubtitlesYes: 'ஆம்',
		createSubtitlesNo: 'இல்லை',
		createEstimatedSize: 'மதிப்பிடப்பட்ட அளவு: {size}MB',

		progressCreating: 'உங்கள் பாடம் உருவாகிறது...',
		progressStep1: 'கதை எழுதுகிறது...',
		progressStep2: 'படங்களைக் கண்டுபிடிக்கிறது...',
		progressStep3: 'குரல் பதிவு செய்கிறது...',
		progressStep4: 'வசன வரிகள் சேர்க்கிறது...',
		progressStep5: 'வீடியோ உருவாக்குகிறது...',
		progressStep6: 'சேமிக்கிறது...',
		progressStep7: 'கிட்டத்தட்ட முடிந்தது!',
		progressComplete: 'பாடம் தயார்!',
		progressFailed: 'ஏதோ தவறு ஏற்பட்டது',
		progressRetry: 'மீண்டும் முயற்சிக்கவும்',
		progressDownload: 'பாடத்தை பதிவிறக்கவும்',

		lessonsTitle: 'என் பாடங்கள்',
		lessonsEmpty: 'இன்னும் பாடங்கள் இல்லை',
		lessonsEmptyHint: 'உங்கள் முதல் பாடத்தை உருவாக்க + அழுத்தவும்',
		lessonsCount: '{count} பாடங்கள்',
		lessonsPlay: 'இயக்கு',
		lessonsDelete: 'நீக்கு',
		lessonsDeleteConfirm: 'இந்த பாடத்தை நீக்கவா?',
		lessonsDeleteYes: 'நீக்கு',
		lessonsDeleteNo: 'ரத்து செய்',

		storageTitle: 'சேமிப்பகம்',
		storageUsed: 'பயன்படுத்தப்பட்டது: {used}MB / {total}MB',
		storageFree: 'இலவசம்: {free}MB',
		storageWarning: 'சேமிப்பகம் கிட்டத்தட்ட முழுவதும்!',
		storageWarningHint: 'இடத்தை காலியாக்க பழைய பாடங்களை நீக்கவும்',
		storageManage: 'சேமிப்பகத்தை நிர்வகிக்கவும்',

		settingsTitle: 'அமைப்புகள்',
		settingsLanguage: 'செயலி மொழி',
		settingsFont: 'எழுத்துரு அளவு',
		settingsFontSmall: 'சிறிய',
		settingsFontMedium: 'நடுத்தர',
		settingsFontLarge: 'பெரிய',
		settingsAbout: 'பற்றி',
		settingsVersion: 'பதிப்பு {version}',

		errorNetwork: 'இணைய இணைப்பு இல்லை',
		errorNetworkHint: 'பாடங்களை உருவாக்க இணையத்துடன் இணைக்கவும்',
		errorStorage: 'போதுமான சேமிப்பக இடம் இல்லை',
		errorStorageHint: 'இடத்தை காலியாக்க பழைய பாடங்களை நீக்கவும்',
		errorGeneric: 'ஏதோ தவறு ஏற்பட்டது',
		errorTryAgain: 'மீண்டும் முயற்சிக்கவும்',

		ok: 'சரி',
		cancel: 'ரத்து செய்',
		close: 'மூடு',
		loading: 'ஏற்றுகிறது...',
		retry: 'மீண்டும் முயற்சிக்கவும்'
	},
	// Add minimal translations for other languages (can be expanded later)
	te: { ...{} as typeof translations.en },
	kn: { ...{} as typeof translations.en },
	ml: { ...{} as typeof translations.en },
	bn: { ...{} as typeof translations.en },
	mr: { ...{} as typeof translations.en },
	gu: { ...{} as typeof translations.en }
};

export type TranslationKey = keyof typeof translations.en;

// Copy English translations as fallback for incomplete languages
Object.keys(translations).forEach((lang) => {
	if (lang !== 'en' && Object.keys(translations[lang as Language]).length === 0) {
		translations[lang as Language] = { ...translations.en };
	}
});
