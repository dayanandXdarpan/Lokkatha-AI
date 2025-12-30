/**
 * Location and Dialect Detection Service
 * Handles geolocation, state detection, and dialect recommendations
 */

import { openDB, type IDBPDatabase } from 'idb';

// State dialect mapping (from backend)
export interface DialectOption {
	id: string;
	name: string;
	language: string;
	nativeName: string;
}

export interface StateDialects {
	state: string;
	dialects: DialectOption[];
}

// Comprehensive state-dialect mapping
export const STATE_DIALECTS_MAP: Record<string, DialectOption[]> = {
	Bihar: [
		{ id: 'bhojpuri', name: 'Bhojpuri', language: 'Hindi', nativeName: 'भोजपुरी' },
		{ id: 'maithili', name: 'Maithili', language: 'Hindi', nativeName: 'मैथिली' },
		{ id: 'magahi', name: 'Magahi', language: 'Hindi', nativeName: 'मगही' },
		{ id: 'hindi', name: 'Standard Hindi', language: 'Hindi', nativeName: 'हिन्दी' }
	],
	'Uttar Pradesh': [
		{ id: 'bhojpuri', name: 'Bhojpuri', language: 'Hindi', nativeName: 'भोजपुरी' },
		{ id: 'awadhi', name: 'Awadhi', language: 'Hindi', nativeName: 'अवधी' },
		{ id: 'braj', name: 'Braj Bhasha', language: 'Hindi', nativeName: 'ब्रज भाषा' },
		{ id: 'bundeli', name: 'Bundeli', language: 'Hindi', nativeName: 'बुन्देली' },
		{ id: 'hindi', name: 'Standard Hindi', language: 'Hindi', nativeName: 'हिन्दी' }
	],
	'Madhya Pradesh': [
		{ id: 'bundeli', name: 'Bundeli', language: 'Hindi', nativeName: 'बुन्देली' },
		{ id: 'chhattisgarhi', name: 'Chhattisgarhi', language: 'Hindi', nativeName: 'छत्तीसगढ़ी' },
		{ id: 'hindi', name: 'Standard Hindi', language: 'Hindi', nativeName: 'हिन्दी' }
	],
	Rajasthan: [
		{ id: 'rajasthani', name: 'Rajasthani', language: 'Hindi', nativeName: 'राजस्थानी' },
		{ id: 'hindi', name: 'Standard Hindi', language: 'Hindi', nativeName: 'हिन्दी' }
	],
	Haryana: [
		{ id: 'haryanvi', name: 'Haryanvi', language: 'Hindi', nativeName: 'हरियाणवी' },
		{ id: 'hindi', name: 'Standard Hindi', language: 'Hindi', nativeName: 'हिन्दी' }
	],
	Punjab: [
		{ id: 'punjabi', name: 'Punjabi', language: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
		{ id: 'hindi', name: 'Hindi', language: 'Hindi', nativeName: 'हिन्दी' }
	],
	Chhattisgarh: [
		{ id: 'chhattisgarhi', name: 'Chhattisgarhi', language: 'Hindi', nativeName: 'छत्तीसगढ़ी' },
		{ id: 'hindi', name: 'Standard Hindi', language: 'Hindi', nativeName: 'हिन्दी' }
	],
	Jharkhand: [
		{ id: 'bhojpuri', name: 'Bhojpuri', language: 'Hindi', nativeName: 'भोजपुरी' },
		{ id: 'magahi', name: 'Magahi', language: 'Hindi', nativeName: 'मगही' },
		{ id: 'hindi', name: 'Standard Hindi', language: 'Hindi', nativeName: 'हिन्दी' }
	],
	Delhi: [
		{ id: 'hindi', name: 'Hindi', language: 'Hindi', nativeName: 'हिन्दी' },
		{ id: 'english', name: 'English', language: 'English', nativeName: 'English' }
	],
	'Tamil Nadu': [
		{ id: 'tamil', name: 'Tamil', language: 'Tamil', nativeName: 'தமிழ்' },
		{ id: 'english', name: 'English', language: 'English', nativeName: 'English' }
	],
	'Andhra Pradesh': [
		{ id: 'telugu', name: 'Telugu', language: 'Telugu', nativeName: 'తెలుగు' },
		{ id: 'english', name: 'English', language: 'English', nativeName: 'English' }
	],
	Telangana: [
		{ id: 'telugu', name: 'Telugu', language: 'Telugu', nativeName: 'తెలుగు' },
		{ id: 'english', name: 'English', language: 'English', nativeName: 'English' }
	],
	Karnataka: [
		{ id: 'kannada', name: 'Kannada', language: 'Kannada', nativeName: 'ಕನ್ನಡ' },
		{ id: 'english', name: 'English', language: 'English', nativeName: 'English' }
	],
	Kerala: [
		{ id: 'malayalam', name: 'Malayalam', language: 'Malayalam', nativeName: 'മലയാളം' },
		{ id: 'english', name: 'English', language: 'English', nativeName: 'English' }
	],
	'West Bengal': [
		{ id: 'bengali', name: 'Bengali', language: 'Bengali', nativeName: 'বাংলা' },
		{ id: 'hindi', name: 'Hindi', language: 'Hindi', nativeName: 'हिन्दी' },
		{ id: 'english', name: 'English', language: 'English', nativeName: 'English' }
	],
	Odisha: [
		{ id: 'odia', name: 'Odia', language: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
		{ id: 'hindi', name: 'Hindi', language: 'Hindi', nativeName: 'हिन्दी' }
	],
	Gujarat: [
		{ id: 'gujarati', name: 'Gujarati', language: 'Gujarati', nativeName: 'ગુજરાતી' },
		{ id: 'hindi', name: 'Hindi', language: 'Hindi', nativeName: 'हिन्दी' }
	],
	Maharashtra: [
		{ id: 'marathi', name: 'Marathi', language: 'Marathi', nativeName: 'मराठी' },
		{ id: 'hindi', name: 'Hindi', language: 'Hindi', nativeName: 'हिन्दी' }
	],
	Goa: [
		{ id: 'konkani', name: 'Konkani', language: 'Konkani', nativeName: 'कोंकणी' },
		{ id: 'marathi', name: 'Marathi', language: 'Marathi', nativeName: 'मराठी' }
	],
	Assam: [
		{ id: 'assamese', name: 'Assamese', language: 'Assamese', nativeName: 'অসমীয়া' },
		{ id: 'bengali', name: 'Bengali', language: 'Bengali', nativeName: 'বাংলা' }
	]
};

// Default dialects for unknown states
const DEFAULT_DIALECTS: DialectOption[] = [
	{ id: 'hindi', name: 'Hindi', language: 'Hindi', nativeName: 'हिन्दी' },
	{ id: 'english', name: 'English', language: 'English', nativeName: 'English' }
];

// IndexedDB for storing user preferences
const DB_NAME = 'lokkatha-settings';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

async function getDB() {
	if (!dbPromise) {
		dbPromise = openDB(DB_NAME, DB_VERSION, {
			upgrade(db) {
				if (!db.objectStoreNames.contains('settings')) {
					db.createObjectStore('settings');
				}
			}
		});
	}
	return dbPromise;
}

/**
 * Get user's current location using Geolocation API with graceful fallback
 */
export async function getUserLocation(): Promise<GeolocationPosition | null> {
	if (!navigator.geolocation) {
		console.warn('Geolocation not supported - will use manual selection');
		return null;
	}

	return new Promise((resolve) => {
		navigator.geolocation.getCurrentPosition(
			(position) => resolve(position),
			(error) => {
				console.warn('Geolocation permission denied or unavailable - will use manual selection:', error.message);
				resolve(null);
			},
			{
				enableHighAccuracy: false,
				timeout: 10000,
				maximumAge: 300000 // Cache for 5 minutes
			}
		);
	});
}

/**
 * Attempt to detect state from IP address using a free geolocation API
 * Falls back gracefully if the service is unavailable
 */
export async function detectStateFromIP(): Promise<string | null> {
	try {
		// Using ipapi.co - free tier allows 1000 requests/day, no API key needed
		const response = await fetch('https://ipapi.co/json/', {
			method: 'GET',
			headers: {
				'User-Agent': 'LokKatha-PWA/1.0'
			}
		});

		if (!response.ok) {
			throw new Error('IP geolocation service unavailable');
		}

		const data = await response.json();
		const state = data.region || null;

		if (state) {
			console.log('Detected state from IP:', state);
			return state;
		}
		
		return null;
	} catch (error) {
		console.warn('Failed to detect state from IP:', error);
		return null;
	}
}

/**
 * Detect Indian state from coordinates using reverse geocoding
 */
export async function detectStateFromCoordinates(
	latitude: number,
	longitude: number
): Promise<string | null> {
	try {
		// Using Nominatim (OpenStreetMap) reverse geocoding API
		const response = await fetch(
			`https://nominatim.openstreetmap.org/reverse?` +
				`lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
			{
				headers: {
					'User-Agent': 'LokKatha-PWA/1.0'
				}
			}
		);

		if (!response.ok) {
			throw new Error('Geocoding failed');
		}

		const data = await response.json();
		const state = data.address?.state || null;

		console.log('Detected state:', state);
		return state;
	} catch (error) {
		console.error('Error detecting state:', error);
		return null;
	}
}

/**
 * Get dialects for a state
 */
export function getDialectsForState(state: string): DialectOption[] {
	const dialects = STATE_DIALECTS_MAP[state];
	return dialects || DEFAULT_DIALECTS;
}

/**
 * Save user's dialect preference
 */
export async function saveDialectPreference(dialect: DialectOption): Promise<void> {
	const db = await getDB();
	await db.put('settings', dialect, 'preferredDialect');
	console.log('Dialect preference saved:', dialect);
}

/**
 * Get saved dialect preference
 */
export async function getDialectPreference(): Promise<DialectOption | null> {
	try {
		const db = await getDB();
		const dialect = await db.get('settings', 'preferredDialect');
		return dialect || null;
	} catch (error) {
		console.error('Error getting dialect preference:', error);
		return null;
	}
}

/**
 * Save detected state
 */
export async function saveDetectedState(state: string): Promise<void> {
	const db = await getDB();
	await db.put('settings', state, 'detectedState');
}

/**
 * Get saved state
 */
export async function getDetectedState(): Promise<string | null> {
	try {
		const db = await getDB();
		const state = await db.get('settings', 'detectedState');
		return state || null;
	} catch (error) {
		console.error('Error getting detected state:', error);
		return null;
	}
}

/**
 * Check if onboarding has been completed
 */
export async function hasCompletedOnboarding(): Promise<boolean> {
	try {
		const db = await getDB();
		const completed = await db.get('settings', 'onboardingCompleted');
		return completed === true;
	} catch (error) {
		return false;
	}
}

/**
 * Mark onboarding as completed
 */
export async function markOnboardingCompleted(): Promise<void> {
	const db = await getDB();
	await db.put('settings', true, 'onboardingCompleted');
}

/**
 * Request location permission
 */
export async function requestLocationPermission(): Promise<PermissionState> {
	try {
		if ('permissions' in navigator) {
			const result = await navigator.permissions.query({ name: 'geolocation' });
			return result.state;
		}
		return 'prompt';
	} catch (error) {
		console.error('Error checking location permission:', error);
		return 'prompt';
	}
}

/**
 * Complete onboarding flow: detect location and get dialect with graceful fallback
 */
export async function completeOnboardingFlow(): Promise<{
	state: string | null;
	dialects: DialectOption[];
	selectedDialect?: DialectOption;
	locationAvailable: boolean;
}> {
	// Try IP-based detection first (works without user permission)
	let state: string | null = await detectStateFromIP();
	let dialects: DialectOption[] = DEFAULT_DIALECTS;
	let locationAvailable = false;

	if (state) {
		locationAvailable = true;
		await saveDetectedState(state);
		dialects = getDialectsForState(state);
		console.log(`State detected from IP: ${state}`);
	} else {
		// Try GPS-based location as fallback
		const position = await getUserLocation();

		if (position) {
			locationAvailable = true;
			// Detect state from coordinates
			state = await detectStateFromCoordinates(
				position.coords.latitude,
				position.coords.longitude
			);

			if (state) {
				await saveDetectedState(state);
				dialects = getDialectsForState(state);
				console.log(`State detected from GPS: ${state}`);
			}
		}
	}

	if (!state) {
		// Fallback: Show all available dialects from all states
		console.log('Location not available - showing all dialect options');
		const allDialects = new Map<string, DialectOption>();
		
		// Collect unique dialects from all states
		Object.values(STATE_DIALECTS_MAP).forEach(stateDialects => {
			stateDialects.forEach(dialect => {
				if (!allDialects.has(dialect.id)) {
					allDialects.set(dialect.id, dialect);
				}
			});
		});
		
		dialects = Array.from(allDialects.values()).sort((a, b) => 
			a.name.localeCompare(b.name)
		);
	}

	// Check if there's already a saved preference
	const savedDialect = await getDialectPreference();

	return {
		state,
		dialects,
		selectedDialect: savedDialect || undefined,
		locationAvailable
	};
}

/**
 * Get all available dialects (for manual selection when location is unavailable)
 */
export function getAllDialects(): DialectOption[] {
	const allDialects = new Map<string, DialectOption>();
	
	Object.values(STATE_DIALECTS_MAP).forEach(stateDialects => {
		stateDialects.forEach(dialect => {
			if (!allDialects.has(dialect.id)) {
				allDialects.set(dialect.id, dialect);
			}
		});
	});
	
	return Array.from(allDialects.values()).sort((a, b) => 
		a.name.localeCompare(b.name)
	);
}
