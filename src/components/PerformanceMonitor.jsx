import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Activity, Clock, Zap, Database } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';

/**
 * Performance Monitor Component
 * Tracks and displays application performance metrics
 */
const PerformanceMonitor = ({ 
  isVisible = false, 
  onToggle,
  initialLoadTime = 0,
  dataLoadTime = 0,
  filterTime = 0,
  renderTime = 0
}) => {
  const { getPerformanceMetrics } = useI18n();
  const [metrics, setMetrics] = useState({
    initialLoad: initialLoadTime,
    dataLoad: dataLoadTime,
    filterTime: filterTime,
    renderTime: renderTime,
    memoryUsage: 0,
    componentRenders: 0
  });
  const [isExpanded, setIsExpanded] = useState(false);

  // Track component renders
  useEffect(() => {
    setMetrics(prev => ({
      ...prev,
      componentRenders: prev.componentRenders + 1
    }));
  }, []); // Empty dependency array to run only once

  // Monitor memory usage
  useEffect(() => {
    const updateMemoryUsage = () => {
      if (performance.memory) {
        setMetrics(prev => ({
          ...prev,
          memoryUsage: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024)
        }));
      }
    };

    updateMemoryUsage();
    const interval = setInterval(updateMemoryUsage, 5000);
    return () => clearInterval(interval);
  }, []);

  // Get I18n performance metrics
  const i18nMetrics = useMemo(() => {
    try {
      return getPerformanceMetrics ? getPerformanceMetrics() : {};
    } catch (error) {
      console.warn('Failed to get I18n performance metrics:', error);
      return {};
    }
  }, [getPerformanceMetrics]);

  // Calculate performance score
  const performanceScore = useMemo(() => {
    const loadScore = Math.max(0, 100 - (metrics.initialLoad / 10));
    const filterScore = Math.max(0, 100 - (metrics.filterTime / 2));
    const renderScore = Math.max(0, 100 - (metrics.renderTime / 5));
    const memoryScore = Math.max(0, 100 - (metrics.memoryUsage / 2));
    
    return Math.round((loadScore + filterScore + renderScore + memoryScore) / 4);
  }, [metrics]);

  // Get performance status color
  const getStatusColor = useCallback((score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  }, []);

  // Format time in milliseconds
  const formatTime = useCallback((time) => {
    if (time < 1) return '<1ms';
    if (time < 1000) return `${Math.round(time)}ms`;
    return `${(time / 1000).toFixed(1)}s`;
  }, []);

  // Format memory size
  const formatMemory = useCallback((mb) => {
    if (mb < 1) return '<1MB';
    return `${mb}MB`;
  }, []);

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-4 right-4 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
        title="Show Performance Monitor"
        aria-label="Show Performance Monitor"
      >
        <Activity className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-80">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-blue-600" />
          <span className="font-medium text-gray-900">Performance Monitor</span>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(performanceScore)}`}>
            {performanceScore}%
          </span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? '−' : '+'}
          </button>
          <button
            onClick={onToggle}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="Close Performance Monitor"
          >
            ×
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="p-3">
        {/* Core Metrics */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3 text-gray-400" />
            <div>
              <div className="text-xs text-gray-500">Initial Load</div>
              <div className="text-sm font-medium">{formatTime(metrics.initialLoad)}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Database className="h-3 w-3 text-gray-400" />
            <div>
              <div className="text-xs text-gray-500">Data Load</div>
              <div className="text-sm font-medium">{formatTime(metrics.dataLoad)}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-3 w-3 text-gray-400" />
            <div>
              <div className="text-xs text-gray-500">Filter Time</div>
              <div className="text-sm font-medium">{formatTime(metrics.filterTime)}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="h-3 w-3 text-gray-400" />
            <div>
              <div className="text-xs text-gray-500">Memory</div>
              <div className="text-sm font-medium">{formatMemory(metrics.memoryUsage)}</div>
            </div>
          </div>
        </div>

        {/* Expanded Metrics */}
        {isExpanded && (
          <div className="border-t border-gray-200 pt-3 space-y-2">
            <div className="text-xs font-medium text-gray-700 mb-2">Detailed Metrics</div>
            
            {/* Render Performance */}
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Render Time:</span>
              <span className="font-medium">{formatTime(metrics.renderTime)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Component Renders:</span>
              <span className="font-medium">{metrics.componentRenders}</span>
            </div>

            {/* I18n Performance */}
            {i18nMetrics.translationLoadTime && (
              <>
                <div className="text-xs font-medium text-gray-700 mt-3 mb-2">I18n Performance</div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Translation Load:</span>
                  <span className="font-medium">{formatTime(i18nMetrics.translationLoadTime)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Cache Hit Rate:</span>
                  <span className="font-medium">{i18nMetrics.cacheHitRate?.toFixed(1) || 0}%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Cache Size:</span>
                  <span className="font-medium">{i18nMetrics.cacheSize || 0}</span>
                </div>
              </>
            )}

            {/* Performance Tips */}
            <div className="text-xs font-medium text-gray-700 mt-3 mb-2">Tips</div>
            <div className="text-xs text-gray-600 space-y-1">
              {performanceScore < 60 && (
                <div className="text-red-600">• Performance is below optimal</div>
              )}
              {metrics.memoryUsage > 100 && (
                <div className="text-yellow-600">• High memory usage detected</div>
              )}
              {metrics.filterTime > 50 && (
                <div className="text-yellow-600">• Consider reducing filter complexity</div>
              )}
              {performanceScore >= 80 && (
                <div className="text-green-600">• Performance is excellent!</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceMonitor;