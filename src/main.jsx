import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { I18nProvider } from './contexts/I18nContext';
import './components/index.css';
import './components/JournalScope.css';

// Configurações globais para JournalScope
window.JOURNALSCOPE_CONFIG = {
  version: '1.0.0',
  buildDate: new Date().toISOString(),
  environment: import.meta.env.MODE || 'development',
  features: {
    analytics: false,
    serviceWorker: true,
    darkMode: true,
    fileAccess: typeof window.fs !== 'undefined'
  }
};

// Detecção de recursos do navegador
window.BROWSER_SUPPORT = {
  fileReader: typeof FileReader !== 'undefined',
  localStorage: typeof Storage !== 'undefined',
  serviceWorker: 'serviceWorker' in navigator,
  clipboard: navigator.clipboard !== undefined,
  webShare: navigator.share !== undefined,
  webAssembly: typeof WebAssembly !== 'undefined'
};

// Log de informações (apenas em desenvolvimento)
if (import.meta.env.DEV) {
  console.log('🔬 JournalScope v1.0.0 - Starting...');
  console.log('Browser Support:', window.BROWSER_SUPPORT);
  console.log('Config:', window.JOURNALSCOPE_CONFIG);
}

// Função para simular window.fs se não estiver disponível
if (typeof window.fs === 'undefined') {
  console.warn('window.fs not available, using fallback');
  window.fs = {
    readFile: async (path, options = {}) => {
      try {
        const response = await fetch(path);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${path}: ${response.status}`);
        }
        
        if (options.encoding === 'utf8') {
          return await response.text();
        }
        
        const buffer = await response.arrayBuffer();
        return new Uint8Array(buffer);
      } catch (error) {
        throw new Error(`File read error: ${error.message}`);
      }
    }
  };
}

// Criar root do React
const root = ReactDOM.createRoot(document.getElementById('root'));

// Renderizar aplicação
root.render(
  <React.StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </React.StrictMode>
);

// Service Worker DESABILITADO - Remover registros existentes
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Desregistrar todos os Service Workers existentes
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      for(let registration of registrations) {
        registration.unregister().then(function(boolean) {
          console.log('SW unregistered:', boolean);
        });
      }
    });
  });
}

// Tratamento de erros globais
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  
  // Em desenvolvimento, mostrar erro na tela
  if (import.meta.env.DEV) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #fee;
      border: 1px solid #fcc;
      padding: 10px;
      border-radius: 5px;
      z-index: 9999;
      max-width: 300px;
      font-family: monospace;
      font-size: 12px;
    `;
    errorDiv.innerHTML = `
      <strong>Error:</strong><br>
      ${event.error?.message || 'Unknown error'}<br>
      <small>${event.filename}:${event.lineno}</small>
    `;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
      document.body.removeChild(errorDiv);
    }, 10000);
  }
});

// Tratamento de promises rejeitadas
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  
  // Prevenir que o erro apareça no console como "Uncaught"
  event.preventDefault();
});

// Enhanced performance monitoring and optimization (all environments)
const initializePerformanceOptimizations = async () => {
  try {
    // Initialize performance monitoring
    const { initPerformanceMonitoring } = await import('./utils/performance.js');
    initPerformanceMonitoring();
    
    // Initialize progressive UI loading with optimized configuration (temporarily disabled)
    // const { initProgressiveUILoading, preloadHighPriorityComponents } = 
    //   await import('./utils/progressiveUILoader.js');
    
    // // Initialize progressive UI loading system
    // initProgressiveUILoading();
    
    // // Preload high-priority components immediately
    // await preloadHighPriorityComponents();
    
    // Initialize bundle optimization
    const { startUsagePersistence } = await import('./utils/bundleOptimizer.js');
    startUsagePersistence();
    
    // Simple translation preloading
    try {
      const currentLanguage = localStorage.getItem('journalscope_language') || 'pt';
      await import(`./translations/${currentLanguage}.js`);
      
      if (import.meta.env.DEV) {
        console.log(`🌐 Translations preloaded for ${currentLanguage}`);
      }
    } catch (error) {
      console.warn('Failed to preload translations:', error);
    }
    
    if (import.meta.env.DEV) {
      console.log('✅ Performance optimizations initialized');
    }
    
  } catch (error) {
    console.warn('Performance optimization initialization failed:', error);
  }
};

