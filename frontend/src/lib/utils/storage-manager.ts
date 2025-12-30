/**
 * Storage Management Utilities
 * Handles permissions, cache management, and storage persistence
 */

/**
 * Request persistent storage permission
 * This prevents browser from clearing IndexedDB and Cache automatically
 */
export async function requestPersistentStorage(): Promise<boolean> {
	if (!navigator.storage || !navigator.storage.persist) {
		console.warn('Persistent storage not supported');
		return false;
	}

	try {
		const isPersisted = await navigator.storage.persisted();
		
		if (isPersisted) {
			console.log('✓ Storage is already persistent');
			return true;
		}

		const granted = await navigator.storage.persist();
		
		if (granted) {
			console.log('✓ Persistent storage granted');
		} else {
			console.log('✗ Persistent storage denied');
		}
		
		return granted;
	} catch (error) {
		console.error('Error requesting persistent storage:', error);
		return false;
	}
}

/**
 * Check if storage is persistent
 */
export async function isStoragePersistent(): Promise<boolean> {
	if (!navigator.storage || !navigator.storage.persisted) {
		return false;
	}

	try {
		return await navigator.storage.persisted();
	} catch (error) {
		console.error('Error checking persistent storage:', error);
		return false;
	}
}

/**
 * Get detailed storage quota information
 */
export async function getStorageInfo(): Promise<{
	usage: number;
	quota: number;
	usageInMB: number;
	quotaInMB: number;
	percentage: number;
	isPersistent: boolean;
}> {
	try {
		const estimate = await navigator.storage.estimate();
		const isPersistent = await isStoragePersistent();
		
		const usage = estimate.usage || 0;
		const quota = estimate.quota || 0;
		const usageInMB = Math.round(usage / (1024 * 1024) * 10) / 10;
		const quotaInMB = Math.round(quota / (1024 * 1024) * 10) / 10;
		const percentage = quota > 0 ? Math.round((usage / quota) * 100) : 0;

		return {
			usage,
			quota,
			usageInMB,
			quotaInMB,
			percentage,
			isPersistent
		};
	} catch (error) {
		console.error('Error getting storage info:', error);
		return {
			usage: 0,
			quota: 0,
			usageInMB: 0,
			quotaInMB: 0,
			percentage: 0,
			isPersistent: false
		};
	}
}

/**
 * Clear all caches (service worker caches)
 */
export async function clearAllCaches(): Promise<boolean> {
	try {
		const cacheNames = await caches.keys();
		await Promise.all(
			cacheNames.map(cacheName => caches.delete(cacheName))
		);
		console.log('✓ All caches cleared');
		return true;
	} catch (error) {
		console.error('Error clearing caches:', error);
		return false;
	}
}

/**
 * Clear specific cache by name
 */
export async function clearCache(cacheName: string): Promise<boolean> {
	try {
		const deleted = await caches.delete(cacheName);
		if (deleted) {
			console.log(`✓ Cache "${cacheName}" cleared`);
		}
		return deleted;
	} catch (error) {
		console.error(`Error clearing cache "${cacheName}":`, error);
		return false;
	}
}

/**
 * Get list of all cache names
 */
export async function getCacheNames(): Promise<string[]> {
	try {
		return await caches.keys();
	} catch (error) {
		console.error('Error getting cache names:', error);
		return [];
	}
}

/**
 * Estimate cache size (approximate)
 */
export async function estimateCacheSize(): Promise<number> {
	try {
		const cacheNames = await caches.keys();
		let totalSize = 0;

		for (const cacheName of cacheNames) {
			const cache = await caches.open(cacheName);
			const keys = await cache.keys();
			
			for (const request of keys) {
				const response = await cache.match(request);
				if (response) {
					const blob = await response.blob();
					totalSize += blob.size;
				}
			}
		}

		return Math.round(totalSize / (1024 * 1024) * 10) / 10; // MB
	} catch (error) {
		console.error('Error estimating cache size:', error);
		return 0;
	}
}

/**
 * Check if service worker is supported and active
 */
export function isServiceWorkerSupported(): boolean {
	return 'serviceWorker' in navigator;
}

/**
 * Get service worker registration status
 */
export async function getServiceWorkerStatus(): Promise<{
	supported: boolean;
	registered: boolean;
	active: boolean;
	controller: boolean;
}> {
	if (!isServiceWorkerSupported()) {
		return {
			supported: false,
			registered: false,
			active: false,
			controller: false
		};
	}

	try {
		const registration = await navigator.serviceWorker.getRegistration();
		
		return {
			supported: true,
			registered: !!registration,
			active: !!(registration?.active),
			controller: !!navigator.serviceWorker.controller
		};
	} catch (error) {
		console.error('Error checking service worker status:', error);
		return {
			supported: true,
			registered: false,
			active: false,
			controller: false
		};
	}
}

/**
 * Send message to service worker
 */
export async function sendMessageToServiceWorker(message: any): Promise<void> {
	if (!navigator.serviceWorker.controller) {
		console.warn('No active service worker controller');
		return;
	}

	navigator.serviceWorker.controller.postMessage(message);
}

/**
 * Clear cache via service worker message
 */
export async function clearCacheViaServiceWorker(): Promise<boolean> {
	return new Promise((resolve) => {
		if (!navigator.serviceWorker.controller) {
			resolve(false);
			return;
		}

		const messageChannel = new MessageChannel();
		
		messageChannel.port1.onmessage = (event) => {
			if (event.data.type === 'CACHE_CLEARED') {
				resolve(event.data.success);
			}
		};

		navigator.serviceWorker.controller.postMessage(
			{ type: 'CLEAR_CACHE' },
			[messageChannel.port2]
		);

		// Timeout after 5 seconds
		setTimeout(() => resolve(false), 5000);
	});
}

/**
 * Initialize storage management on app start
 */
export async function initializeStorageManagement(): Promise<void> {
	console.log('🔧 Initializing storage management...');
	
	// Request persistent storage
	const isPersistent = await requestPersistentStorage();
	
	// Log storage info
	const storageInfo = await getStorageInfo();
	console.log('📊 Storage Info:', {
		used: `${storageInfo.usageInMB} MB`,
		quota: `${storageInfo.quotaInMB} MB`,
		percentage: `${storageInfo.percentage}%`,
		persistent: storageInfo.isPersistent
	});

	// Check service worker status
	const swStatus = await getServiceWorkerStatus();
	console.log('⚙️ Service Worker:', swStatus.active ? '✓ Active' : '✗ Inactive');

	// Warn if storage is low
	if (storageInfo.percentage > 80) {
		console.warn('⚠️ Storage usage is high:', storageInfo.percentage + '%');
	}
}

/**
 * Export all storage utilities
 */
export const storageManager = {
	requestPersistentStorage,
	isStoragePersistent,
	getStorageInfo,
	clearAllCaches,
	clearCache,
	getCacheNames,
	estimateCacheSize,
	isServiceWorkerSupported,
	getServiceWorkerStatus,
	sendMessageToServiceWorker,
	clearCacheViaServiceWorker,
	initializeStorageManagement
};

export default storageManager;
