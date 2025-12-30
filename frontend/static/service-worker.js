// Enhanced service worker for PWA functionality with cache management
const CACHE_NAME = 'lokkatha-v1.1';
const CACHE_VERSION = '1.1';
const MAX_CACHE_SIZE = 100; // Maximum number of cached items
const MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

const urlsToCache = [
	'/',
	'/create',
	'/lessons',
	'/settings',
	'/manifest.json'
];

// Install event - cache essential resources
self.addEventListener('install', (event) => {
	console.log('[ServiceWorker] Installing...');
	event.waitUntil(
		caches.open(CACHE_NAME)
			.then((cache) => {
				console.log('[ServiceWorker] Caching app shell');
				return cache.addAll(urlsToCache);
			})
			.then(() => {
				console.log('[ServiceWorker] Installed successfully');
				return self.skipWaiting();
			})
			.catch((error) => {
				console.error('[ServiceWorker] Installation failed:', error);
			})
	);
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
	console.log('[ServiceWorker] Activating...');
	event.waitUntil(
		caches.keys().then((cacheNames) => {
			return Promise.all(
				cacheNames.map((cacheName) => {
					if (cacheName !== CACHE_NAME) {
						console.log('[ServiceWorker] Removing old cache:', cacheName);
						return caches.delete(cacheName);
					}
				})
			);
		})
		.then(() => {
			console.log('[ServiceWorker] Activated successfully');
			return self.clients.claim();
		})
		.then(() => {
			// Clean up old cached items
			return cleanupCache();
		})
	);
});

// Fetch event - smart caching strategy
self.addEventListener('fetch', (event) => {
	const { request } = event;
	const url = new URL(request.url);

	// Skip cross-origin requests
	if (url.origin !== location.origin) {
		return;
	}

	// Different strategies for different resource types
	if (request.url.includes('/api/')) {
		// Network first for API calls
		event.respondWith(networkFirst(request));
	} else if (request.url.match(/\.(js|css|png|jpg|jpeg|svg|woff2?)$/)) {
		// Cache first for static assets
		event.respondWith(cacheFirst(request));
	} else {
		// Stale-while-revalidate for HTML pages
		event.respondWith(staleWhileRevalidate(request));
	}
});

// Network first strategy - for dynamic content
async function networkFirst(request) {
	try {
		const response = await fetch(request);
		if (response.status === 200) {
			const cache = await caches.open(CACHE_NAME);
			cache.put(request, response.clone());
		}
		return response;
	} catch (error) {
		const cachedResponse = await caches.match(request);
		return cachedResponse || new Response('Offline - No cached data available', {
			status: 503,
			statusText: 'Service Unavailable'
		});
	}
}

// Cache first strategy - for static assets
async function cacheFirst(request) {
	const cachedResponse = await caches.match(request);
	if (cachedResponse) {
		return cachedResponse;
	}

	try {
		const response = await fetch(request);
		if (response.status === 200) {
			const cache = await caches.open(CACHE_NAME);
			cache.put(request, response.clone());
		}
		return response;
	} catch (error) {
		return new Response('Resource not available offline', {
			status: 404,
			statusText: 'Not Found'
		});
	}
}

// Stale-while-revalidate strategy - for HTML pages
async function staleWhileRevalidate(request) {
	const cachedResponse = await caches.match(request);
	
	const fetchPromise = fetch(request).then((response) => {
		if (response.status === 200) {
			const cache = caches.open(CACHE_NAME);
			cache.then((c) => c.put(request, response.clone()));
		}
		return response;
	}).catch(() => cachedResponse);

	return cachedResponse || fetchPromise;
}

// Clean up old cached items to prevent storage overflow
async function cleanupCache() {
	const cache = await caches.open(CACHE_NAME);
	const requests = await cache.keys();
	
	// Remove items beyond MAX_CACHE_SIZE
	if (requests.length > MAX_CACHE_SIZE) {
		console.log(`[ServiceWorker] Cache cleanup: ${requests.length} items`);
		const itemsToDelete = requests.slice(0, requests.length - MAX_CACHE_SIZE);
		await Promise.all(itemsToDelete.map((request) => cache.delete(request)));
	}

	// Remove old items based on age (would need timestamp metadata)
	// This is a simplified version - production would use Cache API metadata
	return Promise.resolve();
}

// Message handler for cache management from main thread
self.addEventListener('message', (event) => {
	if (event.data && event.data.type === 'CLEAR_CACHE') {
		event.waitUntil(
			caches.keys().then((cacheNames) => {
				return Promise.all(
					cacheNames.map((cacheName) => {
						return caches.delete(cacheName);
					})
				);
			}).then(() => {
				console.log('[ServiceWorker] All caches cleared');
				return self.clients.matchAll();
			}).then((clients) => {
				clients.forEach((client) => {
					client.postMessage({
						type: 'CACHE_CLEARED',
						success: true
					});
				});
			})
		);
	}

	if (event.data && event.data.type === 'SKIP_WAITING') {
		self.skipWaiting();
	}
});

// Request persistent storage permission
self.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			if (navigator.storage && navigator.storage.persist) {
				const isPersisted = await navigator.storage.persist();
				console.log(`[ServiceWorker] Persistent storage: ${isPersisted}`);
			}
		})()
	);
});

console.log('[ServiceWorker] Service Worker loaded - Version:', CACHE_VERSION);
