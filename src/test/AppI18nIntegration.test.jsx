import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { I18nProvider, useI18n } from '../contexts/I18nContext';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Simple component to test I18n integration
const TestI18nIntegration = () => {
  const { language, t, isLoading } = useI18n();
  
  if (isLoading) {
    return <div data-testid="i18n-loading">Loading translations...</div>;
  }
  
  return (
    <div data-testid="i18n-integration">
      <div data-testid="language">{language}</div>
      <div data-testid="hero-title">{t('hero.title', 'JournalScope')}</div>
      <div data-testid="table-actions">{t('table.actions', 'Actions')}</div>
    </div>
  );
};

describe('App I18n Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('should provide I18n context to components', async () => {
    render(
      <I18nProvider>
        <TestI18nIntegration />
      </I18nProvider>
    );

    // Should eventually load
    expect(await screen.findByTestId('i18n-integration', {}, { timeout: 5000 })).toBeInTheDocument();
    
    // Should have default language
    expect(screen.getByTestId('language')).toHaveTextContent('pt');
    
    // Should have translations or fallbacks
    expect(screen.getByTestId('hero-title')).toHaveTextContent('JournalScope');
    expect(screen.getByTestId('table-actions')).toBeInTheDocument();
  });

  it('should handle I18n context availability', () => {
    // Test that the context is available when wrapped
    const TestComponent = () => {
      try {
        const { language } = useI18n();
        return <div data-testid="context-available">{language}</div>;
      } catch (error) {
        return <div data-testid="context-error">{error.message}</div>;
      }
    };

    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );

    expect(screen.getByTestId('context-available')).toBeInTheDocument();
  });
});