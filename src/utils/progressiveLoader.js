/**
 * Progressive Loader Utility
 * Implements progressive loading for non-critical UI elements
 */

// Component loading queue and state
const componentQueue = new Map();
const loadedComponents = new Map();
const loadingPromises = new Map();

// Progressive loading metrics
const progressiveMetrics = {
  totalComponents: 0,
  loadedComponents: 0,
  failedComponents: 0,
  averageLoadTime: 0,
  totalLoadTime: 0,
  loadingProgress: 0
};

// Loading priorities
const PRIORITY_LEVELS = {
  CRITICAL: 0,    // Load immediately
  HIGH: 1,        // Load after critical
  MEDIUM: 2,      // Load when idle
  LOW: 3,         // Load on demand
  LAZY: 4         // Load only when needed
};

// Default loading options
const DEFAULT_OPTIONS = {
  priority: PRIORITY_LEVELS.MEDIUM,
  timeout: 10000,
  retries: 2,
  preload: false,
  lazy: true,
  onLoad: null,
  onError: null
};

/**
 * Queue a component for progressive loading
 * @param {string} name - Component name
 * @param {string} path - Component path
 * @param {Object} options - Loading options
 */
export function queueComponent(name, path, options = {}) {
  if (!name || !path) {
    console.warn('Invalid component name or path provided to queueComponent');
    return;
  }
  
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  componentQueue.set(name, {
    name,
    path,
    ...config,
    queuedAt: Date.now(),
    status: 'queued'
  });
  
  progressiveMetrics.totalComponents = componentQueue.size;
  
  if (import.meta.env.DEV) {
    console.log(`📦 Component queued: ${name} (priority: ${config.priority})`);
  }
}

/**
 * Load a component with retry logic and timeout
 * @param {Object} componentConfig - Component configuration
 * @returns {Promise<Object>} Loaded component
 */
async function loadComponent(componentConfig) {
  const { name, path, timeout, retries, onLoad, onError } = componentConfig;
  const startTime = performance.now();
  
  // Check if already loading
  if (loadingPromises.has(name)) {
    return loadingPromises.get(name);
  }
  
  // Check if already loaded
  if (loadedComponents.has(name)) {
    return loadedComponents.get(name);
  }
  
  let lastError;
  
  const loadPromise = (async () => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Update status
        componentConfig.status = 'loading';
        
        // Create timeout promise
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error(`Component loading timeout: ${name}`)), timeout);
        });
        
        // Load component with dynamic import
        const loadPromise = import(/* @vite-ignore */ path);
        
        // Race between load and timeout
        const module = await Promise.race([loadPromise, timeoutPromise]);
        
        if (!module || !module.default) {
          throw new Error(`Invalid component module: ${name}`);
        }
        
        const component = module.default;
        const loadTime = performance.now() - startTime;
        
        // Cache the loaded component
        loadedComponents.set(name, {
          component,
          loadedAt: Date.now(),
          loadTime,
          attempts: attempt + 1
        });
        
        // Update status and metrics
        componentConfig.status = 'loaded';
        progressiveMetrics.loadedComponents++;
        progressiveMetrics.totalLoadTime += loadTime;
        progressiveMetrics.averageLoadTime = progressiveMetrics.totalLoadTime / progressiveMetrics.loadedComponents;
        progressiveMetrics.loadingProgress = (progressiveMetrics.loadedComponents / progressiveMetrics.totalComponents) * 100;
        
        // Call onLoad callback
        if (onLoad && typeof onLoad === 'function') {
          try {
            onLoad(component, loadTime);
          } catch (callbackError) {
            console.warn(`onLoad callback error for ${name}:`, callbackError);
          }
        }
        
        if (import.meta.env.DEV) {
          console.log(`✅ Component loaded: ${name} in ${loadTime.toFixed(2)}ms (attempt ${attempt + 1})`);
        }
        
        return component;
        
      } catch (error) {
        lastError = error;
        
        if (attempt < retries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          if (import.meta.env.DEV) {
            console.warn(`⚠️ Component load failed: ${name}, retrying in ${delay}ms...`, error);
          }
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // All attempts failed
    componentConfig.status = 'failed';
    progressiveMetrics.failedComponents++;
    
    // Call onError callback
    if (onError && typeof onError === 'function') {
      try {
        onError(lastError);
      } catch (callbackError) {
        console.warn(`onError callback error for ${name}:`, callbackError);
      }
    }
    
    const error = new Error(`Failed to load component ${name} after ${retries + 1} attempts: ${lastError.message}`);
    
    if (import.meta.env.DEV) {
      console.error(`❌ Component load failed: ${name}`, error);
    }
    
    throw error;
  })();
  
  // Cache the loading promise
  loadingPromises.set(name, loadPromise);
  
  // Clean up promise cache when done
  loadPromise.finally(() => {
    loadingPromises.delete(name);
  });
  
  return loadPromise;
}

