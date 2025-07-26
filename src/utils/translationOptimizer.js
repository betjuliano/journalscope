/**
 * Translation Optimizer Utility
 * Optimizes translation files by removing unused keys and creating optimized bundles
 */

import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

// Critical translation keys that should always be included
const CRITICAL_KEYS = [
  'hero.title',
  'hero.subtitle',
  'hero.description',
  'loading.title',
  'loading.processingData',
  'error.title',
  'error.retry',
  'table.actions',
  'table.columns.journal',
  'table.columns.abdc',
  'table.columns.abs',
  'table.columns.sjrQuartile',
  'table.columns.jcrQuartile',
  'table.columns.qualis',
  'table.columns.sjrHIndex',
  'filters.search.placeholder',
  'stats.totalJournals',
  'stats.withABDC',
  'stats.withABS',
  'stats.withJCR',
  'stats.withSJR'
];

// Non-critical keys that can be loaded progressively
const NON_CRITICAL_KEYS = [
  'footer',
  'export',
  'accessibility',
  'dataSources',
  'statsPanel.distributions',
  'table.journalCell',
  'statsPanel.quality',
  'filters.advanced',
  'performance',
  'optimization'
];

/**
 * Extract nested value from object using dot notation
 * @param {Object} obj - Source object
 * @param {string} path - Dot notation path
 * @returns {*} Value at path or undefined
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Set nested value in object using dot notation
 * @param {Object} obj - Target object
 * @param {string} path - Dot notation path
 * @param {*} value - Value to set
 */
function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  const lastKey = keys.pop();
  const target = keys.reduce((current, key) => {
    if (!current[key]) current[key] = {};
    return current[key];
  }, obj);
  target[lastKey] = value;
}

/**
 * Extract translations by key list
 * @param {Object} fullTranslations - Full translation object
 * @param {Array<string>} keyList - List of keys to extract
 * @returns {Object} Extracted translations
 */
function extractTranslationsByKeys(fullTranslations, keyList) {
  const extracted = {};
  
  keyList.forEach(key => {
    const value = getNestedValue(fullTranslations, key);
    if (value !== undefined) {
      setNestedValue(extracted, key, value);
    }
  });
  
  return extracted;
}

/**
 * Extract translations by section patterns
 * @param {Object} fullTranslations - Full translation object
 * @param {Array<string>} sectionPatterns - Section patterns to extract
 * @returns {Object} Extracted translations
 */
function extractTranslationsBySections(fullTranslations, sectionPatterns) {
  const extracted = {};
  
  sectionPatterns.forEach(pattern => {
    if (pattern.includes('.')) {
      // Handle nested patterns
      const value = getNestedValue(fullTranslations, pattern);
      if (value !== undefined) {
        setNestedValue(extracted, pattern, value);
      }
    } else {
      // Handle top-level sections
      if (fullTranslations[pattern]) {
        extracted[pattern] = fullTranslations[pattern];
      }
    }
  });
  
  return extracted;
}

/**
 * Optimize translation file by creating critical and non-critical chunks
 * @param {string} language - Language code (pt, en)
 * @param {Object} options - Optimization options
 */
