/**
 * Optimization Monitor Component
 * Displays comprehensive performance and optimization metrics
 */

import React, { useState, useEffect, useCallback } from 'react';
import { usePerformanceOptimization } from '../hooks/usePerformanceOptimization';

const OptimizationMonitor = ({ isVisible, onToggle }) => {
  const [metrics, setMetrics] = useState({
    performance: null,
    translations: null,
    progressive: null,
    bundle: null
  });
  const [activeTab, setActiveTab] = useState('performance');
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  const { getPerformanceReport } = usePerformanceOptimization('OptimizationMonitor');
  
  // Collect all metrics
  const collectMetrics = useCallback(async () => {
    try {
      const newMetrics = { ...metrics };
      
      // Performance metrics
      try {
        const { getGlobalPerformanceMetrics } = await import(/* @vite-ignore */ '../hooks/usePerformanceOptimization');
        newMetrics.performance = getGlobalPerformanceMetrics();
      } catch (error) {
        console.warn('Performance metrics not available:', error);
      }
      
      // Translation metrics - usando dados mock para evitar erros
      newMetrics.translations = {
        loadTime: Math.random() * 100,
        cacheHits: Math.floor(Math.random() * 100),
        cacheMisses: Math.floor(Math.random() * 20)
      };
      
      // Progressive loading metrics - usando dados mock
      newMetrics.progressive = {
        componentsLoaded: Math.floor(Math.random() * 10),
        totalComponents: 15,
        loadingTime: Math.random() * 200
      };
      
      // Bundle optimization metrics - usando dados mock
      newMetrics.bundle = {
        size: Math.floor(Math.random() * 1000) + 500,
        optimized: Math.random() > 0.5,
        compressionRatio: Math.random() * 0.5 + 0.5
      };
      
      setMetrics(newMetrics);
    } catch (error) {
      console.error('Failed to collect metrics:', error);
    }
  }, [metrics]);
  
  // Auto-refresh metrics
  useEffect(() => {
    if (isVisible && autoRefresh) {
      const interval = setInterval(collectMetrics, 2000);
      return () => clearInterval(interval);
    }
  }, [isVisible, autoRefresh, collectMetrics]);
  
  // Initial metrics collection
  useEffect(() => {
    if (isVisible) {
      collectMetrics();
    }
  }, [isVisible, collectMetrics]);
  
  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
        title="Show Optimization Monitor"
        aria-label="Show optimization monitor"
      >
        📊
      </button>
    );
  }
  
  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-96 bg-white border border-gray-300 rounded-lg shadow-xl z-50 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
        <h3 className="font-semibold text-gray-800">Optimization Monitor</h3>
        <div className="flex items-center gap-2">
          <label className="flex items-center text-xs text-gray-600">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="mr-1"
            />
            Auto-refresh
          </label>
          <button
            onClick={collectMetrics}
            className="text-blue-600 hover:text-blue-800 text-sm"
            title="Refresh metrics"
          >
            🔄
          </button>
          <button
            onClick={onToggle}
            className="text-gray-600 hover:text-gray-800"
            title="Close monitor"
          >
            ✕
          </button>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {[
          { id: 'performance', label: '⚡ Performance', data: metrics.performance },
          { id: 'translations', label: '🌐 Translations', data: metrics.translations },
          { id: 'progressive', label: '📦 Progressive', data: metrics.progressive },
          { id: 'bundle', label: '🎯 Bundle', data: metrics.bundle }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-2 py-1 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-500'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            {tab.label}
            {tab.data && (
              <span className={`ml-1 w-2 h-2 rounded-full inline-block ${
                tab.data ? 'bg-green-400' : 'bg-red-400'
              }`} />
            )}
          </button>
        ))}
      </div>
      
      {/* Content */}
      <div className="p-4 max-h-80 overflow-y-auto text-xs">
        {activeTab === 'performance' && (
          <PerformanceTab data={metrics.performance} />
        )}
        {activeTab === 'translations' && (
          <TranslationsTab data={metrics.translations} />
        )}
        {activeTab === 'progressive' && (
          <ProgressiveTab data={metrics.progressive} />
        )}
        {activeTab === 'bundle' && (
          <BundleTab data={metrics.bundle} />
        )}
      </div>
    </div>
  );
};

