const CACHE_NAME = 'frontline-v1';
const APP_SHELL = [
  '/',
  '/index.html',
  '/src/main.tsx',
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
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Skip non-GET requests (mutations should go to network/queue)
  if (request.method !== 'GET') {
    return;
  }

  // Skip canister API calls - let them use existing offline queue
  if (request.url.includes('/api/') || request.url.includes('ic0.app') || request.url.includes('icp0.io')) {
    return;
  }

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
          request.url.endsWith('.woff2')
        )) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }

        return response;
      }).catch(() => {
        // Return cached response if network fails
        return caches.match('/index.html');
      });
    })
  );
});
