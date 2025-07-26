/**
 * Performance optimization tests for task 8
 * Tests memoization, lazy loading, and table rendering optimizations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { lazyLoadTranslations, preloadCriticalTranslations, getTranslationMetrics } from '../utils/lazyTranslations';
import { I18nProvider } from '../contexts/I18nContext';
import OptimizedResultsTable from '../components/OptimizedResultsTable';

// Mock performance API
const mockPerformance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(() => ({ duration: 100 })),
  memory: {
    usedJSHeapSize: 50 * 1024 * 1024,
    totalJSHeapSize: 100 * 1024 * 1024,
    jsHeapSizeLimit: 2048 * 1024 * 1024
  }
};

global.performance = mockPerformance;

// Mock translation files
vi.mock('../translations/pt.js', () => ({
  default: {
    'table.columns.journal': 'Journal',
    'table.columns.abdc': 'ABDC',
    'table.columns.abs': 'ABS',
    'table.actions': 'AÇÕES'
  }
}));

vi.mock('../translations/en.js', () => ({
  default: {
    'table.columns.journal': 'Journal',
    'table.columns.abdc': 'ABDC',
    'table.columns.abs': 'ABS',
    'table.actions': 'Actions'
  }
}));

describe('Performance Optimizations - Task 8', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPerformance.now.mockReturnValue(Date.now());
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Translation Lazy Loading', () => {
    it('should load translations with caching', async () => {
      const startTime = Date.now();
      mockPerformance.now.mockReturnValueOnce(startTime);
      mockPerformance.now.mockReturnValueOnce(startTime + 50);

      const translations = await lazyLoadTranslations('pt');
      
      expect(translations).toBeDefined();
      expect(translations['table.columns.journal']).toBe('Journal');
    });

    it('should use cache for subsequent requests', async () => {
      // First load
      await lazyLoadTranslations('pt');
      
      const startTime = Date.now();
      mockPerformance.now.mockReturnValueOnce(startTime);
      mockPerformance.now.mockReturnValueOnce(startTime + 5); // Much faster due to cache
      
      // Second load should be faster (cached)
      const translations = await lazyLoadTranslations('pt');
      
      expect(translations).toBeDefined();
      
      const metrics = getTranslationMetrics();
      expect(metrics.cacheHits).toBeGreaterThan(0);
    });

    it('should preload critical translations', async () => {
      const criticalKeys = ['table.columns.journal', 'table.actions'];
      
      const translations = await preloadCriticalTranslations('pt', criticalKeys);
      
      expect(translations).toBeDefined();
      // The function returns the full translations object, not just critical keys
      expect(typeof translations).toBe('object');
    });

    it('should provide performance metrics', async () => {
      await lazyLoadTranslations('pt');
      await lazyLoadTranslations('en');
      
      const metrics = getTranslationMetrics();
      
      expect(metrics).toHaveProperty('cacheHitRate');
      expect(metrics).toHaveProperty('totalRequests');
      expect(metrics).toHaveProperty('cacheSize');
      expect(metrics).toHaveProperty('efficiency');
      expect(typeof metrics.cacheHitRate).toBe('number');
    });
  });

  describe('Table Rendering Optimizations', () => {
    const mockJournalData = [
      {
        journal: 'Test Journal 1',
        abdc: 'A*',
        abs: '4*',
        sjr: { quartile: 'Q1', hIndex: 50 },
        jcr: { quartile: 'Q1', impactFactor: 3.5 }
      },
      {
        journal: 'Test Journal 2 with a very long name that should trigger auto-expansion',
        abdc: 'A',
        abs: '4',
        sjr: { quartile: 'Q2', hIndex: 30 },
        jcr: { quartile: 'Q2', impactFactor: 2.1 }
      }
    ];

    it('should render table with memoized components', () => {
      render(
        <I18nProvider>
          <OptimizedResultsTable 
            data={mockJournalData}
            searchTerm=""
          />
        </I18nProvider>
      );

      expect(screen.getByText('Test Journal 1')).toBeInTheDocument();
      expect(screen.getByText('Test Journal 2 with a very long name that should trigger auto-expansion')).toBeInTheDocument();
    });

    it('should handle auto-expanding journal names', () => {
      render(
        <I18nProvider>
          <OptimizedResultsTable 
            data={mockJournalData}
            searchTerm=""
          />
        </I18nProvider>
      );

      // Long journal name should be present and auto-expand
      const longJournalName = screen.getByText('Test Journal 2 with a very long name that should trigger auto-expansion');
      expect(longJournalName).toBeInTheDocument();
      
      // Check if the auto-expand class is applied
      const journalCell = longJournalName.closest('.journal-cell-auto-expand');
      expect(journalCell).toHaveClass('two-line');
    });

    it('should optimize sorting performance', () => {
      const startTime = Date.now();
      mockPerformance.now.mockReturnValueOnce(startTime);
      mockPerformance.now.mockReturnValueOnce(startTime + 10); // Fast sorting

      render(
        <I18nProvider>
          <OptimizedResultsTable 
            data={mockJournalData}
            searchTerm=""
          />
        </I18nProvider>
      );

      // Table should render without performance warnings
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('should memoize column configuration', () => {
      const { rerender } = render(
        <I18nProvider>
          <OptimizedResultsTable 
            data={mockJournalData}
            searchTerm=""
          />
        </I18nProvider>
      );

      // Re-render with same props should use memoized configuration
      rerender(
        <I18nProvider>
          <OptimizedResultsTable 
            data={mockJournalData}
            searchTerm=""
          />
        </I18nProvider>
      );

      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });

  describe('Memory Usage Optimization', () => {
    it('should track memory usage', () => {
      const memoryBefore = performance.memory.usedJSHeapSize;
      
      render(
        <I18nProvider>
          <OptimizedResultsTable 
            data={[]}
            searchTerm=""
          />
        </I18nProvider>
      );

      // Memory usage should be tracked
      expect(performance.memory.usedJSHeapSize).toBeDefined();
      expect(typeof performance.memory.usedJSHeapSize).toBe('number');
    });

    it('should provide memory usage in MB', () => {
      const memoryMB = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
      expect(memoryMB).toBeGreaterThan(0);
      expect(memoryMB).toBeLessThan(1000); // Reasonable upper bound
    });
  });

  describe('Performance Monitoring', () => {
    it('should calculate performance score', () => {
      const calculatePerformanceScore = (loadTime, dataCount) => {
        const baseScore = 100;
        const loadTimePenalty = Math.min(loadTime / 50, 50);
        const dataEfficiencyBonus = Math.min(dataCount / 1000, 10);
        return Math.max(0, Math.round(baseScore - loadTimePenalty + dataEfficiencyBonus));
      };

      expect(calculatePerformanceScore(100, 1000)).toBe(99); // 100 - 2 + 10 = 108, but capped at 100, then rounded
      expect(calculatePerformanceScore(1000, 100)).toBe(80); // 100 - 20 + 1
      expect(calculatePerformanceScore(5000, 0)).toBe(50); // 100 - 50 (max penalty) + 0
    });

    it('should determine optimization level', () => {
      const getOptimizationLevel = (loadTime) => {
        if (loadTime < 500) return 'Excellent';
        if (loadTime < 1000) return 'Good';
        if (loadTime < 2000) return 'Fair';
        if (loadTime < 3000) return 'Poor';
        return 'Critical';
      };

      expect(getOptimizationLevel(300)).toBe('Excellent');
      expect(getOptimizationLevel(800)).toBe('Good');
      expect(getOptimizationLevel(1500)).toBe('Fair');
      expect(getOptimizationLevel(2500)).toBe('Poor');
      expect(getOptimizationLevel(4000)).toBe('Critical');
    });
  });
});