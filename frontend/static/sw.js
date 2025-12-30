// Service Worker for Lokkatha AI
// Provides offline support and asset caching

const CACHE_NAME = 'lokkatha-v1.0.0';
const STATIC_CACHE = 'lokkatha-static-v1';
const DYNAMIC_CACHE = 'lokkatha-dynamic-v1';

// Files to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/create',
  '/lessons',
  '/settings',
  '/manifest.json',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(async (cache) => {
        console.log('[SW] Caching static assets');
        
        // Cache each asset individually to avoid failures
        const cachePromises = STATIC_ASSETS.map(async (url) => {
          try {
            const request = new Request(url, { cache: 'reload' });
            const response = await fetch(request);
            
            if (response.ok) {
              await cache.put(request, response);
              console.log('[SW] Cached:', url);
            } else {
              console.warn('[SW] Failed to cache (not ok):', url, response.status);
            }
          } catch (error) {
            console.warn('[SW] Failed to cache:', url, error);
          }
        });
        
        await Promise.allSettled(cachePromises);
        console.log('[SW] Static asset caching complete');
      })
      .catch((error) => {
        console.error('[SW] Failed to open cache:', error);
      })
  );
  
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Take control of all pages immediately
  return self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Don't intercept these requests - let them go directly to network
  try {
    const url = new URL(request.url);
    
    // Skip cross-origin requests
    if (url.origin !== self.location.origin) {
      return;
    }
    
    // Skip API requests (they need fresh data)
    if (url.pathname.startsWith('/api/')) {
      return;
    }
    
    // Skip non-GET requests (POST, PUT, DELETE, etc.)
    if (request.method !== 'GET') {
      return;
    }
    
    // Skip WebSocket and EventSource requests
    if (request.headers.get('upgrade') === 'websocket' || 
        request.destination === 'eventsource') {
      return;
    }
  } catch (error) {
    // If URL parsing fails, skip caching
    console.warn('[SW] Error parsing request URL:', error);
    return;
  }
  
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Serve from cache
          return cachedResponse;
        }
        
        // Not in cache - fetch from network
        return fetch(request)
          .then((networkResponse) => {
            // Only cache successful responses
            if (networkResponse && networkResponse.status === 200 && 
                networkResponse.type === 'basic') {
              const responseClone = networkResponse.clone();
              
              caches.open(DYNAMIC_CACHE)
                .then((cache) => {
                  cache.put(request, responseClone);
                })
                .catch((err) => {
                  console.warn('[SW] Failed to cache response:', err);
                });
            }
            
            return networkResponse;
          })
          .catch((error) => {
            console.warn('[SW] Network fetch failed, serving offline fallback:', error.message);
            
            // Return offline page for navigation requests
            if (request.mode === 'navigate') {
              return caches.match('/').then((response) => {
                return response || new Response('Offline - Please check your connection', {
                  status: 503,
                  statusText: 'Service Unavailable',
                  headers: new Headers({
                    'Content-Type': 'text/html',
                  }),
                });
              });
            }
            
            // For other requests, try to serve from cache or return error
            return caches.match(request).then((cachedResponse) => {
              return cachedResponse || new Response('Offline', {
                status: 503,
                statusText: 'Service Unavailable',
                headers: new Headers({
                  'Content-Type': 'text/plain',
                }),
              });
            });
          });
      })
      .catch((error) => {
        // Cache matching failed
        console.error('[SW] Cache match error:', error);
        return fetch(request).catch(() => {
          return new Response('Service Worker Error', {
            status: 503,
            statusText: 'Service Unavailable',
          });
        });
      })
  );
});

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-video-jobs') {
    event.waitUntil(
      // Retry failed video creation requests
      syncVideoJobs()
    );
  }
});

async function syncVideoJobs() {
  try {
    // Get pending jobs from IndexedDB (if any)
    // This would need to be implemented with your actual sync logic
    console.log('[SW] Syncing video jobs...');
    
    // For now, just log - implement actual sync logic as needed
    return Promise.resolve();
  } catch (error) {
    console.error('[SW] Sync failed:', error);
    throw error;
  }
}

// Message handler for cache updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            return caches.delete(cacheName);
          })
        );
      })
    );
  }
});

console.log('[SW] Service worker loaded');
