import { useState, useEffect, useCallback, useRef } from 'react';
import { getPerformanceMetrics, recordRenderOperation, recordFilterOperation } from '../utils/performance';

/**
 * Custom hook for performance monitoring
 * Tracks component render times, filter operations, and memory usage
 */
const usePerformanceMonitoring = (componentName = 'Unknown') => {
  const [performanceData, setPerformanceData] = useState({
    renderTime: 0,
    filterTime: 0,
    memoryUsage: 0,
    renderCount: 0,
    lastUpdate: Date.now()
  });

  const renderStartTime = useRef(null);
  const filterStartTime = useRef(null);
  const mountTime = useRef(Date.now());

  // Track component render performance
  const startRenderTracking = useCallback(() => {
    renderStartTime.current = performance.now();
  }, []);

  const endRenderTracking = useCallback(() => {
    if (renderStartTime.current) {
      const renderTime = performance.now() - renderStartTime.current;
      recordRenderOperation(renderTime, componentName);
      
      setPerformanceData(prev => ({
        ...prev,
        renderTime,
        renderCount: prev.renderCount + 1,
        lastUpdate: Date.now()
      }));
      
      renderStartTime.current = null;
    }
  }, [componentName]);

  // Track filter operation performance
  const startFilterTracking = useCallback(() => {
    filterStartTime.current = performance.now();
  }, []);

  const endFilterTracking = useCallback((itemCount = 0) => {
    if (filterStartTime.current) {
      const filterTime = performance.now() - filterStartTime.current;
      recordFilterOperation(filterTime, itemCount);
      
      setPerformanceData(prev => ({
        ...prev,
        filterTime,
        lastUpdate: Date.now()
      }));
      
      filterStartTime.current = null;
    }
  }, []);

  // Monitor memory usage
  const updateMemoryUsage = useCallback(() => {
    if (performance.memory) {
      const memoryUsage = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
      setPerformanceData(prev => ({
        ...prev,
        memoryUsage,
        lastUpdate: Date.now()
      }));
    }
  }, []);

  // Get comprehensive performance metrics
  const getComprehensiveMetrics = useCallback(() => {
    const systemMetrics = getPerformanceMetrics();
    const componentUptime = Date.now() - mountTime.current;
    
    return {
      component: {
        name: componentName,
        uptime: componentUptime,
        ...performanceData
      },
      system: systemMetrics,
      recommendations: generatePerformanceRecommendations(performanceData, systemMetrics)
    };
  }, [componentName, performanceData]);

  // Generate performance recommendations
  const generatePerformanceRecommendations = useCallback((componentData, systemData) => {
    const recommendations = [];
    
    if (componentData.renderTime > 50) {
      recommendations.push({
        type: 'warning',
        message: `Slow render detected (${componentData.renderTime.toFixed(2)}ms). Consider memoization.`,
        action: 'Add React.memo or useMemo to expensive calculations'
      });
    }
    
    if (componentData.filterTime > 20) {
      recommendations.push({
        type: 'warning',
        message: `Slow filter operation (${componentData.filterTime.toFixed(2)}ms). Consider optimization.`,
        action: 'Implement debouncing or optimize filter logic'
      });
    }
    
    if (componentData.memoryUsage > 100) {
      recommendations.push({
        type: 'error',
        message: `High memory usage (${componentData.memoryUsage}MB). Memory leak possible.`,
        action: 'Check for memory leaks and optimize data structures'
      });
    }
    
    if (systemData.cacheHitRate < 50) {
      recommendations.push({
        type: 'info',
        message: `Low cache hit rate (${systemData.cacheHitRate.toFixed(1)}%). Cache optimization needed.`,
        action: 'Review caching strategy and increase cache size if needed'
      });
    }
    
    if (recommendations.length === 0) {
      recommendations.push({
        type: 'success',
        message: 'Performance is optimal',
        action: 'No action needed'
      });
    }
    
    return recommendations;
  }, []);

  // Automatic memory monitoring
  useEffect(() => {
    const interval = setInterval(updateMemoryUsage, 5000);
    return () => clearInterval(interval);
  }, [updateMemoryUsage]);

  // Performance warning system
  useEffect(() => {
    if (import.meta.env.DEV) {
      if (performanceData.renderTime > 100) {
        console.warn(`🐌 ${componentName}: Slow render detected (${performanceData.renderTime.toFixed(2)}ms)`);
      }
      
      if (performanceData.filterTime > 50) {
        console.warn(`🐌 ${componentName}: Slow filter operation (${performanceData.filterTime.toFixed(2)}ms)`);
      }
      
      if (performanceData.memoryUsage > 150) {
        console.error(`💾 ${componentName}: High memory usage (${performanceData.memoryUsage}MB)`);
      }
    }
  }, [componentName, performanceData]);

  return {
    performanceData,
    startRenderTracking,
    endRenderTracking,
    startFilterTracking,
    endFilterTracking,
    updateMemoryUsage,
    getComprehensiveMetrics
  };
};

/**
 * Higher-order component for automatic performance monitoring
 */
export const withPerformanceMonitoring = (WrappedComponent, componentName) => {
  return function PerformanceMonitoredComponent(props) {
    const {
      startRenderTracking,
      endRenderTracking,
      performanceData
    } = usePerformanceMonitoring(componentName);

    useEffect(() => {
      startRenderTracking();
      return () => {
        endRenderTracking();
      };
    });

    // Show performance indicator in development
    const showPerformanceIndicator = import.meta.env.DEV && performanceData.renderTime > 0;

    return (
      <>
        <WrappedComponent {...props} />
        {showPerformanceIndicator && (
          <div 
            className={`performance-indicator ${
              performanceData.renderTime < 16 ? 'good' : 
              performanceData.renderTime < 50 ? 'warning' : 'error'
            }`}
          >
            {componentName}: {performanceData.renderTime.toFixed(1)}ms
          </div>
        )}
      </>
    );
  };
};

/**
 * Hook for measuring async operations
 */
export const useAsyncPerformanceTracking = () => {
  const [operations, setOperations] = useState(new Map());

  const startOperation = useCallback((operationId) => {
    setOperations(prev => new Map(prev.set(operationId, {
      startTime: performance.now(),
      status: 'running'
    })));
  }, []);

  const endOperation = useCallback((operationId, metadata = {}) => {
    setOperations(prev => {
      const operation = prev.get(operationId);
      if (operation) {
        const duration = performance.now() - operation.startTime;
        const updatedMap = new Map(prev);
        updatedMap.set(operationId, {
          ...operation,
          duration,
          status: 'completed',
          metadata,
          completedAt: Date.now()
        });
        
        // Log slow operations in development
        if (import.meta.env.DEV && duration > 1000) {
          console.warn(`🐌 Slow async operation: ${operationId} took ${duration.toFixed(2)}ms`);
        }
        
        return updatedMap;
      }
      return prev;
    });
  }, []);

  const failOperation = useCallback((operationId, error) => {
    setOperations(prev => {
      const operation = prev.get(operationId);
      if (operation) {
        const duration = performance.now() - operation.startTime;
        const updatedMap = new Map(prev);
        updatedMap.set(operationId, {
          ...operation,
          duration,
          status: 'failed',
          error: error.message,
          failedAt: Date.now()
        });
        return updatedMap;
      }
      return prev;
    });
  }, []);

  const getOperationMetrics = useCallback(() => {
    const operationArray = Array.from(operations.values());
    const completed = operationArray.filter(op => op.status === 'completed');
    const failed = operationArray.filter(op => op.status === 'failed');
    const running = operationArray.filter(op => op.status === 'running');
    
    const averageDuration = completed.length > 0 
      ? completed.reduce((sum, op) => sum + op.duration, 0) / completed.length 
      : 0;
    
    return {
      total: operationArray.length,
      completed: completed.length,
      failed: failed.length,
      running: running.length,
      averageDuration,
      successRate: operationArray.length > 0 ? (completed.length / operationArray.length) * 100 : 0
    };
  }, [operations]);

  return {
    startOperation,
    endOperation,
    failOperation,
    getOperationMetrics,
    operations: Array.from(operations.entries())
  };
};

export default usePerformanceMonitoring;