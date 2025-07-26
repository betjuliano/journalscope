import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { I18nProvider, useI18n } from '../contexts/I18nContext';

// Mock localStorage for integration testing
const createMockStorage = () => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = String(value);
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }),
    _getStore: () => ({ ...store }),
    _reset: () => {
      store = {};
    }
  };
};

// Integration test component
const IntegrationTestComponent = () => {
  const { 
    language, 
    setLanguage, 
    isLoading, 
    getStorageStatus,
    t
  } = useI18n();
  
  const [storageStatus, setStorageStatus] = React.useState(null);
  
  React.useEffect(() => {
    setStorageStatus(getStorageStatus());
  }, [getStorageStatus, language]);
  
  return (
    <div>
      <div data-testid="language">{language}</div>
      <div data-testid="loading">{isLoading.toString()}</div>
      <div data-testid="translation">{t('search.placeholder', 'Search...')}</div>
      <div data-testid="storage-status">
        {storageStatus ? JSON.stringify(storageStatus) : 'loading'}
      </div>
      <button onClick={() => setLanguage('en')} data-testid="set-english">
        Set English
      </button>
      <button onClick={() => setLanguage('pt')} data-testid="set-portuguese">
        Set Portuguese
      </button>
      <button onClick={() => setLanguage('invalid')} data-testid="set-invalid">
        Set Invalid
      </button>
    </div>
  );
};

describe('Language Persistence - Integration Tests', () => {
  let mockStorage;

  beforeEach(() => {
    mockStorage = createMockStorage();
    global.localStorage = mockStorage;
    
    // Reset mocks
    vi.clearAllMocks();
    mockStorage._reset();
  });

  it('should demonstrate complete language persistence workflow', async () => {
    // Initial render with default language
    const { rerender } = render(
      <I18nProvider>
        <IntegrationTestComponent />
      </I18nProvider>
    );

    // Should start with default language
    expect(screen.getByTestId('language')).toHaveTextContent('pt');
    
    // Change to English
    const englishButton = screen.getByTestId('set-english');
    await act(async () => {
      englishButton.click();
    });

    // Should update immediately
    expect(screen.getByTestId('language')).toHaveTextContent('en');
    
    // Should have saved to localStorage
    expect(mockStorage.setItem).toHaveBeenCalledWith('journalscope_language', 'en');
    
    // Simulate page reload by re-rendering with fresh provider
    rerender(
      <I18nProvider>
        <IntegrationTestComponent />
      </I18nProvider>
    );

    // Should load saved preference
    await waitFor(() => {
      expect(screen.getByTestId('language')).toHaveTextContent('en');
    });
  });

  it('should handle localStorage failures gracefully', async () => {
    // Mock localStorage to throw errors
    mockStorage.setItem.mockImplementation(() => {
      throw new Error('localStorage full');
    });

    render(
      <I18nProvider>
        <IntegrationTestComponent />
      </I18nProvider>
    );

    const englishButton = screen.getByTestId('set-english');
    
    // Should not throw error even if localStorage fails
    await act(async () => {
      englishButton.click();
    });

    // UI should still update
    expect(screen.getByTestId('language')).toHaveTextContent('en');
  });

  it('should validate and clean up invalid stored languages', async () => {
    // Pre-populate localStorage with invalid language
    mockStorage._getStore()['journalscope_language'] = 'invalid_lang';
    mockStorage.getItem.mockReturnValue('invalid_lang');

    render(
      <I18nProvider>
        <IntegrationTestComponent />
      </I18nProvider>
    );

    // Should fallback to default language
    expect(screen.getByTestId('language')).toHaveTextContent('pt');
    
    // Should attempt to clean up invalid value
    await waitFor(() => {
      expect(mockStorage.setItem).toHaveBeenCalledWith('journalscope_language', 'pt');
    });
  });

  it('should provide storage status information', async () => {
    render(
      <I18nProvider>
        <IntegrationTestComponent />
      </I18nProvider>
    );

    await waitFor(() => {
      const statusElement = screen.getByTestId('storage-status');
      const status = JSON.parse(statusElement.textContent);
      
      expect(status).toHaveProperty('isAvailable');
      expect(status).toHaveProperty('activeLanguage');
      expect(status).toHaveProperty('currentStoredLanguage');
    });
  });

  it('should handle rapid language changes correctly', async () => {
    render(
      <I18nProvider>
        <IntegrationTestComponent />
      </I18nProvider>
    );

    const englishButton = screen.getByTestId('set-english');
    const portugueseButton = screen.getByTestId('set-portuguese');

    // Rapid changes
    await act(async () => {
      englishButton.click();
      portugueseButton.click();
      englishButton.click();
    });

    // Should end up with the last change
    expect(screen.getByTestId('language')).toHaveTextContent('en');
    
    // Should have persisted the final state
    expect(mockStorage.setItem).toHaveBeenLastCalledWith('journalscope_language', 'en');
  });
});