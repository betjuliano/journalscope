/**
 * Performance Optimization Hook
 * Provides performance monitoring and optimization utilities for React components
 */

import { useEffect, useRef, useCallback, useMemo } from 'react';

// Performance tracking for components
const componentMetrics = new Map();
const renderCounts = new Map();

/**
 * Performance optimization hook for React components
 * @param {string} componentName - Name of the component
 * @param {Object} options - Optimization options
 * @returns {Object} Performance utilities
 */
export function usePerformanceOptimization(componentName, options = {}) {
  const {
    trackRenders = false,
    trackMemory = false,
    enableLazyLoading = true,
    debounceTime = 300,
    memoizeDependencies = [],
    onSlowRender = null
  } = options;
  
  const renderStartTime = useRef(0);
  const renderCount = useRef(0);
  const lastRenderTime = useRef(0);
  const memorySnapshots = useRef([]);
  
  // Track render start
  useEffect(() => {
    if (trackRenders) {
      renderStartTime.current = performance.now();
      renderCount.current += 1;
      
      // Update global render count
      const currentCount = renderCounts.get(componentName) || 0;
      renderCounts.set(componentName, currentCount + 1);
    }
  });
  
  // Track render completion
  useEffect(() => {
    if (trackRenders && renderStartTime.current > 0) {
      const renderTime = performance.now() - renderStartTime.current;
      lastRenderTime.current = renderTime;
      
      // Update component metrics
      const metrics = componentMetrics.get(componentName) || {
        totalRenders: 0,
        totalRenderTime: 0,
        averageRenderTime: 0,
        slowRenders: 0,
        fastRenders: 0
      };
      
      metrics.totalRenders += 1;
      metrics.totalRenderTime += renderTime;
      metrics.averageRenderTime = metrics.totalRenderTime / metrics.totalRenders;
      
      if (renderTime > 16) { // Slower than 60fps
        metrics.slowRenders += 1;
        
        // Call slow render callback
        if (onSlowRender && typeof onSlowRender === 'function') {
          onSlowRender(renderTime, componentName);
        }
        
        if (import.meta.env.DEV && renderTime > 50) {
          console.warn(`🐌 Slow render in ${componentName}: ${renderTime.toFixed(2)}ms`);
        }
      } else {
        metrics.fastRenders += 1;
      }
      
      componentMetrics.set(componentName, metrics);
      
      // Track render performance in global performance utility
      if (typeof window !== 'undefined') {
        import('../utils/performance.js').then(({ trackComponentRender }) => {
          trackComponentRender(componentName, renderTime);
        }).catch(() => {
          // Silently fail if performance utility is not available
        });
      }
      
      renderStartTime.current = 0;
    }
  });
  
  // Track memory usage
  useEffect(() => {
    if (trackMemory && performance.memory) {
      const memorySnapshot = {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
        timestamp: Date.now(),
        component: componentName
      };
      
      memorySnapshots.current.push(memorySnapshot);
      
      // Keep only last 10 snapshots
      if (memorySnapshots.current.length > 10) {
        memorySnapshots.current.shift();
      }
      
      // Check for memory leaks
      if (memorySnapshots.current.length >= 3) {
        const recent = memorySnapshots.current.slice(-3);
        const memoryIncrease = recent[2].used - recent[0].used;
        
        if (memoryIncrease > 10) { // More than 10MB increase
          console.warn(`💾 Potential memory leak in ${componentName}: +${memoryIncrease}MB`);
        }
      }
    }
  });
  
  // Debounced function creator
  const createDebouncedFunction = useCallback((func, delay = debounceTime) => {
    let timeoutId;
    
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  }, [debounceTime]);
  
  // Memoized value creator with performance tracking
  const createMemoizedValue = useCallback((computeValue, dependencies) => {
    return useMemo(() => {
      const startTime = performance.now();
      const value = computeValue();
      const computeTime = performance.now() - startTime;
      
      if (import.meta.env.DEV && computeTime > 10) {
        console.warn(`🐌 Slow memoized computation in ${componentName}: ${computeTime.toFixed(2)}ms`);
      }
      
      return value;
    }, dependencies);
  }, [componentName]);
  
  // Lazy component loader
  const loadComponentLazily = useCallback(async (componentPath) => {
    if (!enableLazyLoading) {
      return import(/* @vite-ignore */ componentPath);
    }
    
    try {
      const { loadComponentOnDemand } = await import('../utils/progressiveLoader.js');
      return loadComponentOnDemand(componentPath);
    } catch (error) {
      // Fallback to regular import
      return import(/* @vite-ignore */ componentPath);
    }
  }, [enableLazyLoading]);
  
  // Performance report for this component
  const getPerformanceReport = useCallback(() => {
    const metrics = componentMetrics.get(componentName) || {};
    const currentRenderCount = renderCounts.get(componentName) || 0;
    
    return {
      componentName,
      renderCount: currentRenderCount,
      lastRenderTime: lastRenderTime.current,
      metrics,
      memorySnapshots: memorySnapshots.current.slice(),
      recommendations: generateRecommendations(metrics, componentName)
    };
  }, [componentName]);
  
  // Memory usage tracker
  const trackMemoryUsage = useCallback(() => {
    if (!performance.memory) return null;
    
    return {
      used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
      total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
      limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024),
      component: componentName,
      timestamp: Date.now()
    };
  }, [componentName]);
  
  // Optimization utilities
  const optimizationUtils = useMemo(() => ({
    debounce: createDebouncedFunction,
    memoize: createMemoizedValue,
    lazyLoad: loadComponentLazily,
    trackMemory: trackMemoryUsage,
    getReport: getPerformanceReport
  }), [createDebouncedFunction, createMemoizedValue, loadComponentLazily, trackMemoryUsage, getPerformanceReport]);
  
  return optimizationUtils;
}

