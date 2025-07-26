import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { I18nProvider, useI18n } from './I18nContext';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Test component that uses the I18n context
const TestComponent = () => {
  const { language, setLanguage, t, isLoading } = useI18n();
  
  return (
    <div>
      <div data-testid="language">{language}</div>
      <div data-testid="loading">{isLoading.toString()}</div>
      <div data-testid="translation">{t('hero.title')}</div>
      <button onClick={() => setLanguage('en')} data-testid="change-language">
        Change to English
      </button>
    </div>
  );
};

describe('I18nContext', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  it('should provide default language as Portuguese', async () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );

    expect(screen.getByTestId('language')).toHaveTextContent('pt');
  });

  it('should load saved language from localStorage', async () => {
    localStorageMock.getItem.mockReturnValue('en');
    
    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );

    expect(screen.getByTestId('language')).toHaveTextContent('en');
  });

  it('should provide translation function', async () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );

    // Wait for translations to load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    const translationElement = screen.getByTestId('translation');
    expect(translationElement).toHaveTextContent('JournalScope');
  });

  it('should save language preference to localStorage when changed', async () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );

    const changeButton = screen.getByTestId('change-language');
    
    await act(async () => {
      changeButton.click();
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith('journalscope_language', 'en');
    expect(screen.getByTestId('language')).toHaveTextContent('en');
  });

  it('should handle localStorage errors gracefully', async () => {
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error('localStorage error');
    });
    
    // Should not throw error and use default language
    expect(() => {
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );
    }).not.toThrow();

    expect(screen.getByTestId('language')).toHaveTextContent('pt');
  });
});