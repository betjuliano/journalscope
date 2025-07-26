/**
 * Performance Monitoring Utility
 * Comprehensive performance tracking and optimization for JournalScope
 */

// Performance metrics storage
const performanceMetrics = {
  initialLoad: {
    startTime: 0,
    endTime: 0,
    duration: 0,
    dataLoadTime: 0,
    renderTime: 0
  },
  runtime: {
    componentRenders: new Map(),
    memoryUsage: [],
    userInteractions: [],
    searchPerformance: [],
    filterPerformance: []
  },
  optimization: {
    lazyLoadingSavings: 0,
    bundleOptimization: 0,
    cacheHitRate: 0,
    progressiveLoadingEfficiency: 0
  }
};

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  initialLoad: 3000,      // 3 seconds
  componentRender: 16,    // 16ms (60fps)
  searchResponse: 500,    // 500ms
  filterResponse: 200,    // 200ms
  memoryUsage: 100,       // 100MB
  cacheHitRate: 80        // 80%
};

// Performance observers
let performanceObserver;
let memoryMonitorInterval;

/**
 * Initialize performance monitoring
 */
export function initPerformanceMonitoring() {
  if (typeof window === 'undefined') return;
  
  // Mark initial load start
  performanceMetrics.initialLoad.startTime = performance.now();
  
  // Set up performance observer for navigation timing
  if ('PerformanceObserver' in window) {
    try {
      performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach(entry => {
          if (entry.entryType === 'navigation') {
            updateNavigationMetrics(entry);
          } else if (entry.entryType === 'measure') {
            updateMeasureMetrics(entry);
          } else if (entry.entryType === 'paint') {
            updatePaintMetrics(entry);
          }
        });
      });
      
      performanceObserver.observe({ 
        entryTypes: ['navigation', 'measure', 'paint'] 
      });
      
    } catch (error) {
      console.warn('Performance Observer not supported:', error);
    }
  }
  
  // Start memory monitoring
  startMemoryMonitoring();
  
  // Monitor initial load completion
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      recordInitialLoadMetrics();
    });
  } else {
    recordInitialLoadMetrics();
  }
  
  // Monitor page load completion
  window.addEventListener('load', () => {
    setTimeout(() => {
      finalizeInitialLoadMetrics();
    }, 100);
  });
  
  if (import.meta.env.DEV) {
    console.log('🔍 Performance monitoring initialized');
  }
}

/**
 * Update navigation timing metrics
 * @param {PerformanceNavigationTiming} entry - Navigation timing entry
 */
function updateNavigationMetrics(entry) {
  performanceMetrics.initialLoad.duration = entry.loadEventEnd - entry.fetchStart;
  performanceMetrics.initialLoad.dataLoadTime = entry.responseEnd - entry.requestStart;
  performanceMetrics.initialLoad.renderTime = entry.loadEventEnd - entry.responseEnd;
  
  if (import.meta.env.DEV) {
    console.log('📊 Navigation metrics updated:', {
      totalDuration: performanceMetrics.initialLoad.duration,
      dataLoad: performanceMetrics.initialLoad.dataLoadTime,
      render: performanceMetrics.initialLoad.renderTime
    });
  }
}

/**
 * Update custom measure metrics
 * @param {PerformanceMeasure} entry - Performance measure entry
 */
function updateMeasureMetrics(entry) {
  if (entry.name.startsWith('component-render-')) {
    const componentName = entry.name.replace('component-render-', '');
    const renders = performanceMetrics.runtime.componentRenders.get(componentName) || [];
    renders.push({
      duration: entry.duration,
      timestamp: entry.startTime
    });
    performanceMetrics.runtime.componentRenders.set(componentName, renders);
  }
}

/**
 * Update paint timing metrics
 * @param {PerformancePaintTiming} entry - Paint timing entry
 */
function updatePaintMetrics(entry) {
  if (import.meta.env.DEV) {
    console.log(`🎨 ${entry.name}: ${entry.startTime.toFixed(2)}ms`);
  }
}

/**
 * Record initial load metrics
 */
function recordInitialLoadMetrics() {
  const now = performance.now();
  performanceMetrics.initialLoad.endTime = now;
  
  if (performanceMetrics.initialLoad.startTime > 0) {
    performanceMetrics.initialLoad.duration = now - performanceMetrics.initialLoad.startTime;
  }
}

