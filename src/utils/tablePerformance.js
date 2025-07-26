/**
 * Table Performance Optimization Utilities
 * Provides memoization and optimization functions for table rendering
 */

// Memoization cache for table computations
const tableComputationCache = new Map();
const CACHE_SIZE_LIMIT = 500;

// Performance metrics for table operations
const tablePerformanceMetrics = {
  sortOperations: 0,
  filterOperations: 0,
  renderOperations: 0,
  cacheHits: 0,
  cacheMisses: 0,
  totalComputationTime: 0,
  averageComputationTime: 0
};

/**
 * Memoized table data processing with performance monitoring
 * @param {Array} data - Raw table data
 * @param {Object} filters - Applied filters
 * @param {Object} sortConfig - Sort configuration
 * @returns {Array} Processed table data
 */
export const memoizedTableProcessing = (data, filters, sortConfig) => {
  const startTime = performance.now();
  
  // Create cache key from inputs
  const cacheKey = JSON.stringify({
    dataLength: data.length,
    dataHash: hashArray(data.slice(0, 10)), // Hash first 10 items for performance
    filters,
    sortConfig
  });
  
  // Check cache first
  if (tableComputationCache.has(cacheKey)) {
    tablePerformanceMetrics.cacheHits++;
    const cachedResult = tableComputationCache.get(cacheKey);
    
    // Move to end for LRU behavior
    tableComputationCache.delete(cacheKey);
    tableComputationCache.set(cacheKey, cachedResult);
    
    return cachedResult;
  }
  
  tablePerformanceMetrics.cacheMisses++;
  
  // Process data (this would be the actual filtering/sorting logic)
  const processedData = processTableData(data, filters, sortConfig);
  
  // Cache the result
  tableComputationCache.set(cacheKey, processedData);
  
  // Manage cache size
  if (tableComputationCache.size > CACHE_SIZE_LIMIT) {
    const firstKey = tableComputationCache.keys().next().value;
    tableComputationCache.delete(firstKey);
  }
  
  const computationTime = performance.now() - startTime;
  tablePerformanceMetrics.totalComputationTime += computationTime;
  tablePerformanceMetrics.averageComputationTime = 
    tablePerformanceMetrics.totalComputationTime / 
    (tablePerformanceMetrics.cacheHits + tablePerformanceMetrics.cacheMisses);
  
  if (import.meta.env.DEV && computationTime > 10) {
    console.warn(`🐌 Slow table processing: ${computationTime.toFixed(2)}ms`);
  }
  
  return processedData;
};

/**
 * Fast hash function for arrays (for cache key generation)
 * @param {Array} arr - Array to hash
 * @returns {string} Hash string
 */
const hashArray = (arr) => {
  let hash = 0;
  const str = JSON.stringify(arr);
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return hash.toString();
};

/**
 * Optimized table data processing
 * @param {Array} data - Raw data
 * @param {Object} filters - Filters to apply
 * @param {Object} sortConfig - Sort configuration
 * @returns {Array} Processed data
 */
const processTableData = (data, filters, sortConfig) => {
  const startTime = performance.now();
  
  // Apply filters first (more efficient to sort smaller dataset)
  let filteredData = data;
  
  if (Object.keys(filters).length > 0) {
    filteredData = data.filter(item => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        
        // Handle nested properties
        const itemValue = key.includes('.') ? 
          getNestedValue(item, key) : 
          item[key];
        
        return itemValue === value;
      });
    });
    
    tablePerformanceMetrics.filterOperations++;
  }
  
  // Apply sorting
  if (sortConfig.field) {
    filteredData = [...filteredData].sort((a, b) => {
      const aValue = getNestedValue(a, sortConfig.field);
      const bValue = getNestedValue(b, sortConfig.field);
      
      // Handle different data types
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      const aStr = String(aValue || '').toLowerCase();
      const bStr = String(bValue || '').toLowerCase();
      
      if (sortConfig.direction === 'asc') {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });
    
    tablePerformanceMetrics.sortOperations++;
  }
  
  const processingTime = performance.now() - startTime;
  
  if (import.meta.env.DEV) {
    console.log(`📊 Table processing: ${processingTime.toFixed(2)}ms for ${data.length} → ${filteredData.length} items`);
  }
  
  return filteredData;
};

/**
 * Get nested object value by dot notation path
 * @param {Object} obj - Object to traverse
 * @param {string} path - Dot notation path
 * @returns {any} Value at path
 */
const getNestedValue = (obj, path) => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

/**
 * Optimized virtual scrolling helper for large datasets
 * @param {Array} data - Full dataset
 * @param {number} startIndex - Start index for visible items
 * @param {number} endIndex - End index for visible items
 * @param {number} bufferSize - Buffer size for smooth scrolling
 * @returns {Object} Virtualized data slice
 */
