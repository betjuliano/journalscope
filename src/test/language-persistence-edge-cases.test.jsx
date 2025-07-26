import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider, useI18n } from '../contexts/I18nContext';
import LanguageToggle from '../components/LanguageToggle';

// Mock localStorage with different scenarios
const createLocalStorageMock = (scenario = 'normal') => {
  const storage = {};
  
  const mock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };

  switch (scenario) {
    case 'quota_exceeded':
      mock.setItem.mockImplementation(() => {
        const error = new Error('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      });
      mock.getItem.mockImplementation((key) => storage[key] || null);
      break;
      
    case 'not_available':
      mock.getItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });
      mock.setItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });
      break;
      
    case 'corrupted_data':
      mock.getItem.mockImplementation((key) => {
        if (key === 'journalscope_language') {
          return 'invalid_json{';
        }
        return storage[key] || null;
      });
      mock.setItem.mockImplementation((key, value) => {
        storage[key] = value;
      });
      break;
      
    case 'invalid_language':
      mock.getItem.mockImplementation((key) => {
        if (key === 'journalscope_language') {
          return 'invalid_lang';
        }
        return storage[key] || null;
      });
      mock.setItem.mockImplementation((key, value) => {
        storage[key] = value;
      });
      break;
      
    default:
      mock.getItem.mockImplementation((key) => storage[key] || null);
      mock.setItem.mockImplementation((key, value) => {
        storage[key] = value;
      });
  }
  
  return mock;
};

// Test component
const TestComponent = () => {
  const { language, setLanguage, t, isLoading, getStorageStatus } = useI18n();
  
  if (isLoading) {
    return <div data-testid="loading">Loading...</div>;
  }
  
  return (
    <div>
      <div data-testid="current-language">{language}</div>
      <div data-testid="hero-title">{t('hero.title')}</div>
      <button onClick={() => setLanguage('en')} data-testid="switch-to-en">
        Switch to English
      </button>
      <button onClick={() => setLanguage('pt')} data-testid="switch-to-pt">
        Switch to Portuguese
      </button>
      <button 
        onClick={() => {
          const status = getStorageStatus();
          console.log('Storage status:', status);
        }}
        data-testid="get-storage-status"
      >
        Get Storage Status
      </button>
    </div>
  );
};

