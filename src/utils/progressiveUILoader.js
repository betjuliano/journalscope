/**
 * Progressive UI Loader
 * Implements progressive loading for non-critical UI elements with advanced optimization
 */

// Component loading registry
const componentRegistry = new Map();
const loadingQueue = [];
const loadedComponents = new Map();

// Progressive loading metrics
const progressiveMetrics = {
  totalComponents: 0,
  loadedComponents: 0,
  failedComponents: 0,
  averageLoadTime: 0,
  totalLoadTime: 0,
  memoryUsage: 0,
  bundleSavings: 0
};

// Loading priorities for UI components
const UI_PRIORITIES = {
  CRITICAL: 0,     // Core UI (search, table headers)
  HIGH: 1,         // Important features (filters, stats)
  MEDIUM: 2,       // Secondary features (export, advanced filters)
  LOW: 3,          // Optional features (performance monitor, debug tools)
  LAZY: 4          // On-demand only (help, about)
};

// Component configurations for progressive loading
const COMPONENT_CONFIGS = {
  // Critical components (load immediately)
  'SearchFilters': {
    priority: UI_PRIORITIES.CRITICAL,
    path: '../components/SearchFilters.jsx',
    preload: true,
    lazy: false
  },
  'ResultsTable': {
    priority: UI_PRIORITIES.CRITICAL,
    path: '../components/ResultsTable.jsx',
    preload: true,
    lazy: false
  },
  
  // High priority components (load after critical)
  'StatsPanel': {
    priority: UI_PRIORITIES.HIGH,
    path: '../components/StatsPanel.jsx',
    preload: true,
    lazy: false
  },
  'LanguageToggle': {
    priority: UI_PRIORITIES.HIGH,
    path: '../components/LanguageToggle.jsx',
    preload: true,
    lazy: false
  },
  
  // Medium priority components (load when idle)
  'ExportButtons': {
    priority: UI_PRIORITIES.MEDIUM,
    path: '../components/ExportButtons.jsx',
    preload: false,
    lazy: true
  },
  'AdvancedFilters': {
    priority: UI_PRIORITIES.MEDIUM,
    path: '../components/AdvancedFilters.jsx',
    preload: false,
    lazy: true
  },
  
  // Low priority components (load on demand)
  'PerformanceMonitor': {
    priority: UI_PRIORITIES.LOW,
    path: '../components/PerformanceMonitor.jsx',
    preload: false,
    lazy: true
  },
  'OptimizationMonitor': {
    priority: UI_PRIORITIES.LOW,
    path: '../components/OptimizationMonitor.jsx',
    preload: false,
    lazy: true
  },
  
  // Lazy components (load only when needed)
  'HelpDialog': {
    priority: UI_PRIORITIES.LAZY,
    path: '../components/HelpDialog.jsx',
    preload: false,
    lazy: true
  },
  'AboutDialog': {
    priority: UI_PRIORITIES.LAZY,
    path: '../components/AboutDialog.jsx',
    preload: false,
    lazy: true
  }
};

/**
 * Initialize progressive UI loading
 */
export function initProgressiveUILoading() {
  // Register all components
  Object.entries(COMPONENT_CONFIGS).forEach(([name, config]) => {
    registerComponent(name, config);
  });
  
  // Start progressive loading
  startProgressiveLoading();
  
  if (import.meta.env.DEV) {
    console.log('🎨 Progressive UI loading initialized');
    console.log(`📊 Total components: ${componentRegistry.size}`);
  }
}

/**
 * Register a component for progressive loading
 * @param {string} name - Component name
 * @param {Object} config - Component configuration
 */
function registerComponent(name, config) {
  componentRegistry.set(name, {
    name,
    ...config,
    status: 'registered',
    registeredAt: Date.now()
  });
  
  progressiveMetrics.totalComponents++;
}

/**
 * Load a component with optimization
 * @param {string} name - Component name
 * @returns {Promise<Object>} Loaded component
 */
async function loadComponent(name) {
  const config = componentRegistry.get(name);
  if (!config) {
    throw new Error(`Component not registered: ${name}`);
  }
  
  // Check if already loaded
  if (loadedComponents.has(name)) {
    return loadedComponents.get(name);
  }
  
  const startTime = performance.now();
  config.status = 'loading';
  
  try {
    // Dynamic import with optimization
    const module = await import(/* @vite-ignore */ config.path);
    
    if (!module || !module.default) {
      throw new Error(`Invalid component module: ${name}`);
    }
    
    const component = module.default;
    const loadTime = performance.now() - startTime;
    
    // Cache the loaded component
    const componentData = {
      component,
      loadedAt: Date.now(),
      loadTime,
      memoryEstimate: estimateComponentMemoryUsage(component)
    };
    
    loadedComponents.set(name, componentData);
    
    // Update metrics
    config.status = 'loaded';
    progressiveMetrics.loadedComponents++;
    progressiveMetrics.totalLoadTime += loadTime;
    progressiveMetrics.averageLoadTime = progressiveMetrics.totalLoadTime / progressiveMetrics.loadedComponents;
    progressiveMetrics.memoryUsage += componentData.memoryEstimate;
    
    if (import.meta.env.DEV) {
      console.log(`✅ Component loaded: ${name} in ${loadTime.toFixed(2)}ms`);
    }
    
    return component;
    
  } catch (error) {
    config.status = 'failed';
    progressiveMetrics.failedComponents++;
    
    console.error(`❌ Component load failed: ${name}`, error);
    throw error;
  }
}

