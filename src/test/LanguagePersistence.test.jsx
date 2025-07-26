import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { I18nProvider, useI18n } from '../contexts/I18nContext';

// Mock localStorage with comprehensive functionality
const createLocalStorageMock = () => {
  let store = {};
  let quotaExceeded = false;
  let disabled = false;

  return {
    getItem: vi.fn((key) => {
      if (disabled) throw new Error('localStorage disabled');
      return store[key] || null;
    }),
    setItem: vi.fn((key, value) => {
      if (disabled) throw new Error('localStorage disabled');
      if (quotaExceeded) throw new DOMException('QuotaExceededError');
      store[key] = String(value);
    }),
    removeItem: vi.fn((key) => {
      if (disabled) throw new Error('localStorage disabled');
      delete store[key];
    }),
    clear: vi.fn(() => {
      if (disabled) throw new Error('localStorage disabled');
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }),
    // Test utilities
    _setQuotaExceeded: (value) => { quotaExceeded = value; },
    _setDisabled: (value) => { disabled = value; },
    _getStore: () => ({ ...store }),
    _reset: () => {
      store = {};
      quotaExceeded = false;
      disabled = false;
    }
  };
};

const localStorageMock = createLocalStorageMock();
global.localStorage = localStorageMock;

// Test component for language persistence
const LanguagePersistenceTestComponent = () => {
  const { 
    language, 
    setLanguage, 
    isLoading, 
    getStorageStatus, 
    reloadLanguageFromStorage,
    storageUtils 
  } = useI18n();
  
  return (
    <div>
      <div data-testid="language">{language}</div>
      <div data-testid="loading">{isLoading.toString()}</div>
      <button 
        onClick={() => setLanguage('en')} 
        data-testid="set-english"
      >
        Set English
      </button>
      <button 
        onClick={() => setLanguage('pt')} 
        data-testid="set-portuguese"
      >
        Set Portuguese
      </button>
      <button 
        onClick={() => setLanguage('invalid')} 
        data-testid="set-invalid"
      >
        Set Invalid
      </button>
      <button 
        onClick={reloadLanguageFromStorage} 
        data-testid="reload-from-storage"
      >
        Reload from Storage
      </button>
      <div data-testid="storage-available">
        {storageUtils.isAvailable().toString()}
      </div>
      <div data-testid="storage-status">
        {JSON.stringify(getStorageStatus())}
      </div>
    </div>
  );
};

