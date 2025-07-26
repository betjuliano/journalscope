/**
 * Lazy Translation Loading Utility
 * Implements code splitting, preloading, and progressive loading for translations
 */

// Translation cache with metadata
const translationCache = new Map();
const preloadCache = new Map();
const criticalKeysCache = new Map();

// Performance metrics
const loadingMetrics = {
  totalLoads: 0,
  cacheHits: 0,
  preloadHits: 0,
  averageLoadTime: 0,
  totalLoadTime: 0
};

// Critical translation keys that should be preloaded
const CRITICAL_TRANSLATION_KEYS = [
  'hero.title',
  'hero.subtitle',
  'loading.title',
  'loading.processingData',
  'error.title',
  'error.retry',
  'table.actions',
  'table.columns.journal',
  'filters.search.placeholder',
  'stats.totalJournals'
];

// Non-critical keys that can be loaded progressively
const NON_CRITICAL_KEYS = [
  'footer',
  'export',
  'accessibility',
  'dataSources',
  'statsPanel.distributions',
  'table.journalCell',
  'statsPanel.quality'
];

/**
 * Extract critical translations from full translation object
 * @param {Object} translations - Full translation object
 * @returns {Object} Critical translations only
 */
function extractCriticalTranslations(translations) {
  const critical = {};
  
  CRITICAL_TRANSLATION_KEYS.forEach(key => {
    const keys = key.split('.');
    let source = translations;
    let target = critical;
    
    // Navigate to the parent object
    for (let i = 0; i < keys.length - 1; i++) {
      const currentKey = keys[i];
      if (!source[currentKey]) return; // Skip if path doesn't exist
      
      if (!target[currentKey]) {
        target[currentKey] = {};
      }
      
      source = source[currentKey];
      target = target[currentKey];
    }
    
    // Set the final value
    const finalKey = keys[keys.length - 1];
    if (source[finalKey] !== undefined) {
      target[finalKey] = source[finalKey];
    }
  });
  
  return critical;
}

/**
 * Extract non-critical translations from full translation object
 * @param {Object} translations - Full translation object
 * @returns {Object} Non-critical translations only
 */
function extractNonCriticalTranslations(translations) {
  const nonCritical = {};
  
  NON_CRITICAL_KEYS.forEach(key => {
    const keys = key.split('.');
    let source = translations;
    
    // Navigate to the target object
    for (let i = 0; i < keys.length - 1; i++) {
      const currentKey = keys[i];
      if (!source[currentKey]) return; // Skip if path doesn't exist
      source = source[currentKey];
    }
    
    // Copy the entire section
    const finalKey = keys[keys.length - 1];
    if (source[finalKey] !== undefined) {
      if (!nonCritical[keys[0]]) {
        nonCritical[keys[0]] = {};
      }
      
      if (keys.length === 1) {
        nonCritical[finalKey] = source[finalKey];
      } else {
        // Handle nested structure
        let target = nonCritical;
        for (let i = 0; i < keys.length - 1; i++) {
          const currentKey = keys[i];
          if (!target[currentKey]) {
            target[currentKey] = {};
          }
          target = target[currentKey];
        }
        target[finalKey] = source[finalKey];
      }
    }
  });
  
  return nonCritical;
}

/**
 * Load translation file with retry logic and timeout
 * @param {string} language - Language code (pt, en)
 * @param {Object} options - Loading options
 * @returns {Promise<Object>} Translation object
 */
