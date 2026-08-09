/**
 * Service worker — offline support for the Menstrual Health Awareness Game.
 * Precaches the app shell + question bank, and serves cached assets when offline.
 * Bump CACHE_VERSION whenever the precached shell changes.
 */
const CACHE_VERSION = 'mhg-v2';

/* App shell + content to precache. Paths are relative to the SW scope (root). */
const PRECACHE_URLS = [
  './',
  'index.html',
  'css/styles.css',
  'js/game.js',
  'manifest.webmanifest',
  'assets/vendor/three.min.js',
  'Menstrual_Health%20questions.md',
  // Board images (responsive: 600w/1200w x WebP + PNG)
  'assets/images/menstrual-maze-board-600.webp',
  'assets/images/menstrual-maze-board-1200.webp',
  'assets/images/menstrual-maze-board-600.png',
  'assets/images/menstrual-maze-board-1200.png',
  // Avatars / tokens
  'assets/images/player11.png',
  'assets/images/player22.png',
  'assets/images/avatar-male-1.svg',
  'assets/images/avatar-male-2.svg',
  'assets/images/avatar-female-1.svg',
  'assets/images/avatar-female-2.svg',
  // Audio
  'assets/audio/background-music.mp3',
  'assets/audio/dice.mp3',
  'assets/audio/ladder.mp3',
  'assets/audio/question.mp3',
  'assets/audio/spill.mp3',
  'assets/audio/win.mp3',
  // Icons
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache =>
      // Cache each URL independently so one 404 can't fail the whole install.
      Promise.allSettled(PRECACHE_URLS.map(url => cache.add(url)))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  // Navigation requests: network-first, fall back to the cached shell offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('index.html').then(res => res || caches.match('./')))
    );
    return;
  }

  // Everything else: cache-first, then network (and cache the response).
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (response && response.ok && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(request, copy));
        }
        return response;
      }).catch(() => cached);
    })
  );
});
