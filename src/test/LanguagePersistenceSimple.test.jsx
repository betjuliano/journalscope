import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { I18nProvider, useI18n } from '../contexts/I18nContext';

// Simple test component
const TestComponent = () => {
  const { language, setLanguage, isLoading } = useI18n();
  
  return (
    <div>
      <div data-testid="language">{language}</div>
      <div data-testid="loading">{isLoading.toString()}</div>
      <button onClick={() => setLanguage('en')} data-testid="set-english">
        Set English
      </button>
      <button onClick={() => setLanguage('pt')} data-testid="set-portuguese">
        Set Portuguese
      </button>
    </div>
  );
};

describe('Language Persistence - Simple Tests', () => {
  beforeEach(() => {
    // Clear any existing localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  it('should render with default language', async () => {
    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );

    expect(screen.getByTestId('language')).toHaveTextContent('pt');
  });

  it('should change language when button is clicked', async () => {
    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );

    const englishButton = screen.getByTestId('set-english');
    
    await act(async () => {
      englishButton.click();
    });

    expect(screen.getByTestId('language')).toHaveTextContent('en');
  });

  it('should handle invalid language gracefully', async () => {
    const TestInvalidLanguage = () => {
      const { language, setLanguage } = useI18n();
      
      React.useEffect(() => {
        setLanguage('invalid');
      }, [setLanguage]);
      
      return <div data-testid="language">{language}</div>;
    };

    render(
      <I18nProvider>
        <TestInvalidLanguage />
      </I18nProvider>
    );

    // Should fallback to default language
    expect(screen.getByTestId('language')).toHaveTextContent('pt');
  });
});