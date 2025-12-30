/**
 * User preferences and settings store
 * Persisted in localStorage for offline access
 */

import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';

export interface UserSettings {
	// Language preferences
	defaultLanguage: string;
	defaultDialect: string | null;
	accentPreference: 'formal' | 'casual' | 'child-friendly' | 'auto'; // Speaking style
	ttsVoiceGender: 'male' | 'female' | 'auto'; // TTS voice preference
	
	// Location preferences (for dialect detection)
	state: string | null;
	location: string | null;
	
	// First-time setup
	hasCompletedSetup: boolean;
	
	// Video preferences
	videoQuality: 'high' | 'medium' | 'low';
	voiceSpeed: 'slow' | 'normal' | 'fast';
	autoDownload: boolean;
	autoPlayNewVideos: boolean; // Auto-play newly created videos
	
	// UI preferences
	theme: 'light' | 'dark' | 'auto';
	fontSize: 'small' | 'medium' | 'large';
	reducedMotion: boolean;
	
	// Advanced settings
	offlineMode: boolean;
	lowBandwidthMode: boolean;
	cacheDuration: number; // days
	maxStorageGB: number;
}

const DEFAULT_SETTINGS: UserSettings = {
	defaultLanguage: 'English',
	defaultDialect: null,
	accentPreference: 'child-friendly',
	ttsVoiceGender: 'auto',
	state: null,
	location: null,
	hasCompletedSetup: false,
	videoQuality: 'medium',
	voiceSpeed: 'normal',
	autoDownload: false,
	autoPlayNewVideos: false,
	theme: 'light',
	fontSize: 'medium',
	reducedMotion: false,
	offlineMode: false,
	lowBandwidthMode: false,
	cacheDuration: 30,
	maxStorageGB: 1
};

const STORAGE_KEY = 'lokkatha_settings';

// Load settings from localStorage
function loadSettings(): UserSettings {
	if (!browser) return DEFAULT_SETTINGS;
	
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored);
			return { ...DEFAULT_SETTINGS, ...parsed };
		}
	} catch (error) {
		console.error('Failed to load settings:', error);
	}
	
	return DEFAULT_SETTINGS;
}

// Create the store
function createSettingsStore() {
	const { subscribe, set, update } = writable<UserSettings>(loadSettings());
	
	return {
		subscribe,
		set: (value: UserSettings) => {
			if (browser) {
				localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
			}
			set(value);
		},
		update: (fn: (settings: UserSettings) => UserSettings) => {
			update((settings) => {
				const updated = fn(settings);
				if (browser) {
					localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
				}
				return updated;
			});
		},
		reset: () => {
			if (browser) {
				localStorage.removeItem(STORAGE_KEY);
			}
			set(DEFAULT_SETTINGS);
		},
		
		// Helper methods
		updateLanguage: (language: string, dialect: string | null = null) => {
			update((s) => ({ ...s, defaultLanguage: language, defaultDialect: dialect }));
		},
		
		updateLocation: (state: string, location: string) => {
			update((s) => ({ ...s, state, location }));
		},
		
		updateVideoQuality: (quality: 'high' | 'medium' | 'low') => {
			update((s) => ({ ...s, videoQuality: quality }));
		},
		
		updateVoiceSpeed: (speed: 'slow' | 'normal' | 'fast') => {
			update((s) => ({ ...s, voiceSpeed: speed }));
		},
		
		toggleOfflineMode: () => {
			update((s) => ({ ...s, offlineMode: !s.offlineMode }));
		},
		
		toggleLowBandwidth: () => {
			update((s) => ({ ...s, lowBandwidthMode: !s.lowBandwidthMode }));
		}
	};
}

export const settings = createSettingsStore();

// Indian states for location selection
export const INDIAN_STATES = [
	'Andhra Pradesh',
	'Arunachal Pradesh',
	'Assam',
	'Bihar',
	'Chhattisgarh',
	'Goa',
	'Gujarat',
	'Haryana',
	'Himachal Pradesh',
	'Jharkhand',
	'Karnataka',
	'Kerala',
	'Madhya Pradesh',
	'Maharashtra',
	'Manipur',
	'Meghalaya',
	'Mizoram',
	'Nagaland',
	'Odisha',
	'Punjab',
	'Rajasthan',
	'Sikkim',
	'Tamil Nadu',
	'Telangana',
	'Tripura',
	'Uttar Pradesh',
	'Uttarakhand',
	'West Bengal',
	'Andaman and Nicobar Islands',
	'Chandigarh',
	'Dadra and Nagar Haveli and Daman and Diu',
	'Delhi',
	'Jammu and Kashmir',
	'Ladakh',
	'Lakshadweep',
	'Puducherry'
];

// Dialect mapping based on state
export const STATE_DIALECTS: Record<string, string[]> = {
	'Uttar Pradesh': ['Awadhi', 'Bhojpuri', 'Braj', 'Bundeli', 'Standard Hindi'],
	'Bihar': ['Bhojpuri', 'Maithili', 'Magahi', 'Angika'],
	'Madhya Pradesh': ['Bundeli', 'Bagheli', 'Malvi', 'Standard Hindi'],
	'Rajasthan': ['Marwari', 'Mewari', 'Dhundhari', 'Haryanvi'],
	'Maharashtra': ['Marathi', 'Konkani', 'Malvani'],
	'Gujarat': ['Gujarati', 'Kathiyawadi', 'Saurashtra'],
	'Tamil Nadu': ['Tamil', 'Kongu Tamil', 'Madurai Tamil'],
	'Karnataka': ['Kannada', 'Havyaka', 'Tulu'],
	'Kerala': ['Malayalam', 'Kasargod Malayalam'],
	'Andhra Pradesh': ['Telugu', 'Rayalaseema Telugu'],
	'Telangana': ['Telugu', 'Hyderabadi Telugu'],
	'West Bengal': ['Bengali', 'Rarh Bengali'],
	'Punjab': ['Punjabi', 'Malwai', 'Doabi', 'Majhi'],
	'Haryana': ['Haryanvi', 'Mewati'],
	'Odisha': ['Odia', 'Sambalpuri']
};

// Get dialects for a state
export function getDialectsForState(state: string): string[] {
	return STATE_DIALECTS[state] || [];
}

// Auto-detect dialect based on state (best guess)
export function getDefaultDialectForState(state: string): string | null {
	const dialects = getDialectsForState(state);
	return dialects.length > 0 ? dialects[0] : null;
}
