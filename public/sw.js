const CACHE = 'pemdiary-v1'

self.addEventListener('install', e => {
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return
  const url = new URL(e.request.url)
  // Skip external requests (OneSignal CDN, Anthropic API)
  if (url.origin !== self.location.origin) return

  e.respondWith(
    caches.open(CACHE).then(cache =>
      cache.match(e.request).then(cached => {
        const fetched = fetch(e.request).then(resp => {
          if (resp.ok) cache.put(e.request, resp.clone())
          return resp
        }).catch(() => cached)
        return cached || fetched
      })
    )
  )
})

// Show local push notification (called from app when SW is active)
self.addEventListener('message', e => {
  if (e.data?.type === 'SHOW_NOTIFICATION') {
    self.registration.showNotification(e.data.title, {
      body: e.data.body,
      icon: '/PEMdiary/icon.svg',
      badge: '/PEMdiary/icon.svg',
      tag: 'pemdiary-daily',
    })
  }
})

self.addEventListener('notificationclick', e => {
  e.notification.close()
  e.waitUntil(clients.openWindow('/PEMdiary/'))
})