/**
 * Finalize initial load metrics
 */
function finalizeInitialLoadMetrics() {
  const navigation = performance.getEntriesByType('navigation')[0];
  
  if (navigation) {
    performanceMetrics.initialLoad.duration = navigation.loadEventEnd;
    performanceMetrics.initialLoad.dataLoadTime = navigation.responseEnd - navigation.requestStart;
    performanceMetrics.initialLoad.renderTime = navigation.loadEventEnd - navigation.responseEnd;
  }
  
  // Analyze initial load performance
  analyzeInitialLoadPerformance();
}

/**
 * Analyze initial load performance and provide recommendations
 */
function analyzeInitialLoadPerformance() {
  const { duration } = performanceMetrics.initialLoad;
  const recommendations = [];
  
  if (duration > PERFORMANCE_THRESHOLDS.initialLoad) {
    recommendations.push('Initial load time exceeds threshold - consider code splitting');
  }
  
  if (performanceMetrics.initialLoad.dataLoadTime > 2000) {
    recommendations.push('Data loading is slow - consider caching or optimization');
  }
  
  if (performanceMetrics.initialLoad.renderTime > 1000) {
    recommendations.push('Rendering is slow - consider lazy loading or virtualization');
  }
  
  if (import.meta.env.DEV && recommendations.length > 0) {
    console.group('🔍 Performance Analysis');
    console.log(`⏱️ Initial load: ${duration.toFixed(2)}ms`);
    recommendations.forEach(rec => console.warn(`⚠️ ${rec}`));
    console.groupEnd();
  }
}

/**
 * Start memory monitoring
 */
function startMemoryMonitoring() {
  if (!performance.memory) return;
  
  const recordMemoryUsage = () => {
    const memoryInfo = {
      used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
      total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
      limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024),
      timestamp: Date.now()
    };
    
    performanceMetrics.runtime.memoryUsage.push(memoryInfo);
    
    // Keep only last 100 entries
    if (performanceMetrics.runtime.memoryUsage.length > 100) {
      performanceMetrics.runtime.memoryUsage.shift();
    }
    
    // Check for memory leaks
    if (memoryInfo.used > PERFORMANCE_THRESHOLDS.memoryUsage) {
      console.warn(`💾 High memory usage detected: ${memoryInfo.used}MB`);
    }
  };
  
  // Record initial memory usage
  recordMemoryUsage();
  
  // Monitor memory every 10 seconds
  memoryMonitorInterval = setInterval(recordMemoryUsage, 10000);
}

/**
 * Track component render performance
 * @param {string} componentName - Component name
 * @param {number} renderTime - Render time in milliseconds
 */
export function trackComponentRender(componentName, renderTime) {
  const renders = performanceMetrics.runtime.componentRenders.get(componentName) || [];
  renders.push({
    duration: renderTime,
    timestamp: performance.now()
  });
  
  // Keep only last 50 renders per component
  if (renders.length > 50) {
    renders.shift();
  }
  
  performanceMetrics.runtime.componentRenders.set(componentName, renders);
  
  // Warn about slow renders
  if (renderTime > PERFORMANCE_THRESHOLDS.componentRender && import.meta.env.DEV) {
    console.warn(`🐌 Slow render detected: ${componentName} took ${renderTime.toFixed(2)}ms`);
  }
}

/**
 * Track user interaction performance
 * @param {string} interaction - Interaction type
 * @param {number} responseTime - Response time in milliseconds
 * @param {Object} metadata - Additional metadata
 */
export function trackUserInteraction(interaction, responseTime, metadata = {}) {
  const interactionData = {
    type: interaction,
    responseTime,
    timestamp: Date.now(),
    ...metadata
  };
  
  performanceMetrics.runtime.userInteractions.push(interactionData);
  
  // Keep only last 100 interactions
  if (performanceMetrics.runtime.userInteractions.length > 100) {
    performanceMetrics.runtime.userInteractions.shift();
  }
  
  // Check response time thresholds
  let threshold;
  if (interaction === 'search') {
    threshold = PERFORMANCE_THRESHOLDS.searchResponse;
    performanceMetrics.runtime.searchPerformance.push(interactionData);
  } else if (interaction === 'filter') {
    threshold = PERFORMANCE_THRESHOLDS.filterResponse;
    performanceMetrics.runtime.filterPerformance.push(interactionData);
  }
  
  if (threshold && responseTime > threshold && import.meta.env.DEV) {
    console.warn(`⚠️ Slow ${interaction} response: ${responseTime.toFixed(2)}ms (threshold: ${threshold}ms)`);
  }
}

