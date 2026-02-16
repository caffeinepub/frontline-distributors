const CACHE_VERSION = 'v6';
const CACHE_NAME = `frontline-${CACHE_VERSION}`;
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/assets/generated/app-icon.dim_192x192.png',
  '/assets/generated/app-icon.dim_512x512.png',
  '/assets/generated/app-icon-maskable.dim_512x512.png'
];

// Install event - cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL).catch((err) => {
        console.error('Cache addAll failed:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network-first for navigation, cache-first for assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests (mutations should go to network/queue)
  if (request.method !== 'GET') {
    return;
  }

  // Skip canister API calls - let them use existing offline queue
  if (url.hostname.includes('ic0.app') || url.hostname.includes('icp0.io') || url.pathname.includes('/api/')) {
    return;
  }

  // Skip source module paths (TypeScript/TSX files should never be cached in production)
  if (url.pathname.startsWith('/src/') || url.pathname.endsWith('.tsx') || url.pathname.endsWith('.ts')) {
    return;
  }

  // Navigation requests: network-first with app-shell fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful navigation responses
          if (response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cached app shell on network failure
          return caches.match('/index.html').then((cachedResponse) => {
            return cachedResponse || new Response('Offline - unable to load app', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({ 'Content-Type': 'text/plain' })
            });
          });
        })
    );
    return;
  }

  // Static assets: cache-first with network fallback
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((response) => {
        // Cache successful responses for static assets
        if (response.status === 200 && (
          request.url.endsWith('.js') ||
          request.url.endsWith('.css') ||
          request.url.endsWith('.png') ||
          request.url.endsWith('.jpg') ||
          request.url.endsWith('.svg') ||
          request.url.endsWith('.woff2') ||
          request.url.endsWith('.woff') ||
          request.url.endsWith('.ttf')
        )) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }

        return response;
      }).catch(() => {
        // Return a fallback for failed asset requests
        return new Response('Asset unavailable offline', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      });
    })
  );
});