// Initialize optimizations immediately
initializePerformanceOptimizations();

// Enhanced performance reporting (development only)
if (import.meta.env.DEV) {
  window.addEventListener('load', () => {
    setTimeout(async () => {
      try {
        const perfData = performance.getEntriesByType('navigation')[0];
        
        console.group('🚀 JournalScope Performance Report');
        console.log('⏱️ Navigation Timing:');
        console.log(`  - DOM Content Loaded: ${Math.round(perfData.domContentLoadedEventEnd)}ms`);
        console.log(`  - Load Complete: ${Math.round(perfData.loadEventEnd)}ms`);
        console.log(`  - DOM Interactive: ${Math.round(perfData.domInteractive)}ms`);
        console.log(`  - First Paint: ${Math.round(perfData.responseEnd - perfData.fetchStart)}ms`);
        
        // Memory metrics
        if (performance.memory) {
          const memoryMB = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
          const limitMB = Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024);
          console.log(`💾 Memory Usage: ${memoryMB}MB / ${limitMB}MB (${((memoryMB/limitMB)*100).toFixed(1)}%)`);
        }
        
        // Progressive UI loading metrics (temporarily disabled)
        // const { getProgressiveUIMetrics } = await import('./utils/progressiveUILoader.js');
        // const progressiveUIMetrics = getProgressiveUIMetrics();
        console.log('📦 Progressive UI Loading: (disabled for optimization)');
        // console.log(`  - Components: ${progressiveUIMetrics.loadedComponents}/${progressiveUIMetrics.totalComponents} loaded`);
        // console.log(`  - Progress: ${progressiveUIMetrics.loadingProgress.toFixed(1)}%`);
        // console.log(`  - Success Rate: ${progressiveUIMetrics.successRate.toFixed(1)}%`);
        // console.log(`  - Average Load Time: ${progressiveUIMetrics.averageLoadTime.toFixed(2)}ms`);
        // console.log(`  - Memory Efficiency: ${progressiveUIMetrics.memoryEfficiency.toFixed(2)} components/KB`);
        
        // Translation loading metrics (simplified)
        console.log('🌐 Translation Loading: Simplified for stability');
        
        // Bundle optimization metrics (enhanced)
        const { getBundleMetrics } = await import('./utils/bundleOptimizer.js');
        const bundleMetrics = getBundleMetrics();
        console.log('📊 Bundle Optimization:');
        console.log(`  - Usage Rate: ${bundleMetrics.usageRate.toFixed(1)}%`);
        console.log(`  - Potential Savings: ${(bundleMetrics.potentialSavings / 1024).toFixed(1)}KB`);
        console.log(`  - Tracked Keys: ${bundleMetrics.totalTracked}`);
        console.log(`  - Bundle optimization: Simplified for stability`);
        
        // Overall performance assessment
        const { getPerformanceReport } = await import('./utils/performance.js');
        const performanceReport = getPerformanceReport();
        console.log(`🎯 Performance Score: ${performanceReport.score}/100`);
        
        if (performanceReport.recommendations.length > 0) {
          console.log('💡 Recommendations:');
          performanceReport.recommendations.forEach(rec => console.log(`  - ${rec}`));
        }
        
        console.groupEnd();
        
        // Performance warnings
        if (perfData.loadEventEnd > 3000) {
          console.warn('🐌 Slow initial load detected (>3s) - consider further optimization');
        } else if (perfData.loadEventEnd < 1000) {
          console.log('⚡ Excellent load performance achieved!');
        }
        
      } catch (error) {
        console.warn('Performance reporting failed:', error);
      }
    }, 1000);
  });
}
