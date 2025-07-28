/**
 * Service Worker para JournalScope
 * Permite funcionalidade offline e cache inteligente
 */

const CACHE_NAME = 'journalscope-v1.0.0';
const CACHE_VERSION = '1.0.0';

// Arquivos para cache (core da aplicação)
const CORE_CACHE_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/favicon.svg'
];

// Arquivos de dados (cache opcional) - removidos pois não existem
const DATA_CACHE = 'journalscope-data-v1';
const DATA_FILES = [
  // Arquivos de dados serão adicionados dinamicamente quando disponíveis
];

// URLs que sempre devem buscar da rede primeiro
const NETWORK_FIRST_URLS = [
  '/api/',
  '/export/',
  '/share/'
];

// URLs que podem ser servidas do cache primeiro
const CACHE_FIRST_URLS = [
  '/static/',
  '/icons/',
  '/images/',
  '.png',
  '.jpg',
  '.jpeg',
  '.svg',
  '.ico',
  '.css',
  '.js'
];

/**
 * Evento de instalação do Service Worker
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker v' + CACHE_VERSION);
  
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('[SW] Caching core files individually');
      
      // Cache arquivos individualmente para evitar falha total
      const cachePromises = CORE_CACHE_FILES.map(async (file) => {
        try {
          const response = await fetch(file);
          if (response.ok) {
            await cache.put(file, response);
            console.log(`[SW] Cached: ${file}`);
          } else {
            console.warn(`[SW] Failed to fetch ${file}: ${response.status}`);
          }
        } catch (error) {
          console.warn(`[SW] Error caching ${file}:`, error.message);
        }
      });
      
      // Aguardar todas as tentativas de cache (sem falhar se alguma der erro)
      await Promise.allSettled(cachePromises);
      
      console.log('[SW] Installation complete');
      return self.skipWaiting();
    }).catch((error) => {
      console.error('[SW] Cache opening failed:', error);
      // Continuar mesmo com erro de cache
      return self.skipWaiting();
    })
  );
});

/**
 * Evento de ativação do Service Worker
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker v' + CACHE_VERSION);
  
  event.waitUntil(
    Promise.all([
      // Limpar caches antigos
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Assumir controle de todas as abas
      self.clients.claim()
    ]).then(() => {
      console.log('[SW] Activation complete');
    })
  );
});

/**
 * Estratégia de cache para diferentes tipos de requisição
 */
function getCacheStrategy(url) {
  // Network First para URLs específicas
  if (NETWORK_FIRST_URLS.some(pattern => url.includes(pattern))) {
    return 'networkFirst';
  }
  
  // Cache First para recursos estáticos
  if (CACHE_FIRST_URLS.some(pattern => url.includes(pattern))) {
    return 'cacheFirst';
  }
  
  // Stale While Revalidate para HTML
  if (url.endsWith('.html') || url === '/') {
    return 'staleWhileRevalidate';
  }
  
  // Network Only para outros casos
  return 'networkOnly';
}

/**
 * Cache First Strategy
 */
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      try {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, networkResponse.clone());
      } catch (cacheError) {
        console.warn('[SW] Failed to cache response:', cacheError.message);
        // Continue sem falhar
      }
    }
    return networkResponse;
  } catch (error) {
    console.warn('[SW] Cache First failed:', error.message);
    // Retornar uma resposta de erro em vez de throw
    return new Response('Network error', { 
      status: 408, 
      statusText: 'Request Timeout' 
    });
  }
}

/**
 * Network First Strategy
 */
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      try {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, networkResponse.clone());
      } catch (cacheError) {
        console.warn('[SW] Failed to cache response:', cacheError.message);
        // Continue sem falhar
      }
    }
    return networkResponse;
  } catch (error) {
    console.warn('[SW] Network failed, trying cache:', error.message);
    try {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
    } catch (cacheError) {
      console.warn('[SW] Cache lookup failed:', cacheError.message);
    }
    
    // Retornar uma resposta de erro em vez de throw
    return new Response('Network and cache failed', { 
      status: 503, 
      statusText: 'Service Unavailable' 
    });
  }
}

/**
 * Stale While Revalidate Strategy
 */
async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);
  
  const networkResponsePromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      const cache = caches.open(CACHE_NAME);
      cache.then(c => c.put(request, networkResponse.clone()));
    }
    return networkResponse;
  }).catch(() => {
    // Falha na rede é silenciosa nesta estratégia
  });
  
  return cachedResponse || networkResponsePromise;
}

/**
 * Evento de fetch (intercepta requisições)
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = request.url;
  
  // Ignorar requisições que não são HTTP/HTTPS
  if (!request.url.startsWith('http')) {
    return;
  }
  
  // Ignorar requisições POST/PUT/DELETE (apenas GET)
  if (request.method !== 'GET') {
    return;
  }
  
  const strategy = getCacheStrategy(url);
  
  switch (strategy) {
    case 'cacheFirst':
      event.respondWith(cacheFirst(request));
      break;
      
    case 'networkFirst':
      event.respondWith(networkFirst(request));
      break;
      
    case 'staleWhileRevalidate':
      event.respondWith(staleWhileRevalidate(request));
      break;
      
    case 'networkOnly':
    default:
      // Deixa o navegador lidar normalmente
      break;
  }
});

/**
 * Evento de sincronização em background
 */
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'journal-data-sync') {
    event.waitUntil(syncJournalData());
  }
});

/**
 * Sincronização de dados de journals
 */
async function syncJournalData() {
  try {
    console.log('[SW] Syncing journal data...');
    
    // Aqui você pode implementar lógica para:
    // - Verificar se há novos dados disponíveis
    // - Baixar atualizações dos arquivos Excel
    // - Notificar o usuário sobre atualizações
    
    const cache = await caches.open(DATA_CACHE);
    
    // Exemplo: tentar atualizar arquivos de dados
    for (const dataFile of DATA_FILES) {
      try {
        const response = await fetch(dataFile);
        if (response.ok) {
          await cache.put(dataFile, response);
          console.log('[SW] Updated data file:', dataFile);
        }
      } catch (error) {
        console.warn('[SW] Failed to update data file:', dataFile, error);
      }
    }
    
    return Promise.resolve();
  } catch (error) {
    console.error('[SW] Sync failed:', error);
    return Promise.reject(error);
  }
}

/**
 * Evento de push notification (para futuro uso)
 */
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);
  
  const options = {
    body: event.data ? event.data.text() : 'Nova atualização disponível!',
    icon: '/favicon-192x192.png',
    badge: '/favicon-96x96.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Abrir JournalScope',
        icon: '/favicon-96x96.png'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/favicon-96x96.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('JournalScope', options)
  );
});

/**
 * Evento de clique em notificação
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click received:', event);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

/**
 * Evento de mensagem (comunicação com a aplicação)
 */
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({
      version: CACHE_VERSION,
      caches: [CACHE_NAME, DATA_CACHE]
    });
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            return caches.delete(cacheName);
          })
        );
      })
    );
  }
});

/**
 * Tratamento de erros
 */
self.addEventListener('error', (event) => {
  console.error('[SW] Error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('[SW] Unhandled promise rejection:', event.reason);
});

/**
 * Log de informações do Service Worker
 */
console.log('[SW] JournalScope Service Worker v' + CACHE_VERSION + ' loaded');
console.log('[SW] Cache strategy configured');
console.log('[SW] Core files:', CORE_CACHE_FILES.length);
console.log('[SW] Data files:', DATA_FILES.length);
