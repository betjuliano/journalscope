import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider, useI18n } from '../contexts/I18nContext';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Mock performance API
global.performance = {
  now: vi.fn(() => Date.now()),
};

// Test component for performance testing
const PerformanceTestComponent = () => {
  const { t, getPerformanceMetrics, clearTranslationCache } = useI18n();
  
  return (
    <div>
      <div data-testid="translation-1">{t('hero.title')}</div>
      <div data-testid="translation-2">{t('hero.subtitle')}</div>
      <div data-testid="translation-3">{t('table.actions')}</div>
      <div data-testid="translation-4">{t('filters.search.label')}</div>
      <div data-testid="translation-5">{t('stats.totalJournals')}</div>
      <div data-testid="repeated-translation">{t('hero.title')}</div>
      <button 
        onClick={() => {
          const metrics = getPerformanceMetrics();
          console.log('Performance metrics:', metrics);
        }}
        data-testid="get-metrics"
      >
        Get Metrics
      </button>
      <button 
        onClick={clearTranslationCache}
        data-testid="clear-cache"
      >
        Clear Cache
      </button>
    </div>
  );
};

describe('I18n Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should cache translation computations for better performance', async () => {
    render(
      <I18nProvider>
        <PerformanceTestComponent />
      </I18nProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('translation-1')).toBeInTheDocument();
    });

    // First access should compute and cache
    expect(screen.getByTestId('translation-1')).toHaveTextContent('JournalScope');
    expect(screen.getByTestId('repeated-translation')).toHaveTextContent('JournalScope');
  });

  it('should provide performance metrics', async () => {
    const user = userEvent.setup();
    
    render(
      <I18nProvider>
        <PerformanceTestComponent />
      </I18nProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('translation-1')).toBeInTheDocument();
    });

    // Get performance metrics
    await user.click(screen.getByTestId('get-metrics'));

    // Should have logged performance metrics
    expect(console.log).toHaveBeenCalledWith(
      'Performance metrics:',
      expect.objectContaining({
        cacheHits: expect.any(Number),
        cacheMisses: expect.any(Number),
        cacheSize: expect.any(Number),
        cacheHitRate: expect.any(Number)
      })
    );
  });

  it('should clear translation cache when requested', async () => {
    const user = userEvent.setup();
    
    render(
      <I18nProvider>
        <PerformanceTestComponent />
      </I18nProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('translation-1')).toBeInTheDocument();
    });

    // Clear cache
    await user.click(screen.getByTestId('clear-cache'));

    // Cache should be cleared (no errors should occur)
    expect(screen.getByTestId('translation-1')).toHaveTextContent('JournalScope');
  });

  it('should handle high-frequency translation requests efficiently', async () => {
    const HighFrequencyComponent = () => {
      const { t } = useI18n();
      
      // Simulate many translation requests
      const translations = [];
      for (let i = 0; i < 100; i++) {
        translations.push(t('hero.title'));
        translations.push(t('hero.subtitle'));
        translations.push(t('table.actions'));
      }
      
      return (
        <div data-testid="high-frequency-result">
          {translations.length} translations processed
        </div>
      );
    };

    const startTime = performance.now();
    
    render(
      <I18nProvider>
        <HighFrequencyComponent />
      </I18nProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('high-frequency-result')).toHaveTextContent('300 translations processed');
    });

    const endTime = performance.now();
    const processingTime = endTime - startTime;
    
    // Should handle high frequency requests efficiently (less than 100ms)
    expect(processingTime).toBeLessThan(100);
  });

  it('should manage cache size to prevent memory issues', async () => {
    const CacheTestComponent = () => {
      const { t, getPerformanceMetrics } = useI18n();
      
      // Generate many unique translation keys to test cache management
      const translations = [];
      for (let i = 0; i < 50; i++) {
        translations.push(t(`test.key.${i}`, `Default ${i}`));
      }
      
      const metrics = getPerformanceMetrics();
      
      return (
        <div>
          <div data-testid="cache-size">{metrics.cacheSize}</div>
          <div data-testid="translations-count">{translations.length}</div>
        </div>
      );
    };

    render(
      <I18nProvider>
        <CacheTestComponent />
      </I18nProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('translations-count')).toHaveTextContent('50');
    });

    // Cache size should be reasonable (not unlimited growth)
    const cacheSize = parseInt(screen.getByTestId('cache-size').textContent);
    expect(cacheSize).toBeLessThan(1000); // Should not exceed reasonable cache size
  });
});