const version = 'modeler-x-v1.1.0::';

const CACHES = {
  static: version + 'static',
  dynamic: version + 'dynamic',
  cad: version + 'cad',
  assets: version + 'assets'
};

// GitHub Pagesの場合、basePathを適用
const BASE_PATH = self.location.pathname.includes('/modeler-x') ? '/modeler-x' : '';

const CAD_RESOURCES = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/manifest.json`,
  `${BASE_PATH}/_next/static/`,
  `${BASE_PATH}/opencascade/opencascade.wasm.js`,
  `${BASE_PATH}/opencascade/opencascade.wasm.wasm`,
  `${BASE_PATH}/monaco-editor-workers/editor.worker.js`,
  `${BASE_PATH}/monaco-editor-workers/ts.worker.js`,
  `${BASE_PATH}/workers/cadWorker.js`,
  `${BASE_PATH}/textures/`,
  `${BASE_PATH}/fonts/`
];

const STATIC_ASSETS = [
  `${BASE_PATH}/icon-192x192.png`,
  `${BASE_PATH}/icon-512x512.png`,
  `${BASE_PATH}/badge-72x72.png`,
  `${BASE_PATH}/favicon.ico`
];

function useNetworkFirst(request) {
  return fetch(request)
    .then(response => {
      const cacheCopy = response.clone();
      caches.open(CACHES.dynamic)
        .then(cache => cache.put(request, cacheCopy));
      return response;
    })
    .catch(() => caches.match(request));
}

function useCacheFirst(request) {
  return caches.match(request)
    .then(cached => cached || fetch(request));
}

function shouldCacheRequest(request) {
  const url = new URL(request.url);
  
  if (url.pathname.includes('/_next/static/')) return true;
  if (url.pathname.includes('/opencascade/')) return true;
  if (url.pathname.includes('/monaco-editor-workers/')) return true;
  if (url.pathname.includes('/workers/')) return true;
  if (url.pathname.includes('/api/')) return false;
  if (url.pathname.includes('/socket.io/')) return false;
  
  return false;
}

self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      caches.open(CACHES.static).then(cache => {
        return cache.addAll(STATIC_ASSETS);
      }),
      caches.open(CACHES.cad).then(cache => {
        return cache.addAll(CAD_RESOURCES.filter(url => !url.endsWith('/')));
      })
    ]).then(() => {
      console.log('Service Worker installed successfully');
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!Object.values(CACHES).includes(cacheName)) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker activated');
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  
  if (request.method !== 'GET') return;
  
  if (url.pathname.includes('/api/')) {
    event.respondWith(useNetworkFirst(request));
    return;
  }
  
  if (shouldCacheRequest(request)) {
    event.respondWith(useCacheFirst(request));
    return;
  }
  
  if (url.pathname === '/' || url.pathname.includes('.html')) {
    event.respondWith(
      useNetworkFirst(request).catch(() => {
        return caches.match('/');
      })
    );
    return;
  }
  
  event.respondWith(
    caches.match(request).then(response => {
      return response || fetch(request).catch(() => {
        if (request.destination === 'document') {
          return caches.match('/');
        }
      });
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version });
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const action = event.action;
  
  if (action === 'close') {
    return;
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes('/') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  
  const options = {
    body: data.body || 'New CAD project update available',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: data.id || 1,
      url: data.url || '/'
    },
    actions: [
      {
        action: 'explore',
        title: 'View Project',
        icon: '/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icon-192x192.png'
      }
    ],
    requireInteraction: true,
    tag: 'cad-update'
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Modeler-X CAD', options)
  );
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'cad-project-sync') {
    event.waitUntil(syncCADProjects());
  }
  
  if (event.tag === 'cache-cleanup') {
    event.waitUntil(cleanupOldCaches());
  }
});

async function syncCADProjects() {
  try {
    const cache = await caches.open(CACHES.dynamic);
    const response = await fetch('/api/projects');
    
    if (response.ok) {
      await cache.put('/api/projects', response.clone());
      console.log('CAD projects synced successfully');
    }
  } catch (error) {
    console.error('Failed to sync CAD projects:', error);
  }
}

async function cleanupOldCaches() {
  try {
    const cacheNames = await caches.keys();
    const oldCaches = cacheNames.filter(name => !Object.values(CACHES).includes(name));
    
    await Promise.all(oldCaches.map(name => caches.delete(name)));
    console.log('Old caches cleaned up:', oldCaches);
  } catch (error) {
    console.error('Failed to cleanup old caches:', error);
  }
}