export const getVirtualizedSlice = (data, startIndex, endIndex, bufferSize = 5) => {
  const actualStart = Math.max(0, startIndex - bufferSize);
  const actualEnd = Math.min(data.length, endIndex + bufferSize);
  
  return {
    items: data.slice(actualStart, actualEnd),
    startIndex: actualStart,
    endIndex: actualEnd,
    totalItems: data.length
  };
};

/**
 * Debounced search function for better performance
 * @param {Function} searchFunction - Search function to debounce
 * @param {number} delay - Debounce delay in ms
 * @returns {Function} Debounced function
 */
export const debouncedSearch = (searchFunction, delay = 300) => {
  let timeoutId;
  
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => searchFunction(...args), delay);
  };
};

/**
 * Memoized cell renderer for table cells
 * @param {any} value - Cell value
 * @param {string} type - Cell type
 * @param {Object} options - Rendering options
 * @returns {string} Rendered cell content
 */
export const memoizedCellRenderer = (() => {
  const cellCache = new Map();
  const CELL_CACHE_LIMIT = 1000;
  
  return (value, type, options = {}) => {
    const cacheKey = `${type}:${JSON.stringify(value)}:${JSON.stringify(options)}`;
    
    if (cellCache.has(cacheKey)) {
      return cellCache.get(cacheKey);
    }
    
    let renderedContent;
    
    switch (type) {
      case 'classification':
        renderedContent = renderClassificationBadge(value, options);
        break;
      case 'quartile':
        renderedContent = renderQuartileBadge(value, options);
        break;
      case 'number':
        renderedContent = renderNumber(value, options);
        break;
      default:
        renderedContent = String(value || '-');
    }
    
    cellCache.set(cacheKey, renderedContent);
    
    // Manage cache size
    if (cellCache.size > CELL_CACHE_LIMIT) {
      const firstKey = cellCache.keys().next().value;
      cellCache.delete(firstKey);
    }
    
    return renderedContent;
  };
})();

/**
 * Render classification badge
 * @param {string} value - Classification value
 * @param {Object} options - Rendering options
 * @returns {string} HTML string
 */
const renderClassificationBadge = (value, options) => {
  if (!value) return '-';
  
  const colorMap = {
    'A*': 'bg-green-100 text-green-800',
    'A': 'bg-blue-100 text-blue-800',
    'B': 'bg-yellow-100 text-yellow-800',
    'C': 'bg-gray-100 text-gray-800',
    '4*': 'bg-green-100 text-green-800',
    '4': 'bg-blue-100 text-blue-800',
    '3': 'bg-yellow-100 text-yellow-800',
    '2': 'bg-orange-100 text-orange-800',
    '1': 'bg-red-100 text-red-800'
  };
  
  const colorClass = colorMap[value] || 'bg-gray-100 text-gray-800';
  
  return `<span class="px-2 py-1 text-xs font-medium rounded-full ${colorClass}">${value}</span>`;
};

/**
 * Render quartile badge
 * @param {string} value - Quartile value
 * @param {Object} options - Rendering options
 * @returns {string} HTML string
 */
const renderQuartileBadge = (value, options) => {
  if (!value) return '-';
  
  const colorMap = {
    'Q1': 'bg-green-100 text-green-800',
    'Q2': 'bg-blue-100 text-blue-800',
    'Q3': 'bg-yellow-100 text-yellow-800',
    'Q4': 'bg-red-100 text-red-800'
  };
  
  const colorClass = colorMap[value] || 'bg-gray-100 text-gray-800';
  
  return `<span class="px-2 py-1 text-xs font-medium rounded-full ${colorClass}">${value}</span>`;
};

/**
 * Render number with formatting
 * @param {number} value - Number value
 * @param {Object} options - Formatting options
 * @returns {string} Formatted number
 */
const renderNumber = (value, options = {}) => {
  if (value === null || value === undefined) return '-';
  
  const { decimals = 0, prefix = '', suffix = '' } = options;
  
  return `${prefix}${Number(value).toLocaleString(undefined, { 
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals 
  })}${suffix}`;
};

/**
 * Get table performance metrics
 * @returns {Object} Performance metrics
 */
export const getTablePerformanceMetrics = () => {
  const totalOperations = tablePerformanceMetrics.cacheHits + tablePerformanceMetrics.cacheMisses;
  const cacheHitRate = totalOperations > 0 ? (tablePerformanceMetrics.cacheHits / totalOperations) * 100 : 0;
  
  return {
    ...tablePerformanceMetrics,
    cacheHitRate,
    totalOperations,
    cacheSize: tableComputationCache.size,
    efficiency: cacheHitRate > 80 ? 'excellent' : cacheHitRate > 60 ? 'good' : 'fair'
  };
};

/**
 * Clear table performance cache
 */
export const clearTableCache = () => {
  tableComputationCache.clear();
  
  // Reset metrics
  Object.keys(tablePerformanceMetrics).forEach(key => {
    tablePerformanceMetrics[key] = 0;
  });
};

export default {
  memoizedTableProcessing,
  getVirtualizedSlice,
  debouncedSearch,
  memoizedCellRenderer,
  getTablePerformanceMetrics,
  clearTableCache
};