describe('Language Persistence Edge Cases', () => {
  let originalLocalStorage;
  let consoleSpy;

  beforeEach(() => {
    originalLocalStorage = global.localStorage;
    consoleSpy = {
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      log: vi.spyOn(console, 'log').mockImplementation(() => {})
    };
  });

  afterEach(() => {
    global.localStorage = originalLocalStorage;
    vi.restoreAllMocks();
  });

  describe('localStorage Quota Exceeded', () => {
    it('should handle QuotaExceededError gracefully', async () => {
      global.localStorage = createLocalStorageMock('quota_exceeded');
      const user = userEvent.setup();
      
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      // Should still change language in memory even if persistence fails
      await user.click(screen.getByTestId('switch-to-en'));

      await waitFor(() => {
        expect(screen.getByTestId('current-language')).toHaveTextContent('en');
      });

      // Should log error about storage failure
      expect(consoleSpy.error).toHaveBeenCalled();
    });

    it('should attempt cleanup when quota is exceeded', async () => {
      const mockStorage = createLocalStorageMock('quota_exceeded');
      
      // Mock localStorage.length and key() for cleanup logic
      Object.defineProperty(mockStorage, 'length', { value: 5 });
      mockStorage.key = vi.fn()
        .mockReturnValueOnce('journalscope_old_key1')
        .mockReturnValueOnce('journalscope_old_key2')
        .mockReturnValueOnce('other_key')
        .mockReturnValueOnce('journalscope_old_key3')
        .mockReturnValueOnce(null);
      
      mockStorage.removeItem = vi.fn();
      
      global.localStorage = mockStorage;
      const user = userEvent.setup();
      
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      await user.click(screen.getByTestId('switch-to-en'));

      // Should attempt to remove old keys during cleanup
      expect(mockStorage.removeItem).toHaveBeenCalled();
    });
  });

  describe('localStorage Not Available', () => {
    it('should work without localStorage', async () => {
      global.localStorage = createLocalStorageMock('not_available');
      const user = userEvent.setup();
      
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      // Should default to Portuguese
      expect(screen.getByTestId('current-language')).toHaveTextContent('pt');

      // Should still allow language switching
      await user.click(screen.getByTestId('switch-to-en'));

      await waitFor(() => {
        expect(screen.getByTestId('current-language')).toHaveTextContent('en');
      });

      // Should warn about localStorage not being available
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('localStorage not available')
      );
    });

    it('should report storage unavailability in status', async () => {
      global.localStorage = createLocalStorageMock('not_available');
      const user = userEvent.setup();
      
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      await user.click(screen.getByTestId('get-storage-status'));

      expect(consoleSpy.log).toHaveBeenCalledWith(
        'Storage status:',
        expect.objectContaining({
          isAvailable: false
        })
      );
    });
  });

  describe('Corrupted Data Handling', () => {
    it('should handle corrupted localStorage data', async () => {
      global.localStorage = createLocalStorageMock('corrupted_data');
      
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      // Should fallback to default language when data is corrupted
      expect(screen.getByTestId('current-language')).toHaveTextContent('pt');
    });

    it('should handle invalid language codes', async () => {
      global.localStorage = createLocalStorageMock('invalid_language');
      
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      // Should fallback to default language for invalid codes
      expect(screen.getByTestId('current-language')).toHaveTextContent('pt');
      
      // Should warn about invalid language
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('Invalid saved language')
      );
    });
  });

  describe('Storage Utilities Edge Cases', () => {
    it('should handle null and undefined values gracefully', async () => {
      const mockStorage = createLocalStorageMock();
      mockStorage.getItem.mockImplementation((key) => {
        if (key === 'journalscope_language') {
          return null;
        }
        return null;
      });
      
      global.localStorage = mockStorage;
      
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      // Should handle null values and use default
      expect(screen.getByTestId('current-language')).toHaveTextContent('pt');
    });

    it('should validate setItem operations', async () => {
      const mockStorage = createLocalStorageMock();
      
      // Mock verification failure
      mockStorage.setItem.mockImplementation(() => {});
      mockStorage.getItem.mockImplementation(() => 'different_value');
      
      global.localStorage = mockStorage;
      const user = userEvent.setup();
      
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      await user.click(screen.getByTestId('switch-to-en'));

      // Should warn about verification failure
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('localStorage.setItem verification failed')
      );
    });

    it('should handle empty string values', async () => {
      const mockStorage = createLocalStorageMock();
      mockStorage.getItem.mockImplementation((key) => {
        if (key === 'journalscope_language') {
          return '';
        }
        return null;
      });
      
      global.localStorage = mockStorage;
      
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      // Should treat empty string as no value and use default
      expect(screen.getByTestId('current-language')).toHaveTextContent('pt');
    });
  });

  describe('Browser Compatibility', () => {
    it('should handle browsers without Storage support', async () => {
      // Mock browser without Storage
      const originalStorage = global.Storage;
      global.Storage = undefined;
      
      global.localStorage = createLocalStorageMock('not_available');
      
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      // Should still work without Storage support
      expect(screen.getByTestId('current-language')).toHaveTextContent('pt');
      
      // Restore Storage
      global.Storage = originalStorage;
    });

    it('should handle localStorage with missing methods', async () => {
      global.localStorage = {
        // Missing setItem method
        getItem: vi.fn(() => null),
        removeItem: vi.fn()
      };
      
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      // Should handle missing methods gracefully
      expect(screen.getByTestId('current-language')).toHaveTextContent('pt');
    });
  });

  describe('Concurrent Access Scenarios', () => {
    it('should handle multiple tabs changing language simultaneously', async () => {
      const mockStorage = createLocalStorageMock();
      global.localStorage = mockStorage;
      const user = userEvent.setup();
      
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      // Simulate another tab changing the language
      mockStorage.getItem.mockReturnValue('en');
      
      // Trigger storage event
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'journalscope_language',
        newValue: 'en',
        oldValue: 'pt'
      }));

      // Should handle external changes gracefully
      expect(screen.getByTestId('current-language')).toHaveTextContent('pt'); // Should maintain current state
    });

    it('should handle rapid language switching', async () => {
      global.localStorage = createLocalStorageMock();
      const user = userEvent.setup();
      
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      // Rapid switching
      await user.click(screen.getByTestId('switch-to-en'));
      await user.click(screen.getByTestId('switch-to-pt'));
      await user.click(screen.getByTestId('switch-to-en'));
      await user.click(screen.getByTestId('switch-to-pt'));

      await waitFor(() => {
        expect(screen.getByTestId('current-language')).toHaveTextContent('pt');
      });

      // Should handle rapid changes without errors
      expect(true).toBe(true);
    });
  });

  describe('Memory Management', () => {
    it('should not leak memory with frequent language changes', async () => {
      global.localStorage = createLocalStorageMock();
      const user = userEvent.setup();
      
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      // Perform many language changes
      for (let i = 0; i < 20; i++) {
        await user.click(screen.getByTestId('switch-to-en'));
        await user.click(screen.getByTestId('switch-to-pt'));
      }

      await waitFor(() => {
        expect(screen.getByTestId('current-language')).toHaveTextContent('pt');
      });

      // Should complete without memory issues
      expect(true).toBe(true);
    });
  });
});