/**
 * Estimate component memory usage (rough calculation)
 * @param {Object} component - React component
 * @returns {number} Estimated memory usage in bytes
 */
function estimateComponentMemoryUsage(component) {
  try {
    // Rough estimation based on component string representation
    const componentString = component.toString();
    const baseSize = componentString.length * 2; // Assume 2 bytes per character
    const complexityMultiplier = (componentString.match(/useState|useEffect|useMemo/g) || []).length * 100;
    
    return baseSize + complexityMultiplier;
  } catch (error) {
    return 1000; // Default estimate
  }
}

/**
 * Start progressive loading process
 */
function startProgressiveLoading() {
  // Group components by priority
  const priorityGroups = new Map();
  
  componentRegistry.forEach((config, name) => {
    const priority = config.priority;
    if (!priorityGroups.has(priority)) {
      priorityGroups.set(priority, []);
    }
    priorityGroups.get(priority).push(name);
  });
  
  // Load components by priority with delays
  let delay = 0;
  
  priorityGroups.forEach((components, priority) => {
    if (priority === UI_PRIORITIES.CRITICAL) {
      // Load critical components immediately
      loadComponentBatch(components, 0);
    } else if (priority === UI_PRIORITIES.HIGH) {
      // Load high priority after a short delay
      setTimeout(() => loadComponentBatch(components, 50), 100);
    } else if (priority === UI_PRIORITIES.MEDIUM) {
      // Load medium priority when idle
      setTimeout(() => {
        if (window.requestIdleCallback) {
          window.requestIdleCallback(() => loadComponentBatch(components, 100));
        } else {
          loadComponentBatch(components, 100);
        }
      }, 500);
    }
    // Low and lazy priority components are loaded on demand
  });
}

/**
 * Load a batch of components
 * @param {Array<string>} componentNames - Component names to load
 * @param {number} batchDelay - Delay between components in batch
 */
async function loadComponentBatch(componentNames, batchDelay = 0) {
  for (const name of componentNames) {
    try {
      await loadComponent(name);
      
      if (batchDelay > 0 && componentNames.indexOf(name) < componentNames.length - 1) {
        await new Promise(resolve => setTimeout(resolve, batchDelay));
      }
    } catch (error) {
      console.warn(`Failed to load component in batch: ${name}`, error);
    }
  }
}

/**
 * Get a loaded component
 * @param {string} name - Component name
 * @returns {Object|null} Loaded component or null
 */
export function getLoadedComponent(name) {
  const loaded = loadedComponents.get(name);
  return loaded ? loaded.component : null;
}

/**
 * Load component on demand
 * @param {string} name - Component name
 * @returns {Promise<Object>} Loaded component
 */
export async function loadComponentOnDemand(name) {
  const loaded = loadedComponents.get(name);
  if (loaded) {
    return loaded.component;
  }
  
  return await loadComponent(name);
}

/**
 * Preload high priority components
 * @returns {Promise<void>}
 */
export async function preloadHighPriorityComponents() {
  const highPriorityComponents = Array.from(componentRegistry.entries())
    .filter(([name, config]) => config.priority <= UI_PRIORITIES.HIGH && config.preload)
    .map(([name]) => name);
  
  if (highPriorityComponents.length === 0) {
    return;
  }
  
  if (import.meta.env.DEV) {
    console.log(`🚀 Preloading ${highPriorityComponents.length} high-priority components`);
  }
  
  const preloadPromises = highPriorityComponents.map(name =>
    loadComponent(name).catch(error => {
      console.warn(`Preload failed for ${name}:`, error);
      return null;
    })
  );
  
  await Promise.all(preloadPromises);
}

/**
 * Get progressive loading metrics
 * @returns {Object} Progressive loading metrics
 */