/**
 * Start progressive loading process
 * @param {Object} options - Loading options
 */
export function startProgressiveLoading(options = {}) {
  const {
    batchSize = 3,
    batchDelay = 100,
    useIdleCallback = true,
    respectPriority = true
  } = options;
  
  if (componentQueue.size === 0) {
    if (import.meta.env.DEV) {
      console.log('📦 No components queued for progressive loading');
    }
    return;
  }
  
  // Sort components by priority if requested
  const sortedComponents = Array.from(componentQueue.values());
  if (respectPriority) {
    sortedComponents.sort((a, b) => a.priority - b.priority);
  }
  
  // Group components by priority
  const priorityGroups = new Map();
  sortedComponents.forEach(component => {
    const priority = component.priority;
    if (!priorityGroups.has(priority)) {
      priorityGroups.set(priority, []);
    }
    priorityGroups.get(priority).push(component);
  });
  
  if (import.meta.env.DEV) {
    console.group('🚀 Starting progressive loading');
    console.log(`📊 Total components: ${componentQueue.size}`);
    console.log(`📊 Priority groups: ${priorityGroups.size}`);
    priorityGroups.forEach((components, priority) => {
      const priorityName = Object.keys(PRIORITY_LEVELS)[priority] || priority;
      console.log(`  - ${priorityName}: ${components.length} components`);
    });
    console.groupEnd();
  }
  
  // Load components by priority groups
  let currentDelay = 0;
  
  priorityGroups.forEach((components, priority) => {
    // Load critical components immediately
    if (priority === PRIORITY_LEVELS.CRITICAL) {
      loadComponentBatch(components, 0, batchSize);
    } else {
      // Schedule other components with delays
      setTimeout(() => {
        if (useIdleCallback && window.requestIdleCallback) {
          window.requestIdleCallback(() => {
            loadComponentBatch(components, batchDelay, batchSize);
          });
        } else {
          loadComponentBatch(components, batchDelay, batchSize);
        }
      }, currentDelay);
      
      currentDelay += batchDelay * Math.ceil(components.length / batchSize);
    }
  });
}

/**
 * Load a batch of components
 * @param {Array} components - Components to load
 * @param {number} delay - Delay between batches
 * @param {number} batchSize - Number of components per batch
 */
