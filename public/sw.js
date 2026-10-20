// Ăn Gì Mom - Service Worker (PWA Offline Support)
const CACHE_NAME = 'angimom-v1';
const OFFLINE_URLS = [
  '/',
  '/shopping',
  '/da-luu',
  '/manifest.json',
  '/favicon.ico',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(OFFLINE_URLS).catch((err) => {
        console.warn('Pre-cache error (ignored in dev):', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Chỉ cache các request GET
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Bỏ qua các API route và dev socket
  if (url.pathname.startsWith('/api/') || url.pathname.includes('/_next/webpack-hmr')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Lưu bản sao vào cache nếu response hợp lệ
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(async () => {
        // Khi mất mạng, fallback về cache
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        // Fallback về trang chủ hoặc shopping nếu có
        if (event.request.mode === 'navigate') {
          return caches.match('/shopping') || caches.match('/');
        }
      })
  );
});