export async function optimizeTranslationFile(language, options = {}) {
  const {
    inputDir = 'src/translations',
    outputDir = 'src/translations',
    createChunks = true,
    minify = false,
    validateKeys = true
  } = options;
  
  try {
    // Read the full translation file
    const fullTranslationPath = join(inputDir, `${language}.js`);
    const fullTranslationContent = await readFile(fullTranslationPath, 'utf-8');
    
    // Extract the translation object (assuming it's exported as default)
    const fullTranslations = eval(`(${fullTranslationContent.replace('export default', '')})`);
    
    if (!fullTranslations || typeof fullTranslations !== 'object') {
      throw new Error(`Invalid translation structure in ${language}.js`);
    }
    
    // Validate critical keys exist
    if (validateKeys) {
      const missingKeys = CRITICAL_KEYS.filter(key => getNestedValue(fullTranslations, key) === undefined);
      if (missingKeys.length > 0) {
        console.warn(`Missing critical keys in ${language}:`, missingKeys);
      }
    }
    
    if (createChunks) {
      // Create critical translations chunk
      const criticalTranslations = extractTranslationsByKeys(fullTranslations, CRITICAL_KEYS);
      const criticalContent = `export default ${JSON.stringify(criticalTranslations, null, minify ? 0 : 2)};`;
      
      const criticalPath = join(outputDir, `${language}-critical.js`);
      await writeFile(criticalPath, criticalContent, 'utf-8');
      
      // Create non-critical translations chunk
      const nonCriticalTranslations = extractTranslationsBySections(fullTranslations, NON_CRITICAL_KEYS);
      const nonCriticalContent = `export default ${JSON.stringify(nonCriticalTranslations, null, minify ? 0 : 2)};`;
      
      const nonCriticalPath = join(outputDir, `${language}-noncritical.js`);
      await writeFile(nonCriticalPath, nonCriticalContent, 'utf-8');
      
      // Calculate optimization metrics
      const originalSize = JSON.stringify(fullTranslations).length;
      const criticalSize = JSON.stringify(criticalTranslations).length;
      const nonCriticalSize = JSON.stringify(nonCriticalTranslations).length;
      const totalOptimizedSize = criticalSize + nonCriticalSize;
      
      const savings = originalSize - totalOptimizedSize;
      const savingsPercent = (savings / originalSize) * 100;
      
      console.log(`✅ Translation optimization completed for ${language}:`);
      console.log(`  - Original size: ${(originalSize / 1024).toFixed(2)} KB`);
      console.log(`  - Critical chunk: ${(criticalSize / 1024).toFixed(2)} KB (${CRITICAL_KEYS.length} keys)`);
      console.log(`  - Non-critical chunk: ${(nonCriticalSize / 1024).toFixed(2)} KB`);
      console.log(`  - Total optimized: ${(totalOptimizedSize / 1024).toFixed(2)} KB`);
      console.log(`  - Savings: ${(savings / 1024).toFixed(2)} KB (${savingsPercent.toFixed(1)}%)`);
      
      return {
        language,
        originalSize,
        criticalSize,
        nonCriticalSize,
        totalOptimizedSize,
        savings,
        savingsPercent,
        criticalKeys: CRITICAL_KEYS.length,
        nonCriticalSections: NON_CRITICAL_KEYS.length
      };
    }
    
  } catch (error) {
    console.error(`Failed to optimize translations for ${language}:`, error);
    throw error;
  }
}

/**
 * Optimize all translation files
 * @param {Object} options - Optimization options
 */
export async function optimizeAllTranslations(options = {}) {
  const languages = ['pt', 'en'];
  const results = [];
  
  console.log('🚀 Starting translation optimization...');
  
  for (const language of languages) {
    try {
      const result = await optimizeTranslationFile(language, options);
      results.push(result);
    } catch (error) {
      console.error(`Failed to optimize ${language}:`, error);
    }
  }
  
  // Summary report
  const totalOriginalSize = results.reduce((sum, r) => sum + r.originalSize, 0);
  const totalOptimizedSize = results.reduce((sum, r) => sum + r.totalOptimizedSize, 0);
  const totalSavings = totalOriginalSize - totalOptimizedSize;
  const totalSavingsPercent = (totalSavings / totalOriginalSize) * 100;
  
  console.log('\n📊 Translation Optimization Summary:');
  console.log(`  - Languages optimized: ${results.length}`);
  console.log(`  - Total original size: ${(totalOriginalSize / 1024).toFixed(2)} KB`);
  console.log(`  - Total optimized size: ${(totalOptimizedSize / 1024).toFixed(2)} KB`);
  console.log(`  - Total savings: ${(totalSavings / 1024).toFixed(2)} KB (${totalSavingsPercent.toFixed(1)}%)`);
  
  return results;
}

/**
 * Validate translation file structure
 * @param {string} language - Language code
 * @param {Object} options - Validation options
 */