/**
 * Generate performance recommendations for a component
 * @param {Object} metrics - Component metrics
 * @param {string} componentName - Component name
 * @returns {Array<string>} Recommendations
 */
function generateRecommendations(metrics, componentName) {
  const recommendations = [];
  
  if (!metrics.totalRenders) {
    return ['No performance data available yet'];
  }
  
  // Render performance recommendations
  if (metrics.averageRenderTime > 16) {
    recommendations.push('Consider optimizing render performance - average render time exceeds 16ms');
  }
  
  if (metrics.slowRenders > metrics.fastRenders) {
    recommendations.push('High number of slow renders detected - review component complexity');
  }
  
  if (metrics.totalRenders > 100 && metrics.averageRenderTime > 5) {
    recommendations.push('Frequent re-renders with moderate render time - consider memoization');
  }
  
  // Component-specific recommendations
  if (componentName.includes('Table') && metrics.averageRenderTime > 20) {
    recommendations.push('Table component is slow - consider virtualization for large datasets');
  }
  
  if (componentName.includes('Search') && metrics.averageRenderTime > 10) {
    recommendations.push('Search component is slow - consider debouncing user input');
  }
  
  if (componentName.includes('Filter') && metrics.totalRenders > 50) {
    recommendations.push('Filter component re-renders frequently - consider optimizing filter logic');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Component performance is optimal');
  }
  
  return recommendations;
}

/**
 * Get global component performance metrics
 * @returns {Object} Global metrics
 */
export function getGlobalComponentMetrics() {
  const globalMetrics = {
    totalComponents: componentMetrics.size,
    totalRenders: 0,
    averageRenderTime: 0,
    slowComponents: [],
    fastComponents: [],
    recommendations: []
  };
  
  let totalRenderTime = 0;
  let totalRenderCount = 0;
  
  componentMetrics.forEach((metrics, componentName) => {
    totalRenderTime += metrics.totalRenderTime;
    totalRenderCount += metrics.totalRenders;
    
    if (metrics.averageRenderTime > 16) {
      globalMetrics.slowComponents.push({
        name: componentName,
        averageRenderTime: metrics.averageRenderTime,
        slowRenders: metrics.slowRenders
      });
    } else {
      globalMetrics.fastComponents.push({
        name: componentName,
        averageRenderTime: metrics.averageRenderTime,
        fastRenders: metrics.fastRenders
      });
    }
  });
  
  globalMetrics.totalRenders = totalRenderCount;
  globalMetrics.averageRenderTime = totalRenderCount > 0 ? totalRenderTime / totalRenderCount : 0;
  
  // Generate global recommendations
  if (globalMetrics.slowComponents.length > globalMetrics.fastComponents.length) {
    globalMetrics.recommendations.push('Many components have slow render times - consider global optimization');
  }
  
  if (globalMetrics.averageRenderTime > 10) {
    globalMetrics.recommendations.push('Overall render performance is slow - review component architecture');
  }
  
  if (globalMetrics.totalRenders > 1000) {
    globalMetrics.recommendations.push('High number of total renders - consider reducing unnecessary re-renders');
  }
  
  return globalMetrics;
}

/**
 * Clear component performance metrics
 * @param {string} componentName - Component name (optional, clears all if not provided)
 */
export function clearComponentMetrics(componentName) {
  if (componentName) {
    componentMetrics.delete(componentName);
    renderCounts.delete(componentName);
  } else {
    componentMetrics.clear();
    renderCounts.clear();
  }
  
  if (import.meta.env.DEV) {
    console.log(`🧹 Component metrics cleared${componentName ? ` for ${componentName}` : ''}`);
  }
}

// Export for debugging in development
if (import.meta.env.DEV) {
  window.JOURNALSCOPE_COMPONENT_DEBUG = {
    getGlobalComponentMetrics,
    clearComponentMetrics,
    componentMetrics: () => Object.fromEntries(componentMetrics),
    renderCounts: () => Object.fromEntries(renderCounts)
  };
}