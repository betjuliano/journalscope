import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
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

// Test component that uses the I18n context
const TestComponent = () => {
  const { language, setLanguage, t, isLoading } = useI18n();
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  return (
    <div>
      <div data-testid="current-language">{language}</div>
      <div data-testid="hero-title">{t('hero.title')}</div>
      <div data-testid="hero-subtitle">{t('hero.subtitle')}</div>
      <div data-testid="table-actions">{t('table.actions')}</div>
      <div data-testid="fallback-test">{t('nonexistent.key', 'Fallback Text')}</div>
      <button onClick={() => setLanguage('en')} data-testid="switch-to-en">
        Switch to English
      </button>
      <button onClick={() => setLanguage('pt')} data-testid="switch-to-pt">
        Switch to Portuguese
      </button>
    </div>
  );
};

describe('I18nContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('should provide default Portuguese language', async () => {
    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('current-language')).toHaveTextContent('pt');
    expect(screen.getByTestId('hero-title')).toHaveTextContent('JournalScope');
    expect(screen.getByTestId('hero-subtitle')).toHaveTextContent('Sistema Integrado de Consulta de Journals Acadêmicos');
    expect(screen.getByTestId('table-actions')).toHaveTextContent('AÇÕES');
  });

  it('should switch to English when setLanguage is called', async () => {
    const user = userEvent.setup();
    
    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    await user.click(screen.getByTestId('switch-to-en'));

    await waitFor(() => {
      expect(screen.getByTestId('current-language')).toHaveTextContent('en');
      expect(screen.getByTestId('hero-subtitle')).toHaveTextContent('Integrated Academic Journal Query System');
      expect(screen.getByTestId('table-actions')).toHaveTextContent('Actions');
    });
  });

  it('should persist language preference to localStorage', async () => {
    const user = userEvent.setup();
    
    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    await user.click(screen.getByTestId('switch-to-en'));

    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith('journalscope_language', 'en');
    });
  });

  it('should load saved language preference from localStorage', async () => {
    localStorageMock.getItem.mockReturnValue('en');
    
    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('current-language')).toHaveTextContent('en');
    expect(screen.getByTestId('table-actions')).toHaveTextContent('Actions');
  });

  it('should provide fallback text for missing translation keys', async () => {
    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('fallback-test')).toHaveTextContent('Fallback Text');
  });

  it('should handle localStorage errors gracefully', async () => {
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error('localStorage error');
    });
    
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('current-language')).toHaveTextContent('pt');
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to load language preference from localStorage:',
      expect.any(Error)
    );
    
    consoleSpy.mockRestore();
  });

  it('should throw error when useI18n is used outside provider', () => {
    const TestComponentOutsideProvider = () => {
      useI18n();
      return <div>Test</div>;
    };

    expect(() => {
      render(<TestComponentOutsideProvider />);
    }).toThrow('useI18n must be used within an I18nProvider');
  });
});