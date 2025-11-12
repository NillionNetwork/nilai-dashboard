// Empty service worker to prevent 404 errors
// Privy SDK may attempt to register this file

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', () => {
  self.clients.claim()
})

