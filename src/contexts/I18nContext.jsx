import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

// Create the I18n context
const I18nContext = createContext();

// Translation cache to avoid repeated loading
const translationCache = {};

// Memoized translation computations cache
const translationComputationCache = new Map();

// Default language - ALWAYS Portuguese for first-time users
const DEFAULT_LANGUAGE = 'pt';

// Storage key for language preference
const LANGUAGE_STORAGE_KEY = 'journalscope_language';

// Enhanced storage utilities with comprehensive error handling
const storageUtils = {
  /**
   * Safely get item from localStorage with fallback
   * @param {string} key - Storage key
   * @param {string} defaultValue - Default value if retrieval fails
   * @returns {string|null} Retrieved value or default
   */
  getItem: (key, defaultValue = null) => {
    try {
      // Check if localStorage is available
      if (typeof Storage === 'undefined' || !window.localStorage) {
        console.warn('localStorage is not available');
        return defaultValue;
      }

      const item = localStorage.getItem(key);
      
      // Handle null, undefined, and empty string cases
      if (item === null || item === undefined || item === '') {
        return defaultValue;
      }

      return item;
    } catch (error) {
      console.warn(`Failed to get item '${key}' from localStorage:`, error);
      return defaultValue;
    }
  },

  /**
   * Safely set item in localStorage with error handling
   * @param {string} key - Storage key
   * @param {string} value - Value to store
   * @returns {boolean} Success status
   */
  setItem: (key, value) => {
    try {
      // Check if localStorage is available
      if (typeof Storage === 'undefined' || !window.localStorage) {
        console.warn('localStorage is not available for setting');
        return false;
      }

      // Validate inputs
      if (!key || typeof key !== 'string') {
        console.warn('Invalid key provided to localStorage.setItem');
        return false;
      }

      if (value === null || value === undefined) {
        console.warn('Invalid value provided to localStorage.setItem');
        return false;
      }

      localStorage.setItem(key, String(value));
      
      // Verify the item was actually stored
      const storedValue = localStorage.getItem(key);
      if (storedValue !== String(value)) {
        console.warn('localStorage.setItem verification failed');
        return false;
      }

      return true;
    } catch (error) {
      // Handle specific localStorage errors
      if (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        console.error('localStorage quota exceeded. Attempting to clear old data...');
        try {
          // Try to clear some space by removing old entries
          const keysToRemove = [];
          for (let i = 0; i < localStorage.length; i++) {
            const storageKey = localStorage.key(i);
            if (storageKey && storageKey.startsWith('journalscope_') && storageKey !== key) {
              keysToRemove.push(storageKey);
            }
          }
          
          // Remove old entries and retry
          keysToRemove.forEach(oldKey => {
            try {
              localStorage.removeItem(oldKey);
            } catch (removeError) {
              console.warn(`Failed to remove old key '${oldKey}':`, removeError);
            }
          });

          // Retry setting the item
          localStorage.setItem(key, String(value));
          return true;
        } catch (retryError) {
          console.error('Failed to set localStorage item even after cleanup:', retryError);
          return false;
        }
      } else {
        console.error(`Failed to set item '${key}' in localStorage:`, error);
        return false;
      }
    }
  },

  /**
   * Check if localStorage is available and functional
   * @returns {boolean} Availability status
   */
  isAvailable: () => {
    try {
      // Check if localStorage exists and has basic methods
      if (typeof localStorage !== 'undefined' && localStorage !== null) {
        // Verify required methods exist
        if (typeof localStorage.getItem === 'function' && 
            typeof localStorage.setItem === 'function' && 
            typeof localStorage.removeItem === 'function') {
          
          // Test localStorage functionality with a unique test key
          const testKey = '__localStorage_test__';
          const testValue = 'test';
          
          try {
            localStorage.setItem(testKey, testValue);
            const retrieved = localStorage.getItem(testKey);
            localStorage.removeItem(testKey);
            
            return retrieved === testValue;
          } catch (testError) {
            // If test operations fail, localStorage is not functional
            return false;
          }
        }
      }
      
      return false;
    } catch (error) {
      return false;
    }
  },

  /**
   * Get storage info for debugging
   * @returns {object} Storage information
   */
  getStorageInfo: () => {
    try {
      if (!storageUtils.isAvailable()) {
        return { available: false, used: 0, remaining: 0, total: 0 };
      }

      let used = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage[key].length + key.length;
        }
      }

      // Estimate total storage (usually 5-10MB, we'll use 5MB as conservative estimate)
      const estimatedTotal = 5 * 1024 * 1024; // 5MB in bytes
      const remaining = estimatedTotal - used;

      return {
        available: true,
        used: used,
        remaining: Math.max(0, remaining),
        total: estimatedTotal,
        usagePercentage: Math.round((used / estimatedTotal) * 100)
      };
    } catch (error) {
      return { available: false, error: error.message };
    }
  }
};

// Performance monitoring for translation operations
const performanceMetrics = {
  translationLoadTime: 0,
  cacheHits: 0,
  cacheMisses: 0,
  computationTime: 0,
  totalTranslations: 0,
  averageComputationTime: 0
};

/**
 * I18n Context Provider Component
 * Manages language state, translation loading, and persistence
 */
export const I18nProvider = ({ children }) => {
  const [language, setLanguageState] = useState(DEFAULT_LANGUAGE);
  const [translations, setTranslations] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Enhanced language preference loading with comprehensive error handling
  useEffect(() => {
    const loadLanguagePreference = () => {
      // Check localStorage availability first
      if (!storageUtils.isAvailable()) {
        if (import.meta.env.DEV) {
          console.warn('localStorage not available, using default language');
        }
        // Ensure default language is set even without localStorage
        setLanguageState(DEFAULT_LANGUAGE);
        return;
      }

      const savedLanguage = storageUtils.getItem(LANGUAGE_STORAGE_KEY);
      
      if (savedLanguage) {
        // Validate the saved language
        if (['pt', 'en'].includes(savedLanguage)) {
          if (import.meta.env.DEV) {
            console.log(`🌐 Loaded saved language preference: ${savedLanguage}`);
          }
          setLanguageState(savedLanguage);
        } else {
          if (import.meta.env.DEV) {
            console.warn(`Invalid saved language '${savedLanguage}', using default`);
          }
          // Clean up invalid value and set default
          setLanguageState(DEFAULT_LANGUAGE);
          storageUtils.setItem(LANGUAGE_STORAGE_KEY, DEFAULT_LANGUAGE);
        }
      } else {
        // No saved preference - ensure default is Portuguese and save it
        if (import.meta.env.DEV) {
          console.log(`🌐 No saved language preference, using default: ${DEFAULT_LANGUAGE}`);
          console.log(`🇧🇷 Setting Portuguese as default language for first-time user`);
        }
        setLanguageState(DEFAULT_LANGUAGE);
        storageUtils.setItem(LANGUAGE_STORAGE_KEY, DEFAULT_LANGUAGE);
      }
    };

    loadLanguagePreference();
  }, []);

  // Simple and reliable translation loading
  const loadTranslations = useCallback(async (targetLanguage) => {
    const startTime = performance.now();
    
    try {
      // Use simple dynamic import for reliability
      const module = await import(`../translations/${targetLanguage}.js`);
      const loadedTranslations = module.default;
      
      // Validate translation structure
      if (!loadedTranslations || typeof loadedTranslations !== 'object') {
        throw new Error(`Invalid translation structure for ${targetLanguage}`);
      }
      
      // Cache the translations with enhanced metadata
      translationCache[targetLanguage] = {
        ...loadedTranslations,
        _metadata: {
          loadedAt: Date.now(),
          language: targetLanguage,
          keyCount: Object.keys(loadedTranslations).length,
          loadTime: performance.now() - startTime,
          codeSplit: true,
          progressive: true
        }
      };
      
      setTranslations(translationCache[targetLanguage]);
      
      const loadTime = performance.now() - startTime;
      performanceMetrics.translationLoadTime = loadTime;
      
      // Update performance metrics in the performance utility
      if (typeof window !== 'undefined') {
        import('../utils/performance.js').then(({ updateOptimizationMetrics }) => {
          updateOptimizationMetrics({
            translationLoadTime: loadTime,
            translationCacheHit: false
          });
        }).catch(() => {
          // Silently fail if performance utility is not available
        });
      }
      
      if (import.meta.env.DEV) {
        console.log(`🌐 Translation loaded for ${targetLanguage} in ${loadTime.toFixed(2)}ms (optimized)`);
        console.log(`📊 Translation keys loaded: ${Object.keys(loadedTranslations).length}`);
        
        // Performance assessment
        if (loadTime > 500) {
          console.warn(`🐌 Translation loading slower than optimal: ${loadTime.toFixed(2)}ms`);
        } else if (loadTime < 100) {
          console.log(`⚡ Excellent translation loading performance: ${loadTime.toFixed(2)}ms`);
        }
      }
      
      return loadedTranslations;
    } catch (error) {
      const errorTime = performance.now() - startTime;
      console.error(`Failed to load translations for language: ${targetLanguage} after ${errorTime.toFixed(2)}ms`, error);
      
      // Enhanced fallback strategy with critical-only loading
      if (targetLanguage !== DEFAULT_LANGUAGE) {
        try {
          console.log(`🔄 Attempting fallback to ${DEFAULT_LANGUAGE} (critical only)...`);
          
          // Try to load fallback translations
          const fallbackModule = await import(`../translations/${DEFAULT_LANGUAGE}.js`);
          const fallbackTranslations = fallbackModule.default;
          
          // Cache fallback with warning metadata
          translationCache[targetLanguage] = {
            ...fallbackTranslations,
            _metadata: {
              loadedAt: Date.now(),
              language: DEFAULT_LANGUAGE,
              isFallback: true,
              originalLanguage: targetLanguage,
              keyCount: Object.keys(fallbackTranslations).length,
              criticalOnly: true
            }
          };
          
          setTranslations(translationCache[targetLanguage]);
          
          if (import.meta.env.DEV) {
            console.warn(`⚠️ Using ${DEFAULT_LANGUAGE} critical translations as fallback for ${targetLanguage}`);
          }
          
          return fallbackTranslations;
        } catch (fallbackError) {
          console.error('Failed to load fallback translations:', fallbackError);
          
          // Ultimate fallback - empty object with error metadata
          const emptyFallback = {
            _metadata: {
              loadedAt: Date.now(),
              language: 'error',
              isError: true,
              originalLanguage: targetLanguage,
              keyCount: 0
            }
          };
          
          setTranslations(emptyFallback);
          return emptyFallback;
        }
      } else {
        // If default language fails, use empty object
        const emptyFallback = {
          _metadata: {
            loadedAt: Date.now(),
            language: 'error',
            isError: true,
            originalLanguage: targetLanguage,
            keyCount: 0
          }
        };
        
        setTranslations(emptyFallback);
        return emptyFallback;
      }
    }
  }, []);

  // Load translations when language changes
  useEffect(() => {
    const loadLanguageTranslations = async () => {
      setIsLoading(true);
      await loadTranslations(language);
      setIsLoading(false);
    };

    loadLanguageTranslations();
  }, [language, loadTranslations]);

  // Enhanced function to change language with comprehensive persistence and state management
  const setLanguage = useCallback((newLanguage) => {
    // Validate input language
    if (!newLanguage || typeof newLanguage !== 'string') {
      if (import.meta.env.DEV) {
        console.warn(`Invalid language type: ${typeof newLanguage}. Using default: ${DEFAULT_LANGUAGE}`);
      }
      newLanguage = DEFAULT_LANGUAGE;
    }

    // Normalize and validate language code
    const normalizedLanguage = newLanguage.toLowerCase().trim();
    if (!['pt', 'en'].includes(normalizedLanguage)) {
      if (import.meta.env.DEV) {
        console.warn(`Unsupported language: ${newLanguage}. Using default: ${DEFAULT_LANGUAGE}`);
      }
      newLanguage = DEFAULT_LANGUAGE;
    } else {
      newLanguage = normalizedLanguage;
    }

    // Update state immediately for responsive UI
    setLanguageState(prevLanguage => {
      // Check if language is actually changing to avoid unnecessary updates
      if (prevLanguage === newLanguage) {
        if (import.meta.env.DEV) {
          console.log(`🌐 Language already set to ${newLanguage}, skipping update`);
        }
        return prevLanguage;
      }

      if (import.meta.env.DEV) {
        console.log(`🌐 Changing language from ${prevLanguage} to ${newLanguage}`);
      }

      // Only attempt persistence if localStorage is available
      if (storageUtils.isAvailable()) {
        const persistenceSuccess = storageUtils.setItem(LANGUAGE_STORAGE_KEY, newLanguage);
        
        if (!persistenceSuccess) {
          if (import.meta.env.DEV) {
            console.warn('Language preference could not be persisted. Changes will be lost on page reload.');
            const storageInfo = storageUtils.getStorageInfo();
            console.warn('Storage info:', storageInfo);
          }
        } else {
          if (import.meta.env.DEV) {
            console.log(`✅ Language preference '${newLanguage}' saved successfully`);
          }
        }
      } else {
        if (import.meta.env.DEV) {
          console.warn('localStorage not available - language preference will not persist');
        }
      }

      // Clear translation computation cache when language changes for fresh translations
      translationComputationCache.clear();
      
      // Reset performance metrics for the new language
      performanceMetrics.cacheHits = 0;
      performanceMetrics.cacheMisses = 0;
      performanceMetrics.computationTime = 0;
      performanceMetrics.totalTranslations = 0;
      performanceMetrics.averageComputationTime = 0;

      return newLanguage;
    });
  }, []); // Remove language dependency to prevent recreation

  // Memoized translation function with enhanced performance optimizations and bundle tracking
  const t = useCallback((key, fallbackOrParams = key, params = {}) => {
    const startTime = performance.now();
    
    if (!key || typeof key !== 'string') {
      return typeof fallbackOrParams === 'string' ? fallbackOrParams : key;
    }

    // Track translation usage for bundle optimization (only in development)
    if (import.meta.env.DEV) {
      // Lazy load bundle optimizer to avoid affecting production
      import(/* @vite-ignore */ '../utils/bundleOptimizer.js').then(({ trackTranslationUsage }) => {
        trackTranslationUsage(key, language);
      }).catch(() => {
        // Silently fail if bundle optimizer is not available
      });
    }

    // Create optimized cache key for memoization
    const cacheKey = `${language}:${key}:${JSON.stringify(fallbackOrParams)}:${JSON.stringify(params)}`;
    
    // Check computation cache first (performance optimization)
    if (translationComputationCache.has(cacheKey)) {
      performanceMetrics.cacheHits++;
      const cachedResult = translationComputationCache.get(cacheKey);
      
      // Move to end for LRU behavior
      translationComputationCache.delete(cacheKey);
      translationComputationCache.set(cacheKey, cachedResult);
      
      return cachedResult;
    }

    performanceMetrics.cacheMisses++;

    // Handle different parameter patterns
    let fallback = key;
    let interpolationParams = {};
    
    if (typeof fallbackOrParams === 'string') {
      fallback = fallbackOrParams;
      interpolationParams = params;
    } else if (typeof fallbackOrParams === 'object') {
      interpolationParams = fallbackOrParams;
    }

    // Navigate through nested object using dot notation with performance optimization
    const keys = key.split('.');
    let value = translations;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Key not found, cache fallback and return
        translationComputationCache.set(cacheKey, fallback);
        performanceMetrics.totalTranslations++;
        return fallback;
      }
    }

    // If value is not a string, return fallback
    if (typeof value !== 'string') {
      translationComputationCache.set(cacheKey, fallback);
      performanceMetrics.totalTranslations++;
      return fallback;
    }

    // Perform interpolation if parameters are provided (optimized)
    let result = value;
    if (Object.keys(interpolationParams).length > 0) {
      // Use more efficient regex for interpolation
      result = value.replace(/\{(\w+)\}/g, (match, paramKey) => {
        return interpolationParams.hasOwnProperty(paramKey) ? interpolationParams[paramKey] : match;
      });
    }

    // Cache the computed result with LRU management
    translationComputationCache.set(cacheKey, result);
    
    // Enhanced cache size management with performance monitoring
    if (translationComputationCache.size > 1000) {
      // Remove oldest 10% of entries for better performance
      const entriesToRemove = Math.floor(translationComputationCache.size * 0.1);
      const iterator = translationComputationCache.keys();
      
      for (let i = 0; i < entriesToRemove; i++) {
        const oldestKey = iterator.next().value;
        if (oldestKey) {
          translationComputationCache.delete(oldestKey);
        }
      }
    }

    const computationTime = performance.now() - startTime;
    performanceMetrics.computationTime += computationTime;
    performanceMetrics.totalTranslations++;
    performanceMetrics.averageComputationTime = performanceMetrics.computationTime / performanceMetrics.totalTranslations;

    // Log performance warnings in development
    if (import.meta.env.DEV && computationTime > 5) {
      console.warn(`🐌 Slow translation computation for key "${key}": ${computationTime.toFixed(2)}ms`);
    }

    return result;
  }, [language, translations]);

  // Enhanced performance monitoring function with detailed metrics
  const getPerformanceMetrics = useCallback(() => {
    const totalRequests = performanceMetrics.cacheHits + performanceMetrics.cacheMisses;
    const cacheHitRate = totalRequests > 0 ? (performanceMetrics.cacheHits / totalRequests) * 100 : 0;
    
    return {
      ...performanceMetrics,
      cacheSize: translationComputationCache.size,
      cacheHitRate: cacheHitRate,
      totalRequests,
      memoryUsage: {
        translationCacheSize: Object.keys(translationCache).length,
        computationCacheSize: translationComputationCache.size,
        estimatedMemoryKB: Math.round((translationComputationCache.size * 100) / 1024) // Rough estimate
      },
      performance: {
        averageComputationTime: performanceMetrics.averageComputationTime,
        totalComputationTime: performanceMetrics.computationTime,
        translationLoadTime: performanceMetrics.translationLoadTime,
        efficiency: cacheHitRate > 80 ? 'excellent' : cacheHitRate > 60 ? 'good' : cacheHitRate > 40 ? 'fair' : 'poor'
      },
      recommendations: getPerformanceRecommendations(cacheHitRate, performanceMetrics.averageComputationTime)
    };
  }, []);

  // Helper function to provide performance recommendations
  const getPerformanceRecommendations = useCallback((hitRate, avgTime) => {
    const recommendations = [];
    
    if (hitRate < 50) {
      recommendations.push('Consider increasing cache size or reviewing translation key patterns');
    }
    
    if (avgTime > 2) {
      recommendations.push('Translation computation is slow - consider simplifying key structures');
    }
    
    if (translationComputationCache.size > 800) {
      recommendations.push('Cache is near capacity - consider clearing old entries');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Translation performance is optimal');
    }
    
    return recommendations;
  }, []);

  // Clear translation computation cache
  const clearTranslationCache = useCallback(() => {
    translationComputationCache.clear();
    performanceMetrics.cacheHits = 0;
    performanceMetrics.cacheMisses = 0;
    performanceMetrics.computationTime = 0;
    performanceMetrics.totalTranslations = 0;
    performanceMetrics.averageComputationTime = 0;
  }, []);

  // Get storage status and debug information
  const getStorageStatus = useCallback(() => {
    const storageInfo = storageUtils.getStorageInfo();
    const currentLanguage = storageUtils.getItem(LANGUAGE_STORAGE_KEY);
    
    return {
      isAvailable: storageUtils.isAvailable(),
      currentStoredLanguage: currentLanguage,
      activeLanguage: language,
      isLanguagePersisted: currentLanguage === language,
      storageInfo,
      recommendations: getStorageRecommendations(storageInfo)
    };
  }, [language]);

  // Helper function to provide storage recommendations
  const getStorageRecommendations = useCallback((storageInfo) => {
    const recommendations = [];
    
    if (!storageInfo.available) {
      recommendations.push('localStorage is not available - language preferences will not persist');
    } else if (storageInfo.usagePercentage > 90) {
      recommendations.push('localStorage is nearly full - consider clearing old data');
    } else if (storageInfo.usagePercentage > 75) {
      recommendations.push('localStorage usage is high - monitor storage space');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Storage is functioning normally');
    }
    
    return recommendations;
  }, []);

  // Force reload language preference from storage (useful for debugging)
  const reloadLanguageFromStorage = useCallback(() => {
    if (!storageUtils.isAvailable()) {
      if (import.meta.env.DEV) {
        console.warn('Cannot reload from storage - localStorage not available');
      }
      return;
    }

    const savedLanguage = storageUtils.getItem(LANGUAGE_STORAGE_KEY, DEFAULT_LANGUAGE);
    
    // Validate the saved language before applying it
    const validLanguage = ['pt', 'en'].includes(savedLanguage) ? savedLanguage : DEFAULT_LANGUAGE;
    
    if (validLanguage !== language) {
      if (import.meta.env.DEV) {
        console.log(`🔄 Reloading language from storage: ${validLanguage}`);
      }
      setLanguageState(validLanguage);
      
      // If we had to fallback to default, update storage
      if (validLanguage !== savedLanguage) {
        storageUtils.setItem(LANGUAGE_STORAGE_KEY, validLanguage);
      }
    }
  }, [language]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    language,
    setLanguage,
    t,
    isLoading,
    translations,
    getPerformanceMetrics,
    clearTranslationCache,
    getStorageStatus,
    reloadLanguageFromStorage,
    // Storage utilities for advanced usage
    storageUtils: {
      isAvailable: storageUtils.isAvailable,
      getStorageInfo: storageUtils.getStorageInfo
    }
  }), [language, translations, isLoading, t, getPerformanceMetrics, clearTranslationCache, getStorageStatus, reloadLanguageFromStorage, setLanguage]);

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
};

/**
 * Hook to use I18n context
 * @returns {Object} I18n context value
 */
export const useI18n = () => {
  const context = useContext(I18nContext);
  
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  
  return context;
};

/**
 * Higher-order component to wrap components with I18n context
 * @param {React.Component} Component - Component to wrap
 * @returns {React.Component} Wrapped component
 */
export const withI18n = (Component) => {
  return function WrappedComponent(props) {
    return (
      <I18nProvider>
        <Component {...props} />
      </I18nProvider>
    );
  };
};

export default I18nContext;