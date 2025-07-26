/**
 * Optimized Translation Loader
 * Implements advanced code splitting, preloading, and bundle optimization for translations
 */

// Enhanced caching system with compression and metadata
const translationCache = new Map();
const preloadCache = new Map();
const bundleOptimizationCache = new Map();

// Performance metrics with detailed tracking
const optimizationMetrics = {
  loadTimes: {
    critical: [],
    nonCritical: [],
    full: []
  },
  bundleSizes: {
    critical: 0,
    nonCritical: 0,
    full: 0,
    optimized: 0
  },
  cachePerformance: {
    hits: 0,
    misses: 0,
    preloadHits: 0,
    compressionSavings: 0
  },
  codeSplitting: {
    chunksLoaded: 0,
    totalChunks: 4, // pt-critical, en-critical, pt-noncritical, en-noncritical
    parallelLoads: 0,
    sequentialLoads: 0
  }
};

// Critical translation keys for immediate loading
const CRITICAL_KEYS = [
  'hero.title',
  'hero.subtitle', 
  'loading.title',
  'loading.processingData',
  'loading.loadingStatus',
  'error.title',
  'error.retry',
  'table.actions',
  'table.columns.journal',
  'table.noResults',
  'table.showingResults',
  'filters.search.placeholder',
  'stats.totalJournals'
];

// Progressive loading configuration
const PROGRESSIVE_CONFIG = {
  criticalDelay: 0,        // Load immediately
  nonCriticalDelay: 100,   // Load after 100ms
  preloadDelay: 200,       // Preload other language after 200ms
  batchSize: 2,            // Load 2 chunks in parallel
  maxRetries: 3,
  timeout: 8000
};

/**
 * Compress translation data for storage optimization
 * @param {Object} data - Translation data
 * @returns {string} Compressed data
 */
function compressTranslationData(data) {
  try {
    const jsonString = JSON.stringify(data);
    
    // Simple compression using repeated pattern replacement
    let compressed = jsonString
      .replace(/\"([^\"]+)\":/g, (match, key) => {
        // Compress common keys
        const keyMap = {
          'title': 't',
          'subtitle': 's',
          'description': 'd',
          'label': 'l',
          'placeholder': 'p'
        };
        return `"${keyMap[key] || key}":`;
      });
    
    const originalSize = jsonString.length;
    const compressedSize = compressed.length;
    const savings = originalSize - compressedSize;
    
    optimizationMetrics.cachePerformance.compressionSavings += savings;
    
    return compressed;
  } catch (error) {
    console.warn('Translation compression failed:', error);
    return JSON.stringify(data);
  }
}

/**
 * Decompress translation data
 * @param {string} compressedData - Compressed data
 * @returns {Object} Decompressed translation data
 */
function decompressTranslationData(compressedData) {
  try {
    // Reverse the compression
    const decompressed = compressedData
      .replace(/\"([tsldp])\":/g, (match, shortKey) => {
        const keyMap = {
          't': 'title',
          's': 'subtitle', 
          'd': 'description',
          'l': 'label',
          'p': 'placeholder'
        };
        return `"${keyMap[shortKey] || shortKey}":`;
      });
    
    return JSON.parse(decompressed);
  } catch (error) {
    console.warn('Translation decompression failed:', error);
    return JSON.parse(compressedData);
  }
}

/**
 * Load critical translation chunk with optimization
 * @param {string} language - Language code
 * @returns {Promise<Object>} Critical translations
 */
async function loadCriticalChunk(language) {
  const startTime = performance.now();
  const cacheKey = `${language}-critical`;
  
  // Check cache first
  if (translationCache.has(cacheKey)) {
    optimizationMetrics.cachePerformance.hits++;
    const cached = translationCache.get(cacheKey);
    return decompressTranslationData(cached.data);
  }
  
  try {
    // Load critical chunk with dynamic import
    const module = await import(/* @vite-ignore */ `../translations/${language}-critical.js`);
    const translations = module.default;
    
    if (!translations || typeof translations !== 'object') {
      throw new Error(`Invalid critical translations for ${language}`);
    }
    
    // Cache with compression
    const compressed = compressTranslationData(translations);
    const loadTime = performance.now() - startTime;
    
    translationCache.set(cacheKey, {
      data: compressed,
      loadedAt: Date.now(),
      loadTime,
      type: 'critical',
      compressed: true
    });
    
    // Update metrics
    optimizationMetrics.loadTimes.critical.push(loadTime);
    optimizationMetrics.bundleSizes.critical = JSON.stringify(translations).length;
    optimizationMetrics.codeSplitting.chunksLoaded++;
    optimizationMetrics.cachePerformance.misses++;
    
    if (import.meta.env.DEV) {
      console.log(`⚡ Critical translations loaded for ${language} in ${loadTime.toFixed(2)}ms`);
    }
    
    return translations;
    
  } catch (error) {
    console.error(`Failed to load critical translations for ${language}:`, error);
    throw error;
  }
}

