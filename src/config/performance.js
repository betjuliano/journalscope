/**
 * Configurações de performance para otimização de runtime
 */

// Configurações de chunk loading
export const CHUNK_CONFIG = {
  // Tamanho máximo de chunk antes de dividir
  MAX_CHUNK_SIZE: 2000, // 2MB
  
  // Chunks críticos que devem ser carregados primeiro
  CRITICAL_CHUNKS: [
    'react-vendor',
    'translations-pt-critical',
    'translations-en-critical',
    'utils-performance'
  ],
  
  // Chunks que podem ser carregados sob demanda
  LAZY_CHUNKS: [
    'embeddedJournals',
    'utils-heavy',
    'file-utils',
    'translations-pt-noncritical',
    'translations-en-noncritical'
  ]
};

// Configurações de memoização
export const MEMO_CONFIG = {
  // Número máximo de itens no cache de memoização
  MAX_MEMO_CACHE_SIZE: 1000,
  
  // Tempo de vida do cache em ms
  MEMO_TTL: 5 * 60 * 1000, // 5 minutos
  
  // Componentes que devem usar memoização pesada
  HEAVY_MEMO_COMPONENTS: [
    'OptimizedResultsTable',
    'JournalCellWithExpansion',
    'ClassificationBadge'
  ]
};

// Configurações de virtualização
export const VIRTUALIZATION_CONFIG = {
  // Número de itens a renderizar por vez
  ITEMS_PER_BATCH: 100,
  
  // Buffer de itens fora da viewport
  OVERSCAN: 10,
  
  // Altura estimada de cada item
  ESTIMATED_ITEM_HEIGHT: 60,
  
  // Ativar virtualização quando há mais de X itens
  VIRTUALIZATION_THRESHOLD: 500
};

// Configurações de preload
export const PRELOAD_CONFIG = {
  // Delay antes de iniciar preload (ms)
  PRELOAD_DELAY: 1000,
  
  // Preload apenas em conexões rápidas
  FAST_CONNECTION_ONLY: true,
  
  // Respeitar data saver
  RESPECT_DATA_SAVER: true,
  
  // Chunks para preload
  PRELOAD_CHUNKS: [
    'components-main',
    'utils',
    'contexts'
  ]
};

// Configurações de debounce
export const DEBOUNCE_CONFIG = {
  // Debounce para busca
  SEARCH_DEBOUNCE: 300,
  
  // Debounce para filtros
  FILTER_DEBOUNCE: 150,
  
  // Debounce para resize
  RESIZE_DEBOUNCE: 100,
  
  // Debounce para scroll
  SCROLL_DEBOUNCE: 16 // ~60fps
};

// Configurações de cache
export const CACHE_CONFIG = {
  // Tamanho máximo do cache de dados
  MAX_DATA_CACHE_SIZE: 50 * 1024 * 1024, // 50MB
  
  // TTL do cache de dados
  DATA_CACHE_TTL: 30 * 60 * 1000, // 30 minutos
  
  // Cache de resultados de filtro
  FILTER_CACHE_SIZE: 100,
  
  // Cache de resultados de busca
  SEARCH_CACHE_SIZE: 50
};

// Função para detectar capacidades do dispositivo
export const getDeviceCapabilities = () => {
  const capabilities = {
    memory: navigator.deviceMemory || 4, // GB
    cores: navigator.hardwareConcurrency || 4,
    connection: navigator.connection?.effectiveType || '4g',
    saveData: navigator.connection?.saveData || false
  };

  // Classificar dispositivo
  if (capabilities.memory >= 8 && capabilities.cores >= 8) {
    capabilities.tier = 'high';
  } else if (capabilities.memory >= 4 && capabilities.cores >= 4) {
    capabilities.tier = 'medium';
  } else {
    capabilities.tier = 'low';
  }

  return capabilities;
};

// Configurações adaptativas baseadas no dispositivo
export const getAdaptiveConfig = () => {
  const device = getDeviceCapabilities();
  
  const configs = {
    high: {
      batchSize: 200,
      cacheSize: 2000,
      preloadEnabled: true,
      virtualizationThreshold: 1000
    },
    medium: {
      batchSize: 100,
      cacheSize: 1000,
      preloadEnabled: true,
      virtualizationThreshold: 500
    },
    low: {
      batchSize: 50,
      cacheSize: 500,
      preloadEnabled: false,
      virtualizationThreshold: 200
    }
  };

  return configs[device.tier] || configs.medium;
};