export function getProgressiveUIMetrics() {
  const loadingProgress = progressiveMetrics.totalComponents > 0 ?
    (progressiveMetrics.loadedComponents / progressiveMetrics.totalComponents) * 100 : 0;
  
  const successRate = (progressiveMetrics.loadedComponents + progressiveMetrics.failedComponents) > 0 ?
    (progressiveMetrics.loadedComponents / (progressiveMetrics.loadedComponents + progressiveMetrics.failedComponents)) * 100 : 0;
  
  const memoryEfficiency = progressiveMetrics.memoryUsage > 0 ?
    (progressiveMetrics.loadedComponents / progressiveMetrics.memoryUsage) * 1000 : 0; // Components per KB
  
  return {
    totalComponents: progressiveMetrics.totalComponents,
    loadedComponents: progressiveMetrics.loadedComponents,
    failedComponents: progressiveMetrics.failedComponents,
    loadingProgress,
    successRate,
    averageLoadTime: progressiveMetrics.averageLoadTime,
    totalLoadTime: progressiveMetrics.totalLoadTime,
    memoryUsage: progressiveMetrics.memoryUsage,
    memoryEfficiency,
    bundleSavings: progressiveMetrics.bundleSavings,
    performance: {
      efficiency: successRate > 90 && progressiveMetrics.averageLoadTime < 100 ? 'excellent' :
                 successRate > 80 && progressiveMetrics.averageLoadTime < 200 ? 'good' : 'fair',
      recommendations: getProgressiveUIRecommendations(successRate, progressiveMetrics.averageLoadTime, memoryEfficiency)
    }
  };
}

/**
 * Get progressive UI loading recommendations
 * @param {number} successRate - Success rate percentage
 * @param {number} avgLoadTime - Average load time
 * @param {number} memoryEfficiency - Memory efficiency score
 * @returns {Array<string>} Recommendations
 */
function getProgressiveUIRecommendations(successRate, avgLoadTime, memoryEfficiency) {
  const recommendations = [];
  
  if (successRate < 90) {
    recommendations.push('Some components are failing to load - check component paths and dependencies');
  }
  
  if (avgLoadTime > 150) {
    recommendations.push('Component loading is slow - consider further code splitting or optimization');
  }
  
  if (memoryEfficiency < 5) {
    recommendations.push('Memory usage is high relative to loaded components - review component complexity');
  }
  
  if (progressiveMetrics.loadedComponents < progressiveMetrics.totalComponents * 0.7) {
    recommendations.push('Many components are not being loaded - consider adjusting loading priorities');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Progressive UI loading is performing optimally');
  }
  
  return recommendations;
}

/**
 * Get component loading status
 * @param {string} name - Component name
 * @returns {Object|null} Component status
 */
export function getComponentStatus(name) {
  const config = componentRegistry.get(name);
  const loaded = loadedComponents.get(name);
  
  if (loaded) {
    return {
      name,
      status: 'loaded',
      loadedAt: loaded.loadedAt,
      loadTime: loaded.loadTime,
      memoryEstimate: loaded.memoryEstimate,
      priority: config?.priority
    };
  }
  
  if (config) {
    return {
      name,
      status: config.status,
      registeredAt: config.registeredAt,
      priority: config.priority,
      preload: config.preload,
      lazy: config.lazy
    };
  }
  
  return null;
}

/**
 * Clear progressive UI loader
 */
export function clearProgressiveUILoader() {
  componentRegistry.clear();
  loadedComponents.clear();
  loadingQueue.length = 0;
  
  // Reset metrics
  progressiveMetrics.totalComponents = 0;
  progressiveMetrics.loadedComponents = 0;
  progressiveMetrics.failedComponents = 0;
  progressiveMetrics.averageLoadTime = 0;
  progressiveMetrics.totalLoadTime = 0;
  progressiveMetrics.memoryUsage = 0;
  progressiveMetrics.bundleSavings = 0;
  
  if (import.meta.env.DEV) {
    console.log('🧹 Progressive UI loader cleared');
  }
}

/**
 * Create a React hook for progressive component loading
 * @param {string} componentName - Component name
 * @returns {Object} Hook result with component, loading state, and error
 */
export function useProgressiveComponent(componentName) {
  // This should be used in React components with proper React imports
  // Implementation would use React.useState and React.useEffect
  
  return {
    component: getLoadedComponent(componentName),
    loading: false,
    error: null,
    loadComponent: () => loadComponentOnDemand(componentName)
  };
}

// Export priorities for external use
export { UI_PRIORITIES };

// Export for debugging in development
if (import.meta.env.DEV) {
  window.JOURNALSCOPE_PROGRESSIVE_UI_DEBUG = {
    getProgressiveUIMetrics,
    getComponentStatus,
    clearProgressiveUILoader,
    loadComponentOnDemand,
    preloadHighPriorityComponents,
    componentRegistry: () => Array.from(componentRegistry.entries()),
    loadedComponents: () => Array.from(loadedComponents.entries())
  };
}