async function loadComponentBatch(components, delay, batchSize) {
  for (let i = 0; i < components.length; i += batchSize) {
    const batch = components.slice(i, i + batchSize);
    
    // Load batch in parallel
    const batchPromises = batch.map(component => {
      return loadComponent(component).catch(error => {
        // Don't let individual failures stop the batch
        console.warn(`Component load failed in batch: ${component.name}`, error);
        return null;
      });
    });
    
    try {
      await Promise.all(batchPromises);
    } catch (error) {
      console.warn('Batch loading error:', error);
    }
    
    // Delay between batches (except for critical components)
    if (delay > 0 && i + batchSize < components.length) {
      await new Promise(resolve => setTimeout(resolve, delay));
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
 * Load a component on demand
 * @param {string} name - Component name
 * @returns {Promise<Object>} Loaded component
 */
export async function loadComponentOnDemand(name) {
  // Check if already loaded
  const loaded = loadedComponents.get(name);
  if (loaded) {
    return loaded.component;
  }
  
  // Check if queued
  const queued = componentQueue.get(name);
  if (!queued) {
    throw new Error(`Component not queued: ${name}`);
  }
  
  // Load the component
  return loadComponent(queued);
}

/**
 * Preload components by priority
 * @param {number} maxPriority - Maximum priority level to preload
 */
export async function preloadComponentsByPriority(maxPriority = PRIORITY_LEVELS.HIGH) {
  const componentsToPreload = Array.from(componentQueue.values())
    .filter(component => component.priority <= maxPriority && component.status === 'queued');
  
  if (componentsToPreload.length === 0) {
    return;
  }
  
  if (import.meta.env.DEV) {
    console.log(`🚀 Preloading ${componentsToPreload.length} high-priority components`);
  }
  
  const preloadPromises = componentsToPreload.map(component => 
    loadComponent(component).catch(error => {
      console.warn(`Preload failed for ${component.name}:`, error);
      return null;
    })
  );
  
  await Promise.all(preloadPromises);
}

/**
 * Get progressive loading metrics
 * @returns {Object} Progressive loading metrics
 */
export function getProgressiveMetrics() {
  const queuedCount = Array.from(componentQueue.values()).filter(c => c.status === 'queued').length;
  const loadingCount = Array.from(componentQueue.values()).filter(c => c.status === 'loading').length;
  
  return {
    ...progressiveMetrics,
    totalCount: componentQueue.size,
    queuedCount,
    loadingCount,
    loadedCount: progressiveMetrics.loadedComponents,
    failedCount: progressiveMetrics.failedComponents,
    successRate: progressiveMetrics.totalComponents > 0 ? 
      (progressiveMetrics.loadedComponents / progressiveMetrics.totalComponents) * 100 : 0
  };
}

/**
 * Get component loading status
 * @param {string} name - Component name
 * @returns {Object|null} Component status
 */
export function getComponentStatus(name) {
  const queued = componentQueue.get(name);
  const loaded = loadedComponents.get(name);
  
  if (loaded) {
    return {
      name,
      status: 'loaded',
      loadedAt: loaded.loadedAt,
      loadTime: loaded.loadTime,
      attempts: loaded.attempts
    };
  }
  
  if (queued) {
    return {
      name,
      status: queued.status,
      queuedAt: queued.queuedAt,
      priority: queued.priority
    };
  }
  
  return null;
}

/**
 * Clear all component caches and queues
 */
export function clearProgressiveLoader() {
  componentQueue.clear();
  loadedComponents.clear();
  loadingPromises.clear();
  
  // Reset metrics
  progressiveMetrics.totalComponents = 0;
  progressiveMetrics.loadedComponents = 0;
  progressiveMetrics.failedComponents = 0;
  progressiveMetrics.averageLoadTime = 0;
  progressiveMetrics.totalLoadTime = 0;
  progressiveMetrics.loadingProgress = 0;
  
  if (import.meta.env.DEV) {
    console.log('🧹 Progressive loader cleared');
  }
}

/**
 * Create a React hook for progressive component loading
 * @param {string} componentName - Component name
 * @param {Object} options - Hook options
 * @returns {Object} Hook result
 */
export function useProgressiveComponent(componentName, options = {}) {
  // Note: This hook requires React to be imported in the consuming component
  // This is a placeholder - the actual hook should be implemented in the consuming component
  console.warn('useProgressiveComponent should be implemented in the consuming component with proper React imports');
  
  return {
    component: null,
    loading: false,
    error: null,
    loadComponent: () => loadComponentOnDemand(componentName)
  };
}

// Export priority levels for external use
export { PRIORITY_LEVELS };

// Export for debugging in development
if (import.meta.env.DEV) {
  window.JOURNALSCOPE_PROGRESSIVE_DEBUG = {
    getProgressiveMetrics,
    getComponentStatus,
    clearProgressiveLoader,
    componentQueue: () => Array.from(componentQueue.entries()),
    loadedComponents: () => Array.from(loadedComponents.entries())
  };
}