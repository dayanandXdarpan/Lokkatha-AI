import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import { languages, translations, type Language, type TranslationKey } from './translations';

// Get initial language from localStorage or browser
function getInitialLanguage(): Language {
	if (browser) {
		const stored = localStorage.getItem('lokkatha_language');
		if (stored && stored in languages) {
			return stored as Language;
		}
		// Try to detect from browser
		const browserLang = navigator.language.split('-')[0];
		if (browserLang in languages) {
			return browserLang as Language;
		}
	}
	return 'en';
}

// Language store
export const currentLanguage = writable<Language>(getInitialLanguage());

// Save language changes to localStorage
currentLanguage.subscribe((lang) => {
	if (browser) {
		localStorage.setItem('lokkatha_language', lang);
		// Update document properties for fonts
		const config = languages[lang];
		document.documentElement.style.setProperty('--app-font', config.font);
		document.documentElement.dir = config.direction;
	}
});

// Current translations (reactive)
export const t = derived(currentLanguage, ($lang) => {
	const langTranslations = translations[$lang];
	
	return (key: TranslationKey, params?: Record<string, string | number>): string => {
		let text = langTranslations[key] || translations.en[key] || key;
		
		// Replace parameters like {name} with actual values
		if (params) {
			Object.entries(params).forEach(([paramKey, value]) => {
				text = text.replace(`{${paramKey}}`, String(value));
			});
		}
		
		return text;
	};
});

// Get current language config
export const languageConfig = derived(currentLanguage, ($lang) => languages[$lang]);

// Helper to change language
export function setLanguage(lang: Language) {
	currentLanguage.set(lang);
}

// Get all available languages
export function getAvailableLanguages() {
	return Object.values(languages);
}
