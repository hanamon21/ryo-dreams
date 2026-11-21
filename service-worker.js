/* RYO'S VISION: オフラインでも20の夢を見られるようにする軽量キャッシュ */
const CACHE = 'ryo-vision-20261121-v1';
const SHELL = [
  './', './index.html', './styles.css', './app.js',
  './manifest.json', './icon-180.png', './icon-192.png', './icon-512.png'
];
const IMAGES = [
  './images/vision-board.jpg',
  ...Array.from({ length: 20 }, (_, i) => './images/dream-' + String(i + 1).padStart(2, '0') + '.jpg')
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then(async (cache) => {
        await cache.addAll(SHELL);
        // 画像は個別に保存。一枚失敗してもアプリ全体の導入は止めない。
        await Promise.allSettled(IMAGES.map((url) => cache.add(url)));
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith('ryo-vision-') && key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.pathname.includes('/ryo-dreams/')) return;

  // 画面本体・スクリプトは更新を優先。通信できなければ保存版を使う。
  const refreshFirst = request.mode === 'navigate' || /\.(?:js|css|json)$/.test(url.pathname);
  if (refreshFirst) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            event.waitUntil(caches.open(CACHE).then((cache) => cache.put(request, copy)));
          }
          return response;
        })
        .catch(async () => (await caches.match(request)) || (await caches.match('./index.html')) || Response.error())
    );
    return;
  }

  // 画像とアイコンはキャッシュを優先。
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      if (response.ok) {
        const copy = response.clone();
        event.waitUntil(caches.open(CACHE).then((cache) => cache.put(request, copy)));
      }
      return response;
    }))
  );
});
