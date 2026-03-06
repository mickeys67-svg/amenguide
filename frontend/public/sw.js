/* Service Worker for Catholica Push Notifications */

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
      // 이미 열린 탭이 있으면 포커스
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      // 없으면 새 탭
      return clients.openWindow(url);
    }),
  );
});