/**
 * Record render operation performance (alias for trackComponentRender)
 * @param {string} componentName - Component name
 * @param {number} renderTime - Render time in milliseconds
 */
export function recordRenderOperation(componentName, renderTime) {
  return trackComponentRender(componentName, renderTime);
}

/**
 * Record filter operation performance
 * @param {number} filterTime - Filter operation time in milliseconds
 * @param {number} itemCount - Number of items filtered
 * @param {Object} metadata - Additional metadata
 */
export function recordFilterOperation(filterTime, itemCount, metadata = {}) {
  return trackUserInteraction('filter', filterTime, {
    itemCount,
    ...metadata
  });
}

/**
 * Get performance metrics (alias for getPerformanceReport)
 * @returns {Object} Performance metrics
 */
export function getPerformanceMetrics() {
  return getPerformanceReport();
}

/**
 * Get comprehensive performance report
 * @returns {Object} Performance report
 */
export function getPerformanceReport() {
  const currentMemory = performance.memory ? {
    used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
    total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
    limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
  } : null;
  
  // Calculate average render times
  const componentRenderAverages = new Map();
  performanceMetrics.runtime.componentRenders.forEach((renders, componentName) => {
    const avgRenderTime = renders.reduce((sum, render) => sum + render.duration, 0) / renders.length;
    componentRenderAverages.set(componentName, avgRenderTime);
  });
  
  // Calculate interaction averages
  const searchAverage = calculateInteractionAverage('search');
  const filterAverage = calculateInteractionAverage('filter');
  
  // Generate performance score
  const performanceScore = calculatePerformanceScore();
  
  return {
    initialLoad: performanceMetrics.initialLoad,
    runtime: {
      componentRenderAverages: Object.fromEntries(componentRenderAverages),
      memoryUsage: currentMemory,
      memoryHistory: performanceMetrics.runtime.memoryUsage.slice(-10), // Last 10 entries
      searchPerformance: {
        average: searchAverage,
        recent: performanceMetrics.runtime.searchPerformance.slice(-10)
      },
      filterPerformance: {
        average: filterAverage,
        recent: performanceMetrics.runtime.filterPerformance.slice(-10)
      }
    },
    optimization: performanceMetrics.optimization,
    score: performanceScore,
    recommendations: generatePerformanceRecommendations(),
    timestamp: Date.now()
  };
}

/**
 * Calculate average interaction time
 * @param {string} interactionType - Type of interaction
 * @returns {number} Average response time
 */
function calculateInteractionAverage(interactionType) {
  const interactions = performanceMetrics.runtime.userInteractions
    .filter(interaction => interaction.type === interactionType);
  
  if (interactions.length === 0) return 0;
  
  return interactions.reduce((sum, interaction) => sum + interaction.responseTime, 0) / interactions.length;
}

/**
 * Calculate overall performance score (0-100)
 * @returns {number} Performance score
 */
function calculatePerformanceScore() {
  let score = 100;
  
  // Initial load penalty
  if (performanceMetrics.initialLoad.duration > PERFORMANCE_THRESHOLDS.initialLoad) {
    score -= 20;
  } else if (performanceMetrics.initialLoad.duration > PERFORMANCE_THRESHOLDS.initialLoad * 0.7) {
    score -= 10;
  }
  
  // Memory usage penalty
  const currentMemory = performance.memory ? 
    Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) : 0;
  
  if (currentMemory > PERFORMANCE_THRESHOLDS.memoryUsage) {
    score -= 15;
  } else if (currentMemory > PERFORMANCE_THRESHOLDS.memoryUsage * 0.8) {
    score -= 8;
  }
  
  // Interaction performance penalty
  const searchAverage = calculateInteractionAverage('search');
  const filterAverage = calculateInteractionAverage('filter');
  
  if (searchAverage > PERFORMANCE_THRESHOLDS.searchResponse) {
    score -= 10;
  }
  
  if (filterAverage > PERFORMANCE_THRESHOLDS.filterResponse) {
    score -= 10;
  }
  
  // Optimization bonus
  if (performanceMetrics.optimization.cacheHitRate > PERFORMANCE_THRESHOLDS.cacheHitRate) {
    score += 5;
  }
  
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Generate performance recommendations
 * @returns {Array<string>} Performance recommendations
 */