describe('Language Persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock._reset();
  });

  describe('Initial Language Loading', () => {
    it('should use default language when no preference is saved', async () => {
      render(
        <I18nProvider>
          <LanguagePersistenceTestComponent />
        </I18nProvider>
      );

      expect(screen.getByTestId('language')).toHaveTextContent('pt');
      expect(localStorageMock.getItem).toHaveBeenCalledWith('journalscope_language');
    });

    it('should load saved language preference on startup', async () => {
      localStorageMock.getItem.mockReturnValue('en');
      
      render(
        <I18nProvider>
          <LanguagePersistenceTestComponent />
        </I18nProvider>
      );

      expect(screen.getByTestId('language')).toHaveTextContent('en');
    });

    it('should handle invalid saved language gracefully', async () => {
      localStorageMock.getItem.mockReturnValue('invalid_lang');
      
      render(
        <I18nProvider>
          <LanguagePersistenceTestComponent />
        </I18nProvider>
      );

      expect(screen.getByTestId('language')).toHaveTextContent('pt');
      // Should attempt to clean up invalid value
      expect(localStorageMock.setItem).toHaveBeenCalledWith('journalscope_language', 'pt');
    });
  });

  describe('Language Change and Persistence', () => {
    it('should save language preference when changed', async () => {
      render(
        <I18nProvider>
          <LanguagePersistenceTestComponent />
        </I18nProvider>
      );

      const englishButton = screen.getByTestId('set-english');
      
      await act(async () => {
        englishButton.click();
      });

      expect(screen.getByTestId('language')).toHaveTextContent('en');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('journalscope_language', 'en');
    });

    it('should update UI immediately without page reload', async () => {
      render(
        <I18nProvider>
          <LanguagePersistenceTestComponent />
        </I18nProvider>
      );

      const englishButton = screen.getByTestId('set-english');
      
      await act(async () => {
        englishButton.click();
      });

      // UI should update immediately
      expect(screen.getByTestId('language')).toHaveTextContent('en');
      
      // Switch back
      const portugueseButton = screen.getByTestId('set-portuguese');
      
      await act(async () => {
        portugueseButton.click();
      });

      expect(screen.getByTestId('language')).toHaveTextContent('pt');
    });

    it('should handle invalid language input gracefully', async () => {
      render(
        <I18nProvider>
          <LanguagePersistenceTestComponent />
        </I18nProvider>
      );

      const invalidButton = screen.getByTestId('set-invalid');
      
      await act(async () => {
        invalidButton.click();
      });

      // Should fallback to default language
      expect(screen.getByTestId('language')).toHaveTextContent('pt');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('journalscope_language', 'pt');
    });

    it('should not update if language is already set', async () => {
      render(
        <I18nProvider>
          <LanguagePersistenceTestComponent />
        </I18nProvider>
      );

      // Set to Portuguese (already default)
      const portugueseButton = screen.getByTestId('set-portuguese');
      
      await act(async () => {
        portugueseButton.click();
      });

      // Should not call setItem since language didn't change
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });
  });

  describe('localStorage Error Handling', () => {
    it('should handle localStorage read errors gracefully', async () => {
      localStorageMock._setDisabled(true);
      
      // Should not throw error
      expect(() => {
        render(
          <I18nProvider>
            <LanguagePersistenceTestComponent />
          </I18nProvider>
        );
      }).not.toThrow();

      expect(screen.getByTestId('language')).toHaveTextContent('pt');
      expect(screen.getByTestId('storage-available')).toHaveTextContent('false');
    });

    it('should handle localStorage write errors gracefully', async () => {
      localStorageMock._setQuotaExceeded(true);
      
      render(
        <I18nProvider>
          <LanguagePersistenceTestComponent />
        </I18nProvider>
      );

      const englishButton = screen.getByTestId('set-english');
      
      await act(async () => {
        englishButton.click();
      });

      // UI should still update even if persistence fails
      expect(screen.getByTestId('language')).toHaveTextContent('en');
    });

    it('should handle quota exceeded error with cleanup attempt', async () => {
      // Add some old data to localStorage
      localStorageMock.setItem('journalscope_old_data', 'old_value');
      localStorageMock.setItem('other_app_data', 'other_value');
      
      // Reset mocks after setup
      vi.clearAllMocks();
      
      // Set quota exceeded for new writes
      localStorageMock.setItem.mockImplementation((key, value) => {
        if (key === 'journalscope_language') {
          // First call throws quota exceeded
          if (localStorageMock.setItem.mock.calls.length === 1) {
            throw new DOMException('QuotaExceededError');
          }
          // Second call (after cleanup) succeeds
          return;
        }
        // Other calls work normally
      });

      render(
        <I18nProvider>
          <LanguagePersistenceTestComponent />
        </I18nProvider>
      );

      const englishButton = screen.getByTestId('set-english');
      
      await act(async () => {
        englishButton.click();
      });

      // Should attempt to set twice (initial failure, then retry after cleanup)
      expect(localStorageMock.setItem).toHaveBeenCalledTimes(2);
      expect(screen.getByTestId('language')).toHaveTextContent('en');
    });
  });

  describe('Storage Status and Debugging', () => {
    it('should provide storage status information', async () => {
      render(
        <I18nProvider>
          <LanguagePersistenceTestComponent />
        </I18nProvider>
      );

      await waitFor(() => {
        const statusElement = screen.getByTestId('storage-status');
        const status = JSON.parse(statusElement.textContent);
        
        expect(status).toHaveProperty('isAvailable');
        expect(status).toHaveProperty('currentStoredLanguage');
        expect(status).toHaveProperty('activeLanguage');
        expect(status).toHaveProperty('isLanguagePersisted');
      });
    });

    it('should reload language from storage', async () => {
      render(
        <I18nProvider>
          <LanguagePersistenceTestComponent />
        </I18nProvider>
      );

      // Manually change localStorage
      localStorageMock.setItem('journalscope_language', 'en');
      
      const reloadButton = screen.getByTestId('reload-from-storage');
      
      await act(async () => {
        reloadButton.click();
      });

      expect(screen.getByTestId('language')).toHaveTextContent('en');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null language input', async () => {
      render(
        <I18nProvider>
          <LanguagePersistenceTestComponent />
        </I18nProvider>
      );

      const { setLanguage } = screen.getByTestId('language').closest('div').__reactInternalInstance?.memoizedProps || {};
      
      await act(async () => {
        // This would be called programmatically
        const context = React.useContext(require('../contexts/I18nContext').default);
        context.setLanguage(null);
      });

      // Should fallback to default
      expect(screen.getByTestId('language')).toHaveTextContent('pt');
    });

    it('should handle empty string language input', async () => {
      render(
        <I18nProvider>
          <LanguagePersistenceTestComponent />
        </I18nProvider>
      );

      // This test would need to be implemented with a custom component
      // that can call setLanguage with empty string
    });

    it('should handle whitespace in language input', async () => {
      // Similar to above - would need custom component to test programmatic calls
    });
  });
});