/**
 * Load non-critical translation chunk with optimization
 * @param {string} language - Language code
 * @returns {Promise<Object>} Non-critical translations
 */
async function loadNonCriticalChunk(language) {
  const startTime = performance.now();
  const cacheKey = `${language}-noncritical`;
  
  // Check cache first
  if (translationCache.has(cacheKey)) {
    optimizationMetrics.cachePerformance.hits++;
    const cached = translationCache.get(cacheKey);
    return decompressTranslationData(cached.data);
  }
  
  try {
    // Load non-critical chunk with dynamic import
    const module = await import(/* @vite-ignore */ `../translations/${language}-noncritical.js`);
    const translations = module.default;
    
    if (!translations || typeof translations !== 'object') {
      throw new Error(`Invalid non-critical translations for ${language}`);
    }
    
    // Cache with compression
    const compressed = compressTranslationData(translations);
    const loadTime = performance.now() - startTime;
    
    translationCache.set(cacheKey, {
      data: compressed,
      loadedAt: Date.now(),
      loadTime,
      type: 'noncritical',
      compressed: true
    });
    
    // Update metrics
    optimizationMetrics.loadTimes.nonCritical.push(loadTime);
    optimizationMetrics.bundleSizes.nonCritical = JSON.stringify(translations).length;
    optimizationMetrics.codeSplitting.chunksLoaded++;
    optimizationMetrics.cachePerformance.misses++;
    
    if (import.meta.env.DEV) {
      console.log(`🔄 Non-critical translations loaded for ${language} in ${loadTime.toFixed(2)}ms`);
    }
    
    return translations;
    
  } catch (error) {
    console.error(`Failed to load non-critical translations for ${language}:`, error);
    throw error;
  }
}

/**
 * Merge critical and non-critical translations
 * @param {Object} critical - Critical translations
 * @param {Object} nonCritical - Non-critical translations
 * @returns {Object} Merged translations
 */
function mergeTranslations(critical, nonCritical) {
  const merged = { ...critical };
  
  // Deep merge non-critical translations
  Object.keys(nonCritical).forEach(key => {
    if (merged[key] && typeof merged[key] === 'object' && typeof nonCritical[key] === 'object') {
      merged[key] = { ...merged[key], ...nonCritical[key] };
    } else {
      merged[key] = nonCritical[key];
    }
  });
  
  return merged;
}

/**
 * Optimized translation loader with advanced code splitting and preloading
 * @param {string} language - Language code
 * @param {Object} options - Loading options
 * @returns {Promise<Object>} Complete translation object
 */
