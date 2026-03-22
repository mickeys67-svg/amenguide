/* Service Worker for Catholica — Push + Offline Cache */

const CACHE_NAME = 'catholica-v1';
const OFFLINE_ASSETS = ['/', '/favicon.ico', '/logo.png'];

// 설치 시 핵심 자원 캐시
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_ASSETS)),
  );
  self.skipWaiting();
});

// 이전 캐시 정리
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

// 네트워크 우선, 실패 시 캐시 fallback
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  // API 호출은 캐시하지 않음
  if (event.request.url.includes('/api/') || event.request.url.includes('amenguide-backend')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 성공한 응답을 캐시에 저장
        if (response.ok && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request)),
  );
});

// Push 알림
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      body: data.body || '',
      icon: data.icon || '/logo.png',
      badge: '/logo.png',
      data: { url: data.url || '/' },
      vibrate: [200, 100, 200],
      tag: data.url || 'catholica-notification',
      renotify: true,
    };
    event.waitUntil(
      self.registration.showNotification(data.title || 'Catholica', options),
    );
  } catch (err) {
    console.error('Push event error:', err);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    }),
  );
});
