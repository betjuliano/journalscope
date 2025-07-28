/**
 * Service Worker DESABILITADO para JournalScope
 * Versão que não faz cache para evitar problemas
 */

const CACHE_NAME = 'journalscope-disabled';
const CACHE_VERSION = 'disabled';

console.log('[SW] Service Worker DISABLED - No caching will be performed');

// Service Worker desabilitado - sem configurações de cache

/**
 * Evento de instalação do Service Worker - DESABILITADO
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing DISABLED Service Worker - No caching');
  
  event.waitUntil(
    Promise.resolve().then(() => {
      console.log('[SW] Installation complete - No cache operations performed');
      return self.skipWaiting();
    })
  );
});

/**
 * Evento de ativação do Service Worker - LIMPA TODOS OS CACHES
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating DISABLED Service Worker - Clearing all caches');
  
  event.waitUntil(
    Promise.all([
      // Limpar TODOS os caches
      caches.keys().then((cacheNames) => {
        console.log('[SW] Found caches:', cacheNames);
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log('[SW] Deleting cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      }),
      
      // Assumir controle de todas as abas
      self.clients.claim()
    ]).then(() => {
      console.log('[SW] Activation complete - All caches cleared');
    })
  );
});

// Todas as estratégias de cache foram removidas - Service Worker desabilitado

/**
 * Evento de fetch - DESABILITADO (não intercepta requisições)
 */
self.addEventListener('fetch', (event) => {
  // Service Worker desabilitado - não intercepta nenhuma requisição
  // Deixa o navegador lidar com tudo normalmente
  console.log('[SW] Fetch event ignored - Service Worker disabled');
});

/**
 * Evento de sincronização em background - DESABILITADO
 */
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync disabled');
});

/**
 * Eventos de push notification - DESABILITADOS
 */
self.addEventListener('push', (event) => {
  console.log('[SW] Push notifications disabled');
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicks disabled');
});

/**
 * Evento de mensagem - SIMPLIFICADO
 */
self.addEventListener('message', (event) => {
  console.log('[SW] Message received (disabled mode):', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log('[SW] Clearing cache:', cacheName);
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
console.log('[SW] JournalScope Service Worker DISABLED v' + CACHE_VERSION + ' loaded');
console.log('[SW] No caching will be performed');
console.log('[SW] All requests will go directly to network');
