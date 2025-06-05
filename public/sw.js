
const VERSION = '1.0.0';
const CACHES = {
  static: `modeler-x-static-v${VERSION}`,
  dynamic: `modeler-x-dynamic-v${VERSION}`,
  cad: `modeler-x-cad-v${VERSION}`,
  assets: `modeler-x-assets-v${VERSION}`
};

const STATIC_RESOURCES = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/_next/static/css/',
  '/_next/static/js/',
  '/_next/static/chunks/',
  '/_next/static/media/'
];

const CAD_RESOURCES = [
  '/opencascade/',
  '/opencascade/opencascade.full.js',
  '/opencascade/opencascade.full.wasm',
  '/workers/',
  '/workers/cadWorker.js',
  '/monaco-editor/',
  '/monaco-editor-workers/',
  '/types/',
  '/types/cad-library.d.ts'
];

const ASSET_RESOURCES = [
  '/textures/',
  '/fonts/',
  '/icons/',
  '/images/',
  '/matcaps/'
];

const NETWORK_FIRST_PATTERNS = [
  /\/api\//,
  /\/auth\//,
  /\/upload\//,
  /\/download\//
];

const CACHE_FIRST_PATTERNS = [
  /\.wasm$/,
  /\.js$/,
  /\.css$/,
  /\.png$/,
  /\.jpg$/,
  /\.svg$/,
  /\.ico$/,
  /\.woff2?$/,
  /\.ttf$/
];

self.addEventListener('install', (event) => {
  console.log('🔧 CascadeStudio Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      caches.open(CACHES.static).then((cache) => {
        console.log('📦 Caching static resources');
        return cache.addAll(STATIC_RESOURCES.filter(url => !url.endsWith('/')));
      }),
      
      caches.open(CACHES.cad).then((cache) => {
        console.log('🔧 Caching CAD resources');
        return Promise.allSettled(
          CAD_RESOURCES.filter(url => !url.endsWith('/')).map(url => 
            cache.add(url).catch(err => console.warn(`Failed to cache ${url}:`, err))
          )
        );
      }),
      
      caches.open(CACHES.assets).then((cache) => {
        console.log('🎨 Caching asset resources');
        return Promise.allSettled(
          ASSET_RESOURCES.filter(url => !url.endsWith('/')).map(url => 
            cache.add(url).catch(err => console.warn(`Failed to cache ${url}:`, err))
          )
        );
      })
    ]).then(() => {
      console.log('✅ CascadeStudio Service Worker installed successfully');
      return self.skipWaiting();
    }).catch(err => {
      console.error('❌ Service Worker installation failed:', err);
    })
  );
});

self.addEventListener('activate', (event) => {
  console.log('🚀 CascadeStudio Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      const validCacheNames = Object.values(CACHES);
      
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!validCacheNames.includes(cacheName)) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ CascadeStudio Service Worker activated');
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  if (request.method !== 'GET') {
    return;
  }
  
  if (!request.url.startsWith('http')) {
    return;
  }
  
  if (url.protocol === 'chrome-extension:') {
    return;
  }
  
  event.respondWith(handleFetch(request));
});

async function handleFetch(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  try {
    if (NETWORK_FIRST_PATTERNS.some(pattern => pattern.test(pathname))) {
      return await networkFirst(request);
    }
    
    if (CACHE_FIRST_PATTERNS.some(pattern => pattern.test(pathname))) {
      return await cacheFirst(request);
    }
    
    if (CAD_RESOURCES.some(resource => pathname.startsWith(resource.replace(/\/$/, '')))) {
      return await cadResourceStrategy(request);
    }
    
    if (request.destination === 'document') {
      return await staleWhileRevalidate(request);
    }
    
    return await networkWithCacheFallback(request);
    
  } catch (error) {
    console.error('Fetch handler error:', error);
    return await offlineFallback(request);
  }
}

async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHES.dynamic);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Network error', { status: 503 });
  }
}

async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHES.assets);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    return new Response('Resource not available', { status: 404 });
  }
}

async function cadResourceStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    fetch(request).then(response => {
      if (response.ok) {
        caches.open(CACHES.cad).then(cache => {
          cache.put(request, response);
        });
      }
    }).catch(() => {
    });
    
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHES.cad);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    return new Response('CAD resource not available', { status: 503 });
  }
}

async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);
  
  const networkResponsePromise = fetch(request).then(response => {
    if (response.ok) {
      caches.open(CACHES.static).then(cache => {
        cache.put(request, response.clone());
      });
    }
    return response;
  }).catch(() => null);
  
  return cachedResponse || await networkResponsePromise || await offlineFallback(request);
}

async function networkWithCacheFallback(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHES.dynamic);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || await offlineFallback(request);
  }
}

async function offlineFallback(request) {
  if (request.destination === 'document') {
    const cachedPage = await caches.match('/');
    return cachedPage || new Response('Offline - CascadeStudio', {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });
  }
  
  return new Response('Offline', { status: 503 });
}

self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag);
  
  if (event.tag === 'project-save') {
    event.waitUntil(syncProjectSave());
  } else if (event.tag === 'cad-export') {
    event.waitUntil(syncCADExport());
  }
});

async function syncProjectSave() {
  try {
    const pendingSaves = JSON.parse(localStorage.getItem('pendingProjectSaves') || '[]');
    
    for (const save of pendingSaves) {
      try {
        await fetch('/api/projects/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(save)
        });
        
        const index = pendingSaves.indexOf(save);
        if (index > -1) {
          pendingSaves.splice(index, 1);
        }
      } catch (error) {
        console.error('Failed to sync project save:', error);
      }
    }
    
    localStorage.setItem('pendingProjectSaves', JSON.stringify(pendingSaves));
    console.log('✅ Project saves synced');
  } catch (error) {
    console.error('❌ Background sync failed:', error);
  }
}

async function syncCADExport() {
  try {
    const pendingExports = JSON.parse(localStorage.getItem('pendingCADExports') || '[]');
    
    for (const exportData of pendingExports) {
      try {
        await fetch('/api/cad/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(exportData)
        });
        
        const index = pendingExports.indexOf(exportData);
        if (index > -1) {
          pendingExports.splice(index, 1);
        }
      } catch (error) {
        console.error('Failed to sync CAD export:', error);
      }
    }
    
    localStorage.setItem('pendingCADExports', JSON.stringify(pendingExports));
    console.log('✅ CAD exports synced');
  } catch (error) {
    console.error('❌ CAD export sync failed:', error);
  }
}

self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    const options = {
      body: data.body || 'CascadeStudio notification',
      icon: data.icon || '/icon-192x192.svg',
      badge: '/icon-192x192.svg',
      tag: data.tag || 'cascadestudio',
      requireInteraction: data.requireInteraction || false,
      actions: data.actions || [],
      data: data.data || {}
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'CascadeStudio', options)
    );
  } catch (error) {
    console.error('Push notification error:', error);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const action = event.action;
  const data = event.notification.data;
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('cascadestudio') || client.url === '/') {
          return client.focus();
        }
      }
      
      return clients.openWindow(data.url || '/');
    })
  );
});

self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_CACHE_STATUS':
      getCacheStatus().then(status => {
        event.ports[0].postMessage({ type: 'CACHE_STATUS', payload: status });
      });
      break;
      
    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0].postMessage({ type: 'CACHE_CLEARED' });
      });
      break;
      
    default:
      console.log('Unknown message type:', type);
  }
});

async function getCacheStatus() {
  const cacheNames = await caches.keys();
  const status = {};
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    status[cacheName] = keys.length;
  }
  
  return status;
}

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
  console.log('🗑️ All caches cleared');
}
