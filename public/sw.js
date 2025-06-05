const version = 'modeler-x-v1.1.0::';

// BasePathの取得関数
function getBasePath() {
  // Service Worker内ではlocationを使用
  const pathname = self.location.pathname;
  if (pathname.includes('/modeler-x/')) {
    return '/modeler-x';
  }
  return '';
}

// 公開ファイルパスの取得関数
function getPublicPath(path) {
  const basePath = getBasePath();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${basePath}${normalizedPath}`;
}

const CACHES = {
  static: version + 'static',
  dynamic: version + 'dynamic',
  cad: version + 'cad',
  assets: version + 'assets'
};

const CAD_RESOURCES = [
  getPublicPath('/'),
  getPublicPath('/manifest.webmanifest'),
  getPublicPath('/_next/static/'),
  getPublicPath('/opencascade/opencascade.wasm.js'),
  getPublicPath('/opencascade/opencascade.wasm.wasm'),
  getPublicPath('/monaco-editor-workers/editor.worker.js'),
  getPublicPath('/monaco-editor-workers/ts.worker.js'),
  getPublicPath('/workers/cadWorker.js'),
  getPublicPath('/textures/'),
  getPublicPath('/fonts/')
];

const STATIC_ASSETS = [
  getPublicPath('/icon-192x192.png'),
  getPublicPath('/icon-512x512.png'),
  getPublicPath('/badge-72x72.png'),
  getPublicPath('/favicon.ico')
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
  const basePath = getBasePath();
  
  // basePathを考慮したパス判定
  const normalizedPath = basePath ? url.pathname.replace(basePath, '') : url.pathname;
  
  if (normalizedPath.includes('/_next/static/')) return true;
  if (normalizedPath.includes('/opencascade/')) return true;
  if (normalizedPath.includes('/monaco-editor-workers/')) return true;
  if (normalizedPath.includes('/workers/')) return true;
  if (normalizedPath.includes('/api/')) return false;
  if (normalizedPath.includes('/socket.io/')) return false;
  
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