export async function loadOptimizedTranslations(language, options = {}) {
  const {
    criticalOnly = false,
    progressive = true,
    preloadOther = true,
    useCompression = true,
    parallelLoading = true,
    bundleOptimization = true
  } = options;
  
  const startTime = performance.now();
  
  try {
    let translations = {};
    
    if (criticalOnly) {
      // Load only critical translations for fastest initial render
      translations = await loadCriticalChunk(language);
      
      // Start preloading non-critical in background
      if (progressive) {
        setTimeout(async () => {
          try {
            const nonCritical = await loadNonCriticalChunk(language);
            
            // Merge and update cache
            const merged = mergeTranslations(translations, nonCritical);
            const cacheKey = `${language}-merged`;
            const compressed = compressTranslationData(merged);
            
            translationCache.set(cacheKey, {
              data: compressed,
              loadedAt: Date.now(),
              loadTime: performance.now() - startTime,
              type: 'merged',
              compressed: true
            });
            
            if (import.meta.env.DEV) {
              console.log(`🔄 Progressive loading completed for ${language}`);
            }
            
          } catch (error) {
            console.warn(`Progressive loading failed for ${language}:`, error);
          }
        }, PROGRESSIVE_CONFIG.nonCriticalDelay);
      }
      
    } else if (progressive && parallelLoading) {
      // Load critical and non-critical in parallel for optimal performance
      optimizationMetrics.codeSplitting.parallelLoads++;
      
      const [critical, nonCritical] = await Promise.all([
        loadCriticalChunk(language),
        loadNonCriticalChunk(language)
      ]);
      
      translations = mergeTranslations(critical, nonCritical);
      
    } else {
      // Sequential loading (fallback)
      optimizationMetrics.codeSplitting.sequentialLoads++;
      
      const critical = await loadCriticalChunk(language);
      const nonCritical = await loadNonCriticalChunk(language);
      
      translations = mergeTranslations(critical, nonCritical);
    }
    
    // Bundle optimization
    if (bundleOptimization) {
      const { generateOptimizedBundle } = await import('./bundleOptimizer.js');
      translations = generateOptimizedBundle(translations, language, {
        removeUnused: true,
        minUsageThreshold: 0,
        preserveStructure: true
      });
      
      optimizationMetrics.bundleSizes.optimized = JSON.stringify(translations).length;
    }
    
    // Preload other language critical translations
    if (preloadOther && !criticalOnly) {
      const otherLanguage = language === 'pt' ? 'en' : 'pt';
      setTimeout(async () => {
        try {
          await loadCriticalChunk(otherLanguage);
          optimizationMetrics.cachePerformance.preloadHits++;
          
          if (import.meta.env.DEV) {
            console.log(`🚀 Preloaded critical translations for ${otherLanguage}`);
          }
        } catch (error) {
          console.warn(`Failed to preload ${otherLanguage}:`, error);
        }
      }, PROGRESSIVE_CONFIG.preloadDelay);
    }
    
    const totalTime = performance.now() - startTime;
    optimizationMetrics.loadTimes.full.push(totalTime);
    
    if (import.meta.env.DEV) {
      console.group(`🚀 Optimized translation loading completed for ${language}`);
      console.log(`⏱️ Total time: ${totalTime.toFixed(2)}ms`);
      console.log(`📦 Bundle size: ${(JSON.stringify(translations).length / 1024).toFixed(2)} KB`);
      console.log(`🗜️ Compression savings: ${(optimizationMetrics.cachePerformance.compressionSavings / 1024).toFixed(2)} KB`);
      console.log(`📊 Cache hit rate: ${((optimizationMetrics.cachePerformance.hits / (optimizationMetrics.cachePerformance.hits + optimizationMetrics.cachePerformance.misses)) * 100).toFixed(1)}%`);
      console.groupEnd();
    }
    
    return translations;
    
  } catch (error) {
    console.error(`Optimized translation loading failed for ${language}:`, error);
    
    // Fallback to regular loading
    try {
      const { lazyLoadTranslations } = await import('./lazyTranslations.js');
      return await lazyLoadTranslations(language, { criticalOnly, progressive: false });
    } catch (fallbackError) {
      console.error('Fallback translation loading also failed:', fallbackError);
      throw fallbackError;
    }
  }
}

/**
 * Preload all critical translations for both languages
 * @returns {Promise<void>}
 */
export async function preloadAllCriticalTranslations() {
  const startTime = performance.now();
  
  try {
    await Promise.all([
      loadCriticalChunk('pt'),
      loadCriticalChunk('en')
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
 * Get optimization metrics and performance report
 * @returns {Object} Optimization metrics
 */
export function getOptimizationMetrics() {
  const totalRequests = optimizationMetrics.cachePerformance.hits + optimizationMetrics.cachePerformance.misses;
  const cacheHitRate = totalRequests > 0 ? (optimizationMetrics.cachePerformance.hits / totalRequests) * 100 : 0;
  
  const avgCriticalTime = optimizationMetrics.loadTimes.critical.length > 0 ?
    optimizationMetrics.loadTimes.critical.reduce((a, b) => a + b, 0) / optimizationMetrics.loadTimes.critical.length : 0;
  
  const avgNonCriticalTime = optimizationMetrics.loadTimes.nonCritical.length > 0 ?
    optimizationMetrics.loadTimes.nonCritical.reduce((a, b) => a + b, 0) / optimizationMetrics.loadTimes.nonCritical.length : 0;
  
  const avgFullTime = optimizationMetrics.loadTimes.full.length > 0 ?
    optimizationMetrics.loadTimes.full.reduce((a, b) => a + b, 0) / optimizationMetrics.loadTimes.full.length : 0;
  
  const totalBundleSize = optimizationMetrics.bundleSizes.critical + optimizationMetrics.bundleSizes.nonCritical;
  const optimizationSavings = totalBundleSize - optimizationMetrics.bundleSizes.optimized;
  const optimizationRate = totalBundleSize > 0 ? (optimizationSavings / totalBundleSize) * 100 : 0;
  
  return {
    loadTimes: {
      averageCritical: avgCriticalTime,
      averageNonCritical: avgNonCriticalTime,
      averageFull: avgFullTime,
      samples: {
        critical: optimizationMetrics.loadTimes.critical.length,
        nonCritical: optimizationMetrics.loadTimes.nonCritical.length,
        full: optimizationMetrics.loadTimes.full.length
      }
    },
    bundleOptimization: {
      originalSize: totalBundleSize,
      optimizedSize: optimizationMetrics.bundleSizes.optimized,
      savings: optimizationSavings,
      optimizationRate,
      compressionSavings: optimizationMetrics.cachePerformance.compressionSavings
    },
    cachePerformance: {
      hitRate: cacheHitRate,
      hits: optimizationMetrics.cachePerformance.hits,
      misses: optimizationMetrics.cachePerformance.misses,
      preloadHits: optimizationMetrics.cachePerformance.preloadHits,
      totalRequests
    },
    codeSplitting: {
      chunksLoaded: optimizationMetrics.codeSplitting.chunksLoaded,
      totalChunks: optimizationMetrics.codeSplitting.totalChunks,
      loadingProgress: (optimizationMetrics.codeSplitting.chunksLoaded / optimizationMetrics.codeSplitting.totalChunks) * 100,
      parallelLoads: optimizationMetrics.codeSplitting.parallelLoads,
      sequentialLoads: optimizationMetrics.codeSplitting.sequentialLoads,
      parallelRatio: optimizationMetrics.codeSplitting.parallelLoads > 0 ? 
        (optimizationMetrics.codeSplitting.parallelLoads / (optimizationMetrics.codeSplitting.parallelLoads + optimizationMetrics.codeSplitting.sequentialLoads)) * 100 : 0
    },
    performance: {
      efficiency: cacheHitRate > 80 && avgCriticalTime < 100 ? 'excellent' : 
                 cacheHitRate > 60 && avgCriticalTime < 200 ? 'good' : 'fair',
      recommendations: getOptimizationRecommendations(cacheHitRate, avgCriticalTime, optimizationRate)
    }
  };
}

/**
 * Get optimization recommendations
 * @param {number} cacheHitRate - Cache hit rate percentage
 * @param {number} avgCriticalTime - Average critical loading time
 * @param {number} optimizationRate - Bundle optimization rate
 * @returns {Array<string>} Recommendations
 */
function getOptimizationRecommendations(cacheHitRate, avgCriticalTime, optimizationRate) {
  const recommendations = [];
  
  if (cacheHitRate < 70) {
    recommendations.push('Consider increasing cache retention or improving cache strategy');
  }
  
  if (avgCriticalTime > 150) {
    recommendations.push('Critical translation loading is slow - consider further code splitting');
  }
  
  if (optimizationRate < 20) {
    recommendations.push('Bundle optimization savings are low - review unused translation removal');
  }
  
  if (optimizationMetrics.codeSplitting.parallelRatio < 80) {
    recommendations.push('Consider using more parallel loading for better performance');
  }
  
  if (optimizationMetrics.cachePerformance.compressionSavings < 1000) {
    recommendations.push('Compression savings are minimal - consider alternative optimization strategies');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Translation loading optimization is performing excellently');
  }
  
  return recommendations;
}

/**
 * Clear all optimization caches and reset metrics
 */
export function clearOptimizationCaches() {
  translationCache.clear();
  preloadCache.clear();
  bundleOptimizationCache.clear();
  
  // Reset metrics
  optimizationMetrics.loadTimes.critical = [];
  optimizationMetrics.loadTimes.nonCritical = [];
  optimizationMetrics.loadTimes.full = [];
  
  optimizationMetrics.bundleSizes.critical = 0;
  optimizationMetrics.bundleSizes.nonCritical = 0;
  optimizationMetrics.bundleSizes.full = 0;
  optimizationMetrics.bundleSizes.optimized = 0;
  
  optimizationMetrics.cachePerformance.hits = 0;
  optimizationMetrics.cachePerformance.misses = 0;
  optimizationMetrics.cachePerformance.preloadHits = 0;
  optimizationMetrics.cachePerformance.compressionSavings = 0;
  
  optimizationMetrics.codeSplitting.chunksLoaded = 0;
  optimizationMetrics.codeSplitting.parallelLoads = 0;
  optimizationMetrics.codeSplitting.sequentialLoads = 0;
  
  if (import.meta.env.DEV) {
    console.log('🧹 Optimization caches and metrics cleared');
  }
}

// Export for debugging in development
if (import.meta.env.DEV) {
  window.JOURNALSCOPE_OPTIMIZATION_DEBUG = {
    getOptimizationMetrics,
    clearOptimizationCaches,
    loadCriticalChunk,
    loadNonCriticalChunk,
    preloadAllCriticalTranslations,
    metrics: optimizationMetrics
  };
}