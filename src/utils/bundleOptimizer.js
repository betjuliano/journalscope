/**
 * Bundle Optimizer Utility
 * Tracks translation usage and optimizes bundle size by removing unused translations
 */

// Translation usage tracking
const translationUsageMap = new Map();
const sessionUsageMap = new Map();
const bundleMetrics = {
  totalKeys: 0,
  usedKeys: 0,
  unusedKeys: 0,
  usageRate: 0,
  potentialSavings: 0,
  lastOptimization: null
};

// Critical keys that should never be removed
const PROTECTED_KEYS = [
  'hero.title',
  'hero.subtitle',
  'loading.title',
  'loading.processingData',
  'error.title',
  'error.retry',
  'table.actions',
  'table.columns.journal'
];

/**
 * Track translation key usage
 * @param {string} key - Translation key
 * @param {string} language - Language code
 */
export function trackTranslationUsage(key, language) {
  if (!key || typeof key !== 'string') return;
  
  const fullKey = `${language}:${key}`;
  
  // Update global usage map
  const currentCount = translationUsageMap.get(fullKey) || 0;
  translationUsageMap.set(fullKey, currentCount + 1);
  
  // Update session usage map
  const sessionCount = sessionUsageMap.get(fullKey) || 0;
  sessionUsageMap.set(fullKey, sessionCount + 1);
  
  // Update metrics periodically
  if (sessionCount === 1) {
    updateBundleMetrics();
  }
}

/**
 * Update bundle metrics
 */
function updateBundleMetrics() {
  const totalTrackedKeys = translationUsageMap.size;
  const usedKeysInSession = sessionUsageMap.size;
  
  bundleMetrics.totalKeys = totalTrackedKeys;
  bundleMetrics.usedKeys = usedKeysInSession;
  bundleMetrics.unusedKeys = Math.max(0, totalTrackedKeys - usedKeysInSession);
  bundleMetrics.usageRate = totalTrackedKeys > 0 ? (usedKeysInSession / totalTrackedKeys) * 100 : 0;
  
  // Estimate potential savings (rough calculation)
  bundleMetrics.potentialSavings = bundleMetrics.unusedKeys * 50; // Assume 50 bytes per unused key
}

/**
 * Get unused translation keys for optimization
 * @param {string} language - Language code
 * @returns {Array<string>} Unused translation keys
 */
export function getUnusedTranslationKeys(language) {
  const unusedKeys = [];
  const languagePrefix = `${language}:`;
  
  // Get all keys for the language
  const allLanguageKeys = Array.from(translationUsageMap.keys())
    .filter(key => key.startsWith(languagePrefix));
  
  // Find keys that haven't been used in this session
  for (const fullKey of allLanguageKeys) {
    if (!sessionUsageMap.has(fullKey)) {
      const key = fullKey.substring(languagePrefix.length);
      
      // Don't mark protected keys as unused
      if (!PROTECTED_KEYS.includes(key)) {
        unusedKeys.push(key);
      }
    }
  }
  
  return unusedKeys;
}

/**
 * Generate optimized translation bundle
 * @param {Object} fullTranslations - Full translation object
 * @param {string} language - Language code
 * @param {Object} options - Optimization options
 * @returns {Object} Optimized translation bundle
 */
export function generateOptimizedBundle(fullTranslations, language, options = {}) {
  const {
    removeUnused = true,
    minUsageThreshold = 0,
    preserveStructure = true
  } = options;
  
  if (!removeUnused) {
    return fullTranslations;
  }
  
  const optimizedBundle = {};
  const unusedKeys = getUnusedTranslationKeys(language);
  const languagePrefix = `${language}:`;
  
  // Helper function to check if a key path should be included
  const shouldIncludeKey = (keyPath) => {
    const fullKey = `${languagePrefix}${keyPath}`;
    const usageCount = translationUsageMap.get(fullKey) || 0;
    
    // Always include protected keys
    if (PROTECTED_KEYS.includes(keyPath)) {
      return true;
    }
    
    // Include if used above threshold
    if (usageCount >= minUsageThreshold) {
      return true;
    }
    
    // Exclude if explicitly marked as unused
    if (unusedKeys.includes(keyPath)) {
      return false;
    }
    
    // Include by default if no usage data
    return usageCount === 0;
  };
  
  // Recursively copy used translations
  const copyUsedTranslations = (source, target, currentPath = '') => {
    for (const [key, value] of Object.entries(source)) {
      const keyPath = currentPath ? `${currentPath}.${key}` : key;
      
      if (typeof value === 'object' && value !== null) {
        // Handle nested objects
        if (preserveStructure || hasUsedChildKeys(source[key], keyPath)) {
          target[key] = {};
          copyUsedTranslations(source[key], target[key], keyPath);
        }
      } else if (typeof value === 'string') {
        // Handle string values
        if (shouldIncludeKey(keyPath)) {
          target[key] = value;
        }
      }
    }
  };
  
  // Helper function to check if an object has any used child keys
  const hasUsedChildKeys = (obj, basePath) => {
    for (const [key, value] of Object.entries(obj)) {
      const keyPath = `${basePath}.${key}`;
      
      if (typeof value === 'string' && shouldIncludeKey(keyPath)) {
        return true;
      } else if (typeof value === 'object' && value !== null) {
        if (hasUsedChildKeys(value, keyPath)) {
          return true;
        }
      }
    }
    return false;
  };
  
  copyUsedTranslations(fullTranslations, optimizedBundle);
  
  // Update optimization timestamp
  bundleMetrics.lastOptimization = Date.now();
  
  if (import.meta.env.DEV) {
    const originalSize = JSON.stringify(fullTranslations).length;
    const optimizedSize = JSON.stringify(optimizedBundle).length;
    const savings = originalSize - optimizedSize;
    const savingsPercent = originalSize > 0 ? (savings / originalSize) * 100 : 0;
    
    console.group(`📦 Bundle Optimization for ${language}`);
    console.log(`📊 Original size: ${(originalSize / 1024).toFixed(2)} KB`);
    console.log(`📊 Optimized size: ${(optimizedSize / 1024).toFixed(2)} KB`);
    console.log(`💾 Savings: ${(savings / 1024).toFixed(2)} KB (${savingsPercent.toFixed(1)}%)`);
    console.log(`🗑️ Unused keys removed: ${unusedKeys.length}`);
    console.log(`🔒 Protected keys: ${PROTECTED_KEYS.length}`);
    console.groupEnd();
  }
  
  return optimizedBundle;
}

/**
 * Get bundle optimization metrics
 * @returns {Object} Bundle metrics
 */
export function getBundleMetrics() {
  updateBundleMetrics();
  
  return {
    ...bundleMetrics,
    sessionUsage: sessionUsageMap.size,
    totalTracked: translationUsageMap.size,
    protectedKeys: PROTECTED_KEYS.length,
    recommendations: getBundleRecommendations()
  };
}

/**
 * Get bundle optimization recommendations
 * @returns {Array<string>} Optimization recommendations
 */
function getBundleRecommendations() {
  const recommendations = [];
  
  if (bundleMetrics.usageRate < 50) {
    recommendations.push('Consider implementing lazy loading for unused translations');
  }
  
  if (bundleMetrics.unusedKeys > 100) {
    recommendations.push('High number of unused keys detected - consider bundle optimization');
  }
  
  if (bundleMetrics.potentialSavings > 5000) {
    recommendations.push(`Potential savings of ${(bundleMetrics.potentialSavings / 1024).toFixed(1)} KB available`);
  }
  
  if (sessionUsageMap.size < 20) {
    recommendations.push('Low translation usage - consider critical-only loading');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Bundle optimization is performing well');
  }
  
  return recommendations;
}

/**
 * Clear usage tracking data
 */
export function clearUsageTracking() {
  translationUsageMap.clear();
  sessionUsageMap.clear();
  
  bundleMetrics.totalKeys = 0;
  bundleMetrics.usedKeys = 0;
  bundleMetrics.unusedKeys = 0;
  bundleMetrics.usageRate = 0;
  bundleMetrics.potentialSavings = 0;
  bundleMetrics.lastOptimization = null;
  
  if (import.meta.env.DEV) {
    console.log('🧹 Bundle usage tracking cleared');
  }
}

/**
 * Export usage data for analysis
 * @returns {Object} Usage data
 */
export function exportUsageData() {
  return {
    globalUsage: Object.fromEntries(translationUsageMap),
    sessionUsage: Object.fromEntries(sessionUsageMap),
    metrics: getBundleMetrics(),
    timestamp: Date.now()
  };
}

/**
 * Import usage data from previous sessions
 * @param {Object} usageData - Previously exported usage data
 */
export function importUsageData(usageData) {
  if (!usageData || typeof usageData !== 'object') return;
  
  try {
    // Import global usage data
    if (usageData.globalUsage) {
      for (const [key, count] of Object.entries(usageData.globalUsage)) {
        translationUsageMap.set(key, count);
      }
    }
    
    updateBundleMetrics();
    
    if (import.meta.env.DEV) {
      console.log('📥 Bundle usage data imported successfully');
    }
    
  } catch (error) {
    console.error('Failed to import usage data:', error);
  }
}

// Persist usage data to localStorage periodically
let persistenceTimer;

/**
 * Start automatic persistence of usage data
 */
export function startUsagePersistence() {
  if (persistenceTimer) return;
  
  persistenceTimer = setInterval(() => {
    try {
      const usageData = exportUsageData();
      localStorage.setItem('journalscope_translation_usage', JSON.stringify(usageData));
    } catch (error) {
      console.warn('Failed to persist usage data:', error);
    }
  }, 30000); // Persist every 30 seconds
}

/**
 * Stop automatic persistence
 */
export function stopUsagePersistence() {
  if (persistenceTimer) {
    clearInterval(persistenceTimer);
    persistenceTimer = null;
  }
}

/**
 * Load persisted usage data
 */
export function loadPersistedUsageData() {
  try {
    const stored = localStorage.getItem('journalscope_translation_usage');
    if (stored) {
      const usageData = JSON.parse(stored);
      importUsageData(usageData);
    }
  } catch (error) {
    console.warn('Failed to load persisted usage data:', error);
  }
}

// Initialize persistence on module load
if (typeof window !== 'undefined') {
  loadPersistedUsageData();
  startUsagePersistence();
  
  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    stopUsagePersistence();
    
    // Final persistence
    try {
      const usageData = exportUsageData();
      localStorage.setItem('journalscope_translation_usage', JSON.stringify(usageData));
    } catch (error) {
      // Silently fail on unload
    }
  });
}

// Export for debugging in development
if (import.meta.env.DEV) {
  window.JOURNALSCOPE_BUNDLE_DEBUG = {
    getBundleMetrics,
    getUnusedTranslationKeys,
    clearUsageTracking,
    exportUsageData,
    importUsageData
  };
}