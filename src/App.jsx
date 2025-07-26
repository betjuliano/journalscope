import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { useEmbeddedData } from '../hooks';
import LoadingScreen from './components/LoadingScreen';
import ErrorScreen from './components/ErrorScreen';
import PerformanceMonitor from './components/PerformanceMonitor';
import OptimizationMonitor from './components/OptimizationMonitor';
import { useI18n } from './contexts/I18nContext';
import { intelligentPreload, preloadOnUserInteraction } from './utils/preloadComponents';
import './components/index.css';

// Lazy load do componente principal
const JournalSearchApp = lazy(() => import('./components/JournalSearchApp'));

function App() {
  const { t } = useI18n();
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false);
  const [showOptimizationMonitor, setShowOptimizationMonitor] = useState(false);
  // Simplified performance tracking
  const [performanceMetrics, setPerformanceMetrics] = useState({
    initialLoadTime: 0,
    dataLoadTime: 0
  });

  const {
    isLoading,
    error,
    stats,
    journalsData,
    // filtros e funções podem ser passados para o JournalSearchApp se necessário
  } = useEmbeddedData();

  // Initialize preloading system
  useEffect(() => {
    intelligentPreload();
    preloadOnUserInteraction();
  }, []);

  // Enhanced initial load time tracking with detailed performance monitoring
  useEffect(() => {
    const appStartTime = performance.mark ? performance.mark('app-start') : performance.now();
    
    if (!isLoading && journalsData && journalsData.length > 0) {
      const loadEndTime = performance.now();
      const totalLoadTime = performance.mark ? 
        performance.measure('app-load-time', 'app-start').duration :
        loadEndTime - appStartTime;
      
      // Detailed performance metrics with enhanced monitoring
      const detailedMetrics = {
        initialLoadTime: totalLoadTime,
        dataLoadTime: totalLoadTime,
        journalCount: journalsData.length,
        loadRate: journalsData.length / totalLoadTime, // journals per ms
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        connectionType: navigator.connection?.effectiveType || 'unknown',
        memoryUsage: performance.memory ? {
          used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
          total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
          limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
        } : null,
        performanceScore: calculatePerformanceScore(totalLoadTime, journalsData.length),
        optimizationLevel: getOptimizationLevel(totalLoadTime)
      };
      
      setPerformanceMetrics(prev => ({
        ...prev,
        ...detailedMetrics
      }));
      
      // Enhanced development performance logging
      if (import.meta.env.DEV) {
        console.group('🚀 JournalScope Performance Metrics (Enhanced)');
        console.log(`⏱️ Total load time: ${totalLoadTime.toFixed(2)}ms`);
        console.log(`📊 Journals loaded: ${journalsData.length}`);
        console.log(`⚡ Load rate: ${detailedMetrics.loadRate.toFixed(2)} journals/ms`);
        console.log(`🎯 Performance score: ${detailedMetrics.performanceScore}/100`);
        console.log(`🔧 Optimization level: ${detailedMetrics.optimizationLevel}`);
        
        if (detailedMetrics.memoryUsage) {
          console.log(`💾 Memory usage: ${detailedMetrics.memoryUsage.used}MB / ${detailedMetrics.memoryUsage.total}MB (limit: ${detailedMetrics.memoryUsage.limit}MB)`);
          
          // Memory usage warnings
          const memoryUsagePercent = (detailedMetrics.memoryUsage.used / detailedMetrics.memoryUsage.limit) * 100;
          if (memoryUsagePercent > 80) {
            console.warn(`💾 High memory usage: ${memoryUsagePercent.toFixed(1)}%`);
          }
        }
        
        if (navigator.connection) {
          console.log(`🌐 Connection: ${navigator.connection.effectiveType}`);
        }
        
        // Enhanced performance warnings with recommendations
        if (totalLoadTime > 3000) {
          console.warn('🐌 Slow initial load detected (>3s)');
          console.log('💡 Recommendations: Consider implementing lazy loading, code splitting, or data pagination');
        } else if (totalLoadTime > 1000) {
          console.warn('⚠️ Moderate load time detected (>1s)');
          console.log('💡 Recommendations: Optimize data processing or implement progressive loading');
        } else {
          console.log('✅ Fast load time achieved - excellent performance!');
        }
        
        // Performance insights
        if (detailedMetrics.loadRate > 10) {
          console.log('⚡ Excellent data processing rate');
        } else if (detailedMetrics.loadRate > 5) {
          console.log('👍 Good data processing rate');
        } else {
          console.warn('🐌 Slow data processing rate - consider optimization');
        }
        
        console.groupEnd();
      }
      
      // Store enhanced performance data for analytics
      if (window.JOURNALSCOPE_CONFIG?.features?.analytics) {
        localStorage.setItem('journalscope_last_performance', JSON.stringify(detailedMetrics));
        
        // Store performance history for trend analysis
        const performanceHistory = JSON.parse(localStorage.getItem('journalscope_performance_history') || '[]');
        performanceHistory.push({
          timestamp: Date.now(),
          loadTime: totalLoadTime,
          journalCount: journalsData.length,
          performanceScore: detailedMetrics.performanceScore
        });
        
        // Keep only last 10 entries
        if (performanceHistory.length > 10) {
          performanceHistory.shift();
        }
        
        localStorage.setItem('journalscope_performance_history', JSON.stringify(performanceHistory));
      }
    }
  }, [isLoading, journalsData]);

  // Helper function to calculate performance score
  const calculatePerformanceScore = (loadTime, dataCount) => {
    const baseScore = 100;
    const loadTimePenalty = Math.min(loadTime / 50, 50); // Max 50 points penalty for load time
    const dataEfficiencyBonus = Math.min(dataCount / 1000, 10); // Max 10 points bonus for data efficiency
    
    return Math.max(0, Math.round(baseScore - loadTimePenalty + dataEfficiencyBonus));
  };

  // Helper function to determine optimization level
  const getOptimizationLevel = (loadTime) => {
    if (loadTime < 500) return 'Excellent';
    if (loadTime < 1000) return 'Good';
    if (loadTime < 2000) return 'Fair';
    if (loadTime < 3000) return 'Poor';
    return 'Critical';
  };

  // Show performance monitor in development or when explicitly enabled
  const shouldShowPerformanceToggle = useMemo(() => {
    return import.meta.env.DEV || localStorage.getItem('journalscope_show_performance') === 'true';
  }, []);
  
  // Show optimization monitor in development
  const shouldShowOptimizationToggle = useMemo(() => {
    return import.meta.env.DEV || localStorage.getItem('journalscope_show_optimization') === 'true';
  }, []);

  if (isLoading) {
    return (
      <LoadingScreen 
        processingStatus={t('loading.processingData')}
        dataSource={{
          abdc: { count: stats.withABDC || 0, loaded: !!stats.withABDC },
          abs: { count: stats.withABS || 0, loaded: !!stats.withABS },
          jcr: { count: stats.withJCR || 0, loaded: !!stats.withJCR },
          sjr: { count: stats.withSJR || 0, loaded: !!stats.withSJR },
          citeScore: { count: stats.withCiteScore || 0, loaded: !!stats.withCiteScore },
          wiley: { count: stats.withWiley || 0, loaded: !!stats.withWiley },
          predatory: { count: stats.withPredatory || 0, loaded: !!stats.withPredatory }
        }}
      />
    );
  }

  if (error) {
    return <ErrorScreen error={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="App">
      <Suspense fallback={
        <LoadingScreen 
          processingStatus={t('loading.loadingApp')}
          dataSource={{
            abdc: { count: stats.withABDC || 0, loaded: !!stats.withABDC },
            abs: { count: stats.withABS || 0, loaded: !!stats.withABS },
            jcr: { count: stats.withJCR || 0, loaded: !!stats.withJCR },
            sjr: { count: stats.withSJR || 0, loaded: !!stats.withSJR },
            citeScore: { count: stats.withCiteScore || 0, loaded: !!stats.withCiteScore },
            wiley: { count: stats.withWiley || 0, loaded: !!stats.withWiley },
            predatory: { count: stats.withPredatory || 0, loaded: !!stats.withPredatory }
          }}
        />
      }>
        <JournalSearchApp />
      </Suspense>
      
      {/* Performance Monitor */}
      {shouldShowPerformanceToggle && (
        <PerformanceMonitor
          isVisible={showPerformanceMonitor}
          onToggle={() => setShowPerformanceMonitor(!showPerformanceMonitor)}
          initialLoadTime={performanceMetrics.initialLoadTime}
          dataLoadTime={performanceMetrics.dataLoadTime}
        />
      )}
      
      {/* Optimization Monitor */}
      {shouldShowOptimizationToggle && (
        <OptimizationMonitor
          isVisible={showOptimizationMonitor}
          onToggle={() => setShowOptimizationMonitor(!showOptimizationMonitor)}
        />
      )}
    </div>
  );
}

export default App;