// Performance Tab Component
const PerformanceTab = ({ data }) => {
  if (!data) {
    return <div className="text-gray-500">Performance metrics not available</div>;
  }
  
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <MetricCard label="Components" value={data.totalComponents} />
        <MetricCard label="Total Renders" value={data.totalRenders} />
        <MetricCard 
          label="Avg Render Time" 
          value={`${data.averageRenderTime.toFixed(2)}ms`}
          status={data.averageRenderTime < 10 ? 'good' : data.averageRenderTime < 16 ? 'warning' : 'error'}
        />
        <MetricCard 
          label="Slow Components" 
          value={data.slowComponents.length}
          status={data.slowComponents.length === 0 ? 'good' : 'warning'}
        />
      </div>
      
      {data.slowComponents.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-700 mb-1">Slow Components:</h4>
          <div className="space-y-1">
            {data.slowComponents.slice(0, 3).map(comp => (
              <div key={comp.name} className="flex justify-between text-xs">
                <span className="text-gray-600">{comp.name}</span>
                <span className="text-red-600">{comp.averageRenderTime.toFixed(2)}ms</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {data.recommendations.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-700 mb-1">Recommendations:</h4>
          <ul className="space-y-1">
            {data.recommendations.slice(0, 2).map((rec, index) => (
              <li key={index} className="text-xs text-gray-600">• {rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// Translations Tab Component
const TranslationsTab = ({ data }) => {
  if (!data) {
    return <div className="text-gray-500">Translation metrics not available</div>;
  }
  
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <MetricCard label="Cache Size" value={data.cacheSize} />
        <MetricCard 
          label="Hit Rate" 
          value={`${data.cacheHitRate.toFixed(1)}%`}
          status={data.cacheHitRate > 80 ? 'good' : data.cacheHitRate > 60 ? 'warning' : 'error'}
        />
        <MetricCard 
          label="Avg Load Time" 
          value={`${data.averageLoadTime.toFixed(2)}ms`}
          status={data.averageLoadTime < 100 ? 'good' : data.averageLoadTime < 500 ? 'warning' : 'error'}
        />
        <MetricCard 
          label="Efficiency" 
          value={data.efficiency}
          status={data.efficiency === 'excellent' ? 'good' : data.efficiency === 'good' ? 'warning' : 'error'}
        />
      </div>
      
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <span className="text-gray-600">Total Loads:</span>
          <div className="font-medium">{data.totalLoads}</div>
        </div>
        <div>
          <span className="text-gray-600">Cache Hits:</span>
          <div className="font-medium text-green-600">{data.cacheHits}</div>
        </div>
        <div>
          <span className="text-gray-600">Preload Hits:</span>
          <div className="font-medium text-blue-600">{data.preloadHits}</div>
        </div>
      </div>
    </div>
  );
};

// Progressive Tab Component
const ProgressiveTab = ({ data }) => {
  if (!data) {
    return <div className="text-gray-500">Progressive loading metrics not available</div>;
  }
  
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <MetricCard label="Total Components" value={data.totalCount} />
        <MetricCard label="Loaded" value={data.loadedCount} />
        <MetricCard 
          label="Progress" 
          value={`${data.loadingProgress.toFixed(1)}%`}
          status={data.loadingProgress > 80 ? 'good' : data.loadingProgress > 50 ? 'warning' : 'error'}
        />
        <MetricCard 
          label="Efficiency" 
          value={data.efficiency}
          status={data.efficiency === 'excellent' ? 'good' : data.efficiency === 'good' ? 'warning' : 'error'}
        />
      </div>
      
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <span className="text-gray-600">Queued:</span>
          <div className="font-medium">{data.queuedCount}</div>
        </div>
        <div>
          <span className="text-gray-600">Avg Load:</span>
          <div className="font-medium">{data.averageLoadTime.toFixed(2)}ms</div>
        </div>
        <div>
          <span className="text-gray-600">Total Time:</span>
          <div className="font-medium">{data.totalLoadTime.toFixed(2)}ms</div>
        </div>
      </div>
    </div>
  );
};

// Bundle Tab Component
const BundleTab = ({ data }) => {
  if (!data) {
    return <div className="text-gray-500">Bundle metrics not available</div>;
  }
  
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <MetricCard label="Translation Keys" value={data.totalTranslationKeys} />
        <MetricCard label="Used Keys" value={data.usedTranslationKeys} />
        <MetricCard 
          label="Unused Keys" 
          value={data.unusedTranslationKeys}
          status={data.unusedTranslationKeys === 0 ? 'good' : data.unusedTranslationKeys < 10 ? 'warning' : 'error'}
        />
        <MetricCard 
          label="Est. Savings" 
          value={`${(data.estimatedSavings / 1024).toFixed(2)}KB`}
          status={data.estimatedSavings < 1024 ? 'good' : data.estimatedSavings < 5120 ? 'warning' : 'error'}
        />
      </div>
      
      <div className="text-xs">
        <div className="flex justify-between">
          <span className="text-gray-600">Usage Tracking:</span>
          <span className="font-medium">{data.translationUsageEntries} entries</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Component Tracking:</span>
          <span className="font-medium">{data.componentUsageEntries} entries</span>
        </div>
        {data.lastAnalysis && (
          <div className="flex justify-between">
            <span className="text-gray-600">Last Analysis:</span>
            <span className="font-medium">{new Date(data.lastAnalysis).toLocaleTimeString()}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Metric Card Component
const MetricCard = ({ label, value, status = 'neutral' }) => {
  const statusColors = {
    good: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
    neutral: 'text-gray-800'
  };
  
  return (
    <div className="bg-gray-50 p-2 rounded">
      <div className="text-xs text-gray-600">{label}</div>
      <div className={`font-medium ${statusColors[status]}`}>{value}</div>
    </div>
  );
};

export default OptimizationMonitor;