async function loadTranslationFile(language, options = {}) {
  const {
    timeout = 5000,
    retries = 2,
    useCache = true
  } = options;
  
  const startTime = performance.now();
  
  // Check cache first
  if (useCache && translationCache.has(language)) {
    loadingMetrics.cacheHits++;
    const cached = translationCache.get(language);
    
    if (import.meta.env.DEV) {
      console.log(`📦 Translation cache hit for ${language}`);
    }
    
    return cached.data;
  }
  
  let lastError;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Translation loading timeout for ${language}`)), timeout);
      });
      
      // Load translation with dynamic import
      const loadPromise = import(/* @vite-ignore */ `../translations/${language}.js`);
      
      // Race between load and timeout
      const module = await Promise.race([loadPromise, timeoutPromise]);
      const translations = module.default;
      
      if (!translations || typeof translations !== 'object') {
        throw new Error(`Invalid translation structure for ${language}`);
      }
      
      // Cache the result
      if (useCache) {
        translationCache.set(language, {
          data: translations,
          loadedAt: Date.now(),
          loadTime: performance.now() - startTime
        });
      }
      
      // Update metrics
      const loadTime = performance.now() - startTime;
      loadingMetrics.totalLoads++;
      loadingMetrics.totalLoadTime += loadTime;
      loadingMetrics.averageLoadTime = loadingMetrics.totalLoadTime / loadingMetrics.totalLoads;
      
      if (import.meta.env.DEV) {
        console.log(`🌐 Translation loaded for ${language} in ${loadTime.toFixed(2)}ms (attempt ${attempt + 1})`);
      }
      
      return translations;
      
    } catch (error) {
      lastError = error;
      
      if (attempt < retries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        if (import.meta.env.DEV) {
          console.warn(`⚠️ Translation load failed for ${language}, retrying in ${delay}ms...`, error);
        }
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw new Error(`Failed to load translations for ${language} after ${retries + 1} attempts: ${lastError.message}`);
}

/**
 * Preload critical translation keys
 * @param {string} language - Language code
 * @returns {Promise<Object>} Critical translations
 */
async function preloadCriticalTranslations(language) {
  try {
    // Check if already preloaded
    if (criticalKeysCache.has(language)) {
      loadingMetrics.preloadHits++;
      return criticalKeysCache.get(language);
    }
    
    const startTime = performance.now();
    const fullTranslations = await loadTranslationFile(language, { useCache: true });
    const criticalTranslations = extractCriticalTranslations(fullTranslations);
    
    // Cache critical translations separately
    criticalKeysCache.set(language, criticalTranslations);
    
    const loadTime = performance.now() - startTime;
    
    if (import.meta.env.DEV) {
      console.log(`⚡ Critical translations preloaded for ${language} in ${loadTime.toFixed(2)}ms`);
      console.log(`📊 Critical keys: ${CRITICAL_TRANSLATION_KEYS.length}`);
    }
    
    return criticalTranslations;
    
  } catch (error) {
    console.error(`Failed to preload critical translations for ${language}:`, error);
    return {};
  }
}

/**
 * Load non-critical translations progressively
 * @param {string} language - Language code
 * @returns {Promise<Object>} Non-critical translations
 */
async function loadNonCriticalTranslations(language) {
  try {
    const fullTranslations = await loadTranslationFile(language, { useCache: true });
    const nonCriticalTranslations = extractNonCriticalTranslations(fullTranslations);
    
    if (import.meta.env.DEV) {
      console.log(`🔄 Non-critical translations loaded for ${language}`);
      console.log(`📊 Non-critical sections: ${NON_CRITICAL_KEYS.length}`);
    }
    
    return nonCriticalTranslations;
    
  } catch (error) {
    console.error(`Failed to load non-critical translations for ${language}:`, error);
    return {};
  }
}

/**
 * Load critical translations as separate chunks
 * @param {string} language - Language code
 * @returns {Promise<Object>} Critical translations
 */
async function loadCriticalTranslationChunk(language) {
  try {
    // Try to load critical chunk first (if it exists)
    const criticalModule = await import(/* @vite-ignore */ `../translations/${language}-critical.js`).catch(() => null);
    
    if (criticalModule) {
      return criticalModule.default;
    }
    
    // Fallback to extracting from full translations
    const fullTranslations = await loadTranslationFile(language, { useCache: true });
    return extractCriticalTranslations(fullTranslations);
    
  } catch (error) {
    console.warn(`Failed to load critical translations for ${language}:`, error);
    return {};
  }
}

/**
 * Load non-critical translations as separate chunks
 * @param {string} language - Language code
 * @returns {Promise<Object>} Non-critical translations
 */
async function loadNonCriticalTranslationChunk(language) {
  try {
    // Try to load non-critical chunk first (if it exists)
    const nonCriticalModule = await import(/* @vite-ignore */ `../translations/${language}-noncritical.js`).catch(() => null);
    
    if (nonCriticalModule) {
      return nonCriticalModule.default;
    }
    
    // Fallback to extracting from full translations
    const fullTranslations = await loadTranslationFile(language, { useCache: true });
    return extractNonCriticalTranslations(fullTranslations);
    
  } catch (error) {
    console.warn(`Failed to load non-critical translations for ${language}:`, error);
    return {};
  }
}

/**
 * Main lazy loading function with advanced options and code splitting
 * @param {string} language - Language code
 * @param {Object} options - Loading options
 * @returns {Promise<Object>} Complete translation object
 */
export async function lazyLoadTranslations(language, options = {}) {
  const {
    timeout = 10000,
    retries = 3,
    preloadOther = true,
    useCache = true,
    criticalOnly = false,
    progressive = true,
    codeSplitting = true
  } = options;
  
  const startTime = performance.now();
  
  try {
    let translations = {};
    
    if (criticalOnly) {
      // Load only critical translations for fast initial render
      if (codeSplitting) {
        translations = await loadCriticalTranslationChunk(language);
      } else {
        translations = await preloadCriticalTranslations(language);
      }
    } else if (progressive && codeSplitting) {
      // Progressive loading with code splitting
      const criticalPromise = loadCriticalTranslationChunk(language);
      const nonCriticalPromise = loadNonCriticalTranslationChunk(language);
      
      // Load critical translations first
      const criticalTranslations = await criticalPromise;
      
      // Start loading non-critical in background
      nonCriticalPromise.then(nonCriticalTranslations => {
        // Merge non-critical translations into cache
        const fullTranslations = { ...criticalTranslations, ...nonCriticalTranslations };
        
        if (useCache) {
          translationCache.set(language, {
            data: fullTranslations,
            loadedAt: Date.now(),
            loadTime: performance.now() - startTime,
            isProgressive: true
          });
        }
        
        if (import.meta.env.DEV) {
          console.log(`🔄 Progressive loading completed for ${language}`);
        }
      }).catch(error => {
        console.warn(`Progressive loading failed for ${language}:`, error);
      });
      
      // Return critical translations immediately
      translations = criticalTranslations;
      
    } else {
      // Load full translations
      translations = await loadTranslationFile(language, { timeout, retries, useCache });
    }
    
    // Preload other language if requested
    if (preloadOther && !criticalOnly) {
      const otherLanguage = language === 'pt' ? 'en' : 'pt';
      setTimeout(async () => {
        try {
          if (codeSplitting) {
            await loadCriticalTranslationChunk(otherLanguage);
          } else {
            await preloadCriticalTranslations(otherLanguage);
          }
          
          if (import.meta.env.DEV) {
            console.log(`🚀 Preloaded critical translations for ${otherLanguage}`);
          }
        } catch (error) {
          console.warn(`Failed to preload ${otherLanguage}:`, error);
        }
      }, 100); // Small delay to not block main loading
    }
    
    const totalTime = performance.now() - startTime;
    
    if (import.meta.env.DEV) {
      console.log(`✅ Lazy translation loading completed for ${language} in ${totalTime.toFixed(2)}ms`);
      if (codeSplitting) {
        console.log(`📦 Code splitting enabled - loaded ${Object.keys(translations).length} translation sections`);
      }
    }
    
    return translations;
    
  } catch (error) {
    console.error(`Lazy translation loading failed for ${language}:`, error);
    throw error;
  }
}

/**
 * Preload translations for both languages
 * @returns {Promise<void>}
 */
export async function preloadAllCriticalTranslations() {
  const startTime = performance.now();
  
  try {
    await Promise.all([
      preloadCriticalTranslations('pt'),
      preloadCriticalTranslations('en')
    ]);
    
    const totalTime = performance.now() - startTime;
    
    if (import.meta.env.DEV) {
      console.log(`🚀 All critical translations preloaded in ${totalTime.toFixed(2)}ms`);
    }
    
  } catch (error) {
    console.error('Failed to preload all critical translations:', error);
  }
}

/**
 * Get loading performance metrics
 * @returns {Object} Performance metrics
 */
export function getLoadingMetrics() {
  const cacheSize = translationCache.size;
  const preloadCacheSize = criticalKeysCache.size;
  const totalRequests = loadingMetrics.totalLoads + loadingMetrics.cacheHits + loadingMetrics.preloadHits;
  const cacheHitRate = totalRequests > 0 ? ((loadingMetrics.cacheHits + loadingMetrics.preloadHits) / totalRequests) * 100 : 0;
  
  return {
    ...loadingMetrics,
    cacheSize,
    preloadCacheSize,
    totalRequests,
    cacheHitRate,
    criticalKeysCount: CRITICAL_TRANSLATION_KEYS.length,
    nonCriticalKeysCount: NON_CRITICAL_KEYS.length,
    efficiency: cacheHitRate > 80 ? 'excellent' : cacheHitRate > 60 ? 'good' : 'fair'
  };
}

/**
 * Clear all translation caches
 */
export function clearTranslationCaches() {
  translationCache.clear();
  preloadCache.clear();
  criticalKeysCache.clear();
  
  // Reset metrics
  loadingMetrics.totalLoads = 0;
  loadingMetrics.cacheHits = 0;
  loadingMetrics.preloadHits = 0;
  loadingMetrics.averageLoadTime = 0;
  loadingMetrics.totalLoadTime = 0;
  
  if (import.meta.env.DEV) {
    console.log('🧹 Translation caches cleared');
  }
}

/**
 * Get cache status for debugging
 * @returns {Object} Cache status information
 */
export function getCacheStatus() {
  const translationCacheEntries = Array.from(translationCache.entries()).map(([lang, data]) => ({
    language: lang,
    loadedAt: new Date(data.loadedAt).toISOString(),
    loadTime: data.loadTime,
    size: JSON.stringify(data.data).length
  }));
  
  const criticalCacheEntries = Array.from(criticalKeysCache.entries()).map(([lang, data]) => ({
    language: lang,
    size: JSON.stringify(data).length,
    keyCount: Object.keys(data).length
  }));
  
  return {
    translationCache: translationCacheEntries,
    criticalCache: criticalCacheEntries,
    metrics: getLoadingMetrics()
  };
}

// Export for debugging in development
if (import.meta.env.DEV) {
  window.JOURNALSCOPE_TRANSLATION_DEBUG = {
    getLoadingMetrics,
    getCacheStatus,
    clearTranslationCaches,
    preloadAllCriticalTranslations
  };
}