export async function validateTranslationFile(language, options = {}) {
  const {
    inputDir = 'src/translations',
    checkCriticalKeys = true,
    checkStructure = true
  } = options;
  
  try {
    const translationPath = join(inputDir, `${language}.js`);
    const translationContent = await readFile(translationPath, 'utf-8');
    const translations = eval(`(${translationContent.replace('export default', '')})`);
    
    const issues = [];
    
    if (checkCriticalKeys) {
      const missingCriticalKeys = CRITICAL_KEYS.filter(key => 
        getNestedValue(translations, key) === undefined
      );
      
      if (missingCriticalKeys.length > 0) {
        issues.push({
          type: 'missing_critical_keys',
          keys: missingCriticalKeys
        });
      }
    }
    
    if (checkStructure) {
      // Check for empty values
      const emptyKeys = [];
      const checkEmpty = (obj, prefix = '') => {
        Object.entries(obj).forEach(([key, value]) => {
          const fullKey = prefix ? `${prefix}.${key}` : key;
          if (typeof value === 'string' && value.trim() === '') {
            emptyKeys.push(fullKey);
          } else if (typeof value === 'object' && value !== null) {
            checkEmpty(value, fullKey);
          }
        });
      };
      
      checkEmpty(translations);
      
      if (emptyKeys.length > 0) {
        issues.push({
          type: 'empty_values',
          keys: emptyKeys
        });
      }
    }
    
    return {
      language,
      valid: issues.length === 0,
      issues,
      keyCount: countKeys(translations),
      size: JSON.stringify(translations).length
    };
    
  } catch (error) {
    return {
      language,
      valid: false,
      error: error.message
    };
  }
}

/**
 * Count total keys in translation object
 * @param {Object} obj - Translation object
 * @returns {number} Total key count
 */
function countKeys(obj) {
  let count = 0;
  
  Object.values(obj).forEach(value => {
    if (typeof value === 'string') {
      count++;
    } else if (typeof value === 'object' && value !== null) {
      count += countKeys(value);
    }
  });
  
  return count;
}

/**
 * Generate translation usage report
 * @param {Object} usageData - Usage data from bundle optimizer
 * @returns {Object} Usage report
 */
export function generateTranslationUsageReport(usageData) {
  const report = {
    totalKeys: 0,
    usedKeys: 0,
    unusedKeys: 0,
    criticalKeysUsed: 0,
    nonCriticalKeysUsed: 0,
    languages: {}
  };
  
  // Analyze usage by language
  ['pt', 'en'].forEach(language => {
    const languageUsage = Object.entries(usageData.globalUsage || {})
      .filter(([key]) => key.startsWith(`${language}:`))
      .map(([key, count]) => ({
        key: key.substring(3), // Remove language prefix
        count
      }));
    
    const usedKeys = languageUsage.filter(item => item.count > 0);
    const criticalUsed = usedKeys.filter(item => 
      CRITICAL_KEYS.includes(item.key)
    ).length;
    
    const nonCriticalUsed = usedKeys.length - criticalUsed;
    
    report.languages[language] = {
      totalTracked: languageUsage.length,
      used: usedKeys.length,
      unused: languageUsage.length - usedKeys.length,
      criticalUsed,
      nonCriticalUsed,
      usageRate: languageUsage.length > 0 ? 
        (usedKeys.length / languageUsage.length) * 100 : 0
    };
    
    report.totalKeys += languageUsage.length;
    report.usedKeys += usedKeys.length;
    report.criticalKeysUsed += criticalUsed;
    report.nonCriticalKeysUsed += nonCriticalUsed;
  });
  
  report.unusedKeys = report.totalKeys - report.usedKeys;
  
  return report;
}

// Export key lists for external use
export { CRITICAL_KEYS, NON_CRITICAL_KEYS };

// CLI support for Node.js environments
if (typeof process !== 'undefined' && process.argv) {
  const args = process.argv.slice(2);
  
  if (args.includes('--optimize')) {
    optimizeAllTranslations({
      minify: args.includes('--minify'),
      validateKeys: !args.includes('--no-validate')
    }).catch(console.error);
  }
  
  if (args.includes('--validate')) {
    const languages = ['pt', 'en'];
    Promise.all(languages.map(lang => validateTranslationFile(lang)))
      .then(results => {
        console.log('\n🔍 Translation Validation Results:');
        results.forEach(result => {
          console.log(`\n${result.language}:`);
          if (result.valid) {
            console.log('  ✅ Valid');
            console.log(`  📊 Keys: ${result.keyCount}`);
            console.log(`  📦 Size: ${(result.size / 1024).toFixed(2)} KB`);
          } else {
            console.log('  ❌ Invalid');
            if (result.error) {
              console.log(`  Error: ${result.error}`);
            }
            if (result.issues) {
              result.issues.forEach(issue => {
                console.log(`  - ${issue.type}: ${issue.keys?.length || 0} items`);
              });
            }
          }
        });
      })
      .catch(console.error);
  }
}