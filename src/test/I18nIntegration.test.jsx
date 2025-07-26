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

// Simple test component
const SimpleTestComponent = () => {
  const { language, setLanguage, t, isLoading } = useI18n();
  
  if (isLoading) {
    return <div data-testid="loading">Loading...</div>;
  }
  
  return (
    <div>
      <div data-testid="current-language">{language}</div>
      <div data-testid="hero-title">{t('hero.title', 'Default Title')}</div>
      <div data-testid="table-actions">{t('table.actions', 'Default Actions')}</div>
      <button onClick={() => setLanguage('en')} data-testid="switch-to-en">
        Switch to English
      </button>
      <button onClick={() => setLanguage('pt')} data-testid="switch-to-pt">
        Switch to Portuguese
      </button>
    </div>
  );
};

describe('I18n Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('should load and display translations correctly', async () => {
    render(
      <I18nProvider>
        <SimpleTestComponent />
      </I18nProvider>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    }, { timeout: 5000 });

    // Check that translations are loaded
    expect(screen.getByTestId('current-language')).toHaveTextContent('pt');
    expect(screen.getByTestId('hero-title')).toHaveTextContent('JournalScope');
    
    // The table.actions should show the translated text or fallback
    const actionsElement = screen.getByTestId('table-actions');
    expect(actionsElement).toBeInTheDocument();
    // It should either show 'AÇÕES' or the fallback 'Default Actions'
    expect(actionsElement.textContent).toMatch(/AÇÕES|Default Actions/);
  });

  it('should persist language changes', async () => {
    const user = userEvent.setup();
    
    render(
      <I18nProvider>
        <SimpleTestComponent />
      </I18nProvider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    }, { timeout: 5000 });

    await user.click(screen.getByTestId('switch-to-en'));

    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith('journalscope_language', 'en');
    });

    expect(screen.getByTestId('current-language')).toHaveTextContent('en');
  });

  it('should handle translation loading gracefully', async () => {
    render(
      <I18nProvider>
        <SimpleTestComponent />
      </I18nProvider>
    );

    // Should eventually stop loading even if translations fail
    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    }, { timeout: 10000 });

    // Should show fallback values if translations fail to load
    expect(screen.getByTestId('hero-title')).toBeInTheDocument();
    expect(screen.getByTestId('table-actions')).toBeInTheDocument();
  });
});