function generatePerformanceRecommendations() {
  const recommendations = [];
  
  // Initial load recommendations
  if (performanceMetrics.initialLoad.duration > PERFORMANCE_THRESHOLDS.initialLoad) {
    recommendations.push('Consider implementing code splitting to reduce initial bundle size');
  }
  
  // Memory recommendations
  const currentMemory = performance.memory ? 
    Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) : 0;
  
  if (currentMemory > PERFORMANCE_THRESHOLDS.memoryUsage) {
    recommendations.push('High memory usage detected - check for memory leaks');
  }
  
  // Component render recommendations
  const slowComponents = [];
  performanceMetrics.runtime.componentRenders.forEach((renders, componentName) => {
    const avgRenderTime = renders.reduce((sum, render) => sum + render.duration, 0) / renders.length;
    if (avgRenderTime > PERFORMANCE_THRESHOLDS.componentRender) {
      slowComponents.push(componentName);
    }
  });
  
  if (slowComponents.length > 0) {
    recommendations.push(`Optimize slow components: ${slowComponents.join(', ')}`);
  }
  
  // Interaction recommendations
  const searchAverage = calculateInteractionAverage('search');
  const filterAverage = calculateInteractionAverage('filter');
  
  if (searchAverage > PERFORMANCE_THRESHOLDS.searchResponse) {
    recommendations.push('Search performance is slow - consider debouncing or optimization');
  }
  
  if (filterAverage > PERFORMANCE_THRESHOLDS.filterResponse) {
    recommendations.push('Filter performance is slow - consider memoization or virtualization');
  }
  
  // Cache recommendations
  if (performanceMetrics.optimization.cacheHitRate < PERFORMANCE_THRESHOLDS.cacheHitRate) {
    recommendations.push('Low cache hit rate - review caching strategy');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Performance is optimal - no recommendations at this time');
  }
  
  return recommendations;
}

/**
 * Update optimization metrics
 * @param {Object} optimizationData - Optimization data
 */
export function updateOptimizationMetrics(optimizationData) {
  Object.assign(performanceMetrics.optimization, optimizationData);
}

/**
 * Clear performance metrics
 */
export function clearPerformanceMetrics() {
  // Reset metrics but keep structure
  performanceMetrics.initialLoad = {
    startTime: 0,
    endTime: 0,
    duration: 0,
    dataLoadTime: 0,
    renderTime: 0
  };
  
  performanceMetrics.runtime.componentRenders.clear();
  performanceMetrics.runtime.memoryUsage = [];
  performanceMetrics.runtime.userInteractions = [];
  performanceMetrics.runtime.searchPerformance = [];
  performanceMetrics.runtime.filterPerformance = [];
  
  performanceMetrics.optimization = {
    lazyLoadingSavings: 0,
    bundleOptimization: 0,
    cacheHitRate: 0,
    progressiveLoadingEfficiency: 0
  };
  
  if (import.meta.env.DEV) {
    console.log('🧹 Performance metrics cleared');
  }
}

/**
 * Stop performance monitoring
 */
export function stopPerformanceMonitoring() {
  if (performanceObserver) {
    performanceObserver.disconnect();
    performanceObserver = null;
  }
  
  if (memoryMonitorInterval) {
    clearInterval(memoryMonitorInterval);
    memoryMonitorInterval = null;
  }
  
  if (import.meta.env.DEV) {
    console.log('🔍 Performance monitoring stopped');
  }
}

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    stopPerformanceMonitoring();
  });
}

// Export for debugging in development
if (import.meta.env.DEV) {
  window.JOURNALSCOPE_PERFORMANCE_DEBUG = {
    getPerformanceReport,
    clearPerformanceMetrics,
    trackComponentRender,
    trackUserInteraction,
    updateOptimizationMetrics,
    metrics: performanceMetrics
  };
}