// ===== Service Worker for Deutsch Lernapp =====
const CACHE_NAME = 'deutsch-lernapp-v1';

// キャッシュするファイル一覧
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

// インストール時：全ファイルをキャッシュ
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// アクティベート時：古いキャッシュを削除
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// フェッチ時：キャッシュ優先（オフラインでも動く）
self.addEventListener('fetch', event => {
  // chrome-extension など関係ないリクエストは無視
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      // キャッシュになければネットから取得してキャッシュに追加
      return fetch(event.request).then(response => {
        // 正常なレスポンスだけキャッシュ
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // オフラインでキャッシュもなければindex.htmlを返す
        return caches.match('./index.html');
      });
    })
  );
});
