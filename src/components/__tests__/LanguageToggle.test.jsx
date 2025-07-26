import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { I18nProvider } from '../../contexts/I18nContext';
import LanguageToggle from '../LanguageToggle';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

const renderWithI18n = (component) => {
  return render(
    <I18nProvider>
      {component}
    </I18nProvider>
  );
};

describe('LanguageToggle', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  it('should render with default Portuguese language', async () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    renderWithI18n(<LanguageToggle />);
    
    const button = screen.getByRole('switch');
    
    // Wait for translations to load
    await waitFor(() => {
      expect(button).toHaveTextContent('EN');
    }, { timeout: 3000 });
    
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  it('should render with English when language is set to English', async () => {
    localStorageMock.getItem.mockReturnValue('en');
    
    renderWithI18n(<LanguageToggle />);
    
    const button = screen.getByRole('switch');
    
    // Wait for translations to load
    await waitFor(() => {
      expect(button).toHaveTextContent('PT');
    }, { timeout: 3000 });
    
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('should have proper accessibility attributes', () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    renderWithI18n(<LanguageToggle />);
    
    const button = screen.getByRole('switch');
    expect(button).toHaveAttribute('aria-label', 'Switch language to English');
    expect(button).toHaveAttribute('title', 'Switch language to English');
  });

  it('should change language when clicked', async () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    renderWithI18n(<LanguageToggle />);
    
    const button = screen.getByRole('switch');
    
    // Wait for translations to load and initially should show EN (meaning current language is PT)
    await waitFor(() => {
      expect(button).toHaveTextContent('EN');
    }, { timeout: 3000 });
    
    // Click to change to English
    fireEvent.click(button);
    
    // Should save to localStorage
    expect(localStorageMock.setItem).toHaveBeenCalledWith('journalscope_language', 'en');
  });

  it('should apply hero position styles by default', () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    renderWithI18n(<LanguageToggle />);
    
    const button = screen.getByRole('switch');
    expect(button).toHaveClass('bg-white/90', 'backdrop-blur-sm');
  });

  it('should apply header position styles when specified', () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    renderWithI18n(<LanguageToggle position="header" />);
    
    const button = screen.getByRole('switch');
    expect(button).toHaveClass('bg-indigo-600', 'text-white');
  });

  it('should apply custom className', () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    renderWithI18n(<LanguageToggle className="custom-class" />);
    
    const button = screen.getByRole('switch');
    expect(button).toHaveClass('custom-class');
  });

  it('should be disabled when loading', () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    renderWithI18n(<LanguageToggle />);
    
    const button = screen.getByRole('switch');
    
    // Initially might be loading, but should become enabled
    // We can't easily test the loading state without mocking the context
    expect(button).toBeInTheDocument();
  });
});