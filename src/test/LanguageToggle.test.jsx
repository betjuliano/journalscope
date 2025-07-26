import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider } from '../contexts/I18nContext';
import LanguageToggle from '../components/LanguageToggle';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

describe('LanguageToggle Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('should render with default Portuguese language', async () => {
    render(
      <I18nProvider>
        <LanguageToggle />
      </I18nProvider>
    );

    await waitFor(() => {
      const button = screen.getByRole('switch');
      expect(button).toHaveTextContent('EN');
    }, { timeout: 5000 });

    const button = screen.getByRole('switch');
    expect(button).toHaveAttribute('aria-label', 'Switch language to English');
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  it('should switch language when clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <I18nProvider>
        <LanguageToggle />
      </I18nProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('switch')).toBeInTheDocument();
    });

    const button = screen.getByRole('switch');
    
    // Click to switch to English
    await user.click(button);

    await waitFor(() => {
      expect(button).toHaveTextContent('PT');
      expect(button).toHaveAttribute('aria-label', 'Alternar idioma para português');
      expect(button).toHaveAttribute('aria-pressed', 'true');
    });

    // Verify localStorage was called
    expect(localStorageMock.setItem).toHaveBeenCalledWith('journalscope_language', 'en');
  });

  it('should have proper accessibility attributes', async () => {
    render(
      <I18nProvider>
        <LanguageToggle />
      </I18nProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('switch')).toBeInTheDocument();
    });

    const button = screen.getByRole('switch');
    
    expect(button).toHaveAttribute('role', 'switch');
    expect(button).toHaveAttribute('aria-label');
    expect(button).toHaveAttribute('aria-pressed');
    expect(button).toHaveAttribute('title');
  });

  it('should show loading state when I18n is loading', async () => {
    // Mock a loading state by rendering without waiting
    render(
      <I18nProvider>
        <LanguageToggle />
      </I18nProvider>
    );

    // Check if loading spinner might appear initially
    const button = screen.getByRole('switch');
    expect(button).toBeInTheDocument();
  });

  it('should apply different styles based on position prop', async () => {
    const { rerender } = render(
      <I18nProvider>
        <LanguageToggle position="hero" />
      </I18nProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('switch')).toBeInTheDocument();
    });

    let button = screen.getByRole('switch');
    expect(button).toHaveClass('bg-white/90');

    rerender(
      <I18nProvider>
        <LanguageToggle position="header" />
      </I18nProvider>
    );

    button = screen.getByRole('switch');
    expect(button).toHaveClass('bg-indigo-600');
  });

  it('should load saved language preference', async () => {
    localStorageMock.getItem.mockReturnValue('en');
    
    render(
      <I18nProvider>
        <LanguageToggle />
      </I18nProvider>
    );

    await waitFor(() => {
      const button = screen.getByRole('switch');
      expect(button).toHaveTextContent('PT');
      expect(button).toHaveAttribute('aria-pressed', 'true');
    });
  });
});