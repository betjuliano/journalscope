import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider, useI18n } from '../contexts/I18nContext';
import LanguageToggle from '../components/LanguageToggle';
import ResultsTable from '../components/ResultsTable';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Mock performance API
global.performance = {
  now: vi.fn(() => Date.now()),
};

// Mock console methods to avoid noise in tests
const consoleMock = {
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// Test data for table tests
const mockJournalData = [
  {
    journal: 'Journal of Business Research',
    abdc: 'A',
    abs: '3',
    sjr: { quartile: 'Q1', hIndex: 150, score: 1.5 },
    jcr: { quartile: 'Q1', impactFactor: 4.2 },
    qualis: 'MB'
  },
  {
    journal: 'Very Long Journal Name That Exceeds Forty Characters And Should Auto Expand',
    abdc: 'B',
    abs: '2',
    sjr: { quartile: 'Q2', hIndex: 80, score: 1.1 },
    jcr: { quartile: 'Q2', impactFactor: 2.8 },
    qualis: 'B'
  },
  {
    journal: 'Short Name',
    abdc: 'C',
    abs: '1',
    sjr: { quartile: 'Q3', hIndex: 45, score: 0.8 },
    jcr: { quartile: 'Q3', impactFactor: 1.5 },
    qualis: 'R'
  }
];

// Test component that uses I18n context
const TestI18nComponent = () => {
  const { language, setLanguage, t, isLoading } = useI18n();
  
  if (isLoading) {
    return <div data-testid="loading">Loading...</div>;
  }
  
  return (
    <div>
      <div data-testid="current-language">{language}</div>
      <div data-testid="hero-title">{t('hero.title')}</div>
      <div data-testid="hero-subtitle">{t('hero.subtitle')}</div>
      <div data-testid="table-actions">{t('table.actions')}</div>
      <div data-testid="table-journal-column">{t('table.columns.journal')}</div>
      <div data-testid="table-qualis-column">{t('table.columns.qualis')}</div>
      <div data-testid="table-sjr-hindex-column">{t('table.columns.sjrHIndex')}</div>
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

describe('Comprehensive Test Suite - Task 12', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(consoleMock.log);
    vi.spyOn(console, 'warn').mockImplementation(consoleMock.warn);
    vi.spyOn(console, 'error').mockImplementation(consoleMock.error);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('I18n Context and Translation Functions', () => {
    it('should provide default Portuguese language and translations', async () => {
      render(
        <I18nProvider>
          <TestI18nComponent />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('current-language')).toHaveTextContent('pt');
      expect(screen.getByTestId('hero-title')).toHaveTextContent('JournalScope');
      expect(screen.getByTestId('hero-subtitle')).toHaveTextContent('Sistema Integrado de Consulta de Journals Acadêmicos');
      expect(screen.getByTestId('table-actions')).toHaveTextContent('AÇÕES');
    });

    it('should switch to English and provide English translations', async () => {
      const user = userEvent.setup();
      
      render(
        <I18nProvider>
          <TestI18nComponent />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      await user.click(screen.getByTestId('switch-to-en'));

      await waitFor(() => {
        expect(screen.getByTestId('current-language')).toHaveTextContent('en');
        expect(screen.getByTestId('hero-subtitle')).toHaveTextContent('Integrated Academic Journal Query System');
        expect(screen.getByTestId('table-actions')).toHaveTextContent('Actions');
      });
    });

    it('should provide fallback text for missing translation keys', async () => {
      render(
        <I18nProvider>
          <TestI18nComponent />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('fallback-test')).toHaveTextContent('Fallback Text');
    });

    it('should handle translation function with parameters', async () => {
      const TestParameterComponent = () => {
        const { t, isLoading } = useI18n();
        
        if (isLoading) return <div>Loading...</div>;
        
        return (
          <div data-testid="param-test">
            {t('test.withParams', 'Hello {name}!', { name: 'World' })}
          </div>
        );
      };

      render(
        <I18nProvider>
          <TestParameterComponent />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('param-test')).toHaveTextContent('Hello World!');
      });
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

  describe('Language Toggle Functionality and Persistence', () => {
    it('should render language toggle with correct initial state', async () => {
      render(
        <I18nProvider>
          <LanguageToggle />
        </I18nProvider>
      );

      await waitFor(() => {
        const button = screen.getByRole('switch');
        expect(button).toHaveTextContent('EN');
        expect(button).toHaveAttribute('aria-pressed', 'false');
        expect(button).toHaveAttribute('aria-label', 'Switch language to English');
      });
    });

    it('should toggle language when clicked and update UI', async () => {
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
        expect(button).toHaveAttribute('aria-pressed', 'true');
        expect(button).toHaveAttribute('aria-label', 'Alternar idioma para português');
      });
    });

    it('should persist language preference to localStorage', async () => {
      const user = userEvent.setup();
      
      render(
        <I18nProvider>
          <LanguageToggle />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.getByRole('switch')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('switch'));

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith('journalscope_language', 'en');
      });
    });

    it('should load saved language preference from localStorage', async () => {
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

    it('should handle localStorage errors gracefully', async () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });
      
      render(
        <I18nProvider>
          <TestI18nComponent />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      // Should fallback to default Portuguese
      expect(screen.getByTestId('current-language')).toHaveTextContent('pt');
      expect(consoleMock.warn).toHaveBeenCalled();
    });

    it('should handle localStorage setItem errors gracefully', async () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage setItem error');
      });
      
      const user = userEvent.setup();
      
      render(
        <I18nProvider>
          <LanguageToggle />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.getByRole('switch')).toBeInTheDocument();
      });

      // Should still change language even if persistence fails
      await user.click(screen.getByRole('switch'));

      await waitFor(() => {
        const button = screen.getByRole('switch');
        expect(button).toHaveTextContent('PT');
      });
    });
  });

  describe('Table Column Visibility Changes Based on Language', () => {
    it('should show Qualis column and hide SJR H-Index in Portuguese mode', async () => {
      render(
        <I18nProvider>
          <ResultsTable data={mockJournalData} />
        </I18nProvider>
      );

      await waitFor(() => {
        // Should show Qualis column header
        expect(screen.getByText('Qualis')).toBeInTheDocument();
        
        // Should not show SJR H-Index column header
        expect(screen.queryByText('SJR H-Index')).not.toBeInTheDocument();
      });
    });

    it('should hide Qualis column and show SJR H-Index in English mode', async () => {
      localStorageMock.getItem.mockReturnValue('en');
      
      render(
        <I18nProvider>
          <ResultsTable data={mockJournalData} />
        </I18nProvider>
      );

      await waitFor(() => {
        // Should show SJR H-Index column header
        expect(screen.getByText('SJR H-Index')).toBeInTheDocument();
        
        // Should not show Qualis column header
        expect(screen.queryByText('Qualis')).not.toBeInTheDocument();
      });
    });

    it('should dynamically change columns when language is switched', async () => {
      const user = userEvent.setup();
      
      render(
        <I18nProvider>
          <div>
            <LanguageToggle />
            <ResultsTable data={mockJournalData} />
          </div>
        </I18nProvider>
      );

      await waitFor(() => {
        // Initially in Portuguese - should show Qualis
        expect(screen.getByText('Qualis')).toBeInTheDocument();
        expect(screen.queryByText('SJR H-Index')).not.toBeInTheDocument();
      });

      // Switch to English
      await user.click(screen.getByRole('switch'));

      await waitFor(() => {
        // Now in English - should show SJR H-Index and hide Qualis
        expect(screen.getByText('SJR H-Index')).toBeInTheDocument();
        expect(screen.queryByText('Qualis')).not.toBeInTheDocument();
      });
    });

    it('should translate table headers correctly based on language', async () => {
      const user = userEvent.setup();
      
      render(
        <I18nProvider>
          <div>
            <LanguageToggle />
            <ResultsTable data={mockJournalData} />
          </div>
        </I18nProvider>
      );

      await waitFor(() => {
        // Initially in Portuguese
        expect(screen.getByText('AÇÕES')).toBeInTheDocument();
      });

      // Switch to English
      await user.click(screen.getByRole('switch'));

      await waitFor(() => {
        // Now in English
        expect(screen.getByText('Actions')).toBeInTheDocument();
        expect(screen.queryByText('AÇÕES')).not.toBeInTheDocument();
      });
    });
  });

  describe('Automatic Text Wrapping for Long Journal Names', () => {
    it('should auto-expand journal names longer than 40 characters', async () => {
      render(
        <I18nProvider>
          <ResultsTable data={mockJournalData} />
        </I18nProvider>
      );

      await waitFor(() => {
        // Find the long journal name
        const longJournalCell = screen.getByText(/Very Long Journal Name That Exceeds Forty Characters/);
        expect(longJournalCell).toBeInTheDocument();
        
        // Check if it has the auto-expand class
        const cellContainer = longJournalCell.closest('.journal-cell-auto-expand');
        expect(cellContainer).toHaveClass('two-line');
      });
    });

    it('should not auto-expand short journal names', async () => {
      render(
        <I18nProvider>
          <ResultsTable data={mockJournalData} />
        </I18nProvider>
      );

      await waitFor(() => {
        // Find the short journal name
        const shortJournalCell = screen.getByText('Short Name');
        expect(shortJournalCell).toBeInTheDocument();
        
        // Check if it has the single-line class
        const cellContainer = shortJournalCell.closest('.journal-cell-auto-expand');
        expect(cellContainer).toHaveClass('single-line');
      });
    });

    it('should maintain readability with proper CSS classes for auto-expanded text', async () => {
      render(
        <I18nProvider>
          <ResultsTable data={mockJournalData} />
        </I18nProvider>
      );

      await waitFor(() => {
        // Check that auto-expand containers have proper CSS classes
        const autoExpandCells = document.querySelectorAll('.journal-cell-auto-expand');
        expect(autoExpandCells.length).toBeGreaterThan(0);
        
        // Check that long names have two-line class
        const twoLineCells = document.querySelectorAll('.journal-cell-auto-expand.two-line');
        expect(twoLineCells.length).toBeGreaterThan(0);
        
        // Check that short names have single-line class
        const singleLineCells = document.querySelectorAll('.journal-cell-auto-expand.single-line');
        expect(singleLineCells.length).toBeGreaterThan(0);
      });
    });

    it('should handle search term highlighting in auto-expanded text', async () => {
      render(
        <I18nProvider>
          <ResultsTable 
            data={mockJournalData} 
            searchTerm="Long"
          />
        </I18nProvider>
      );

      await waitFor(() => {
        // Check that search highlighting works with auto-expansion
        const highlightedText = document.querySelector('.search-highlight');
        expect(highlightedText).toBeInTheDocument();
        expect(highlightedText).toHaveTextContent('Long');
      });
    });

    it('should provide proper accessibility attributes for auto-expanded cells', async () => {
      render(
        <I18nProvider>
          <ResultsTable data={mockJournalData} />
        </I18nProvider>
      );

      await waitFor(() => {
        // Check accessibility attributes
        const journalCells = document.querySelectorAll('.journal-cell-auto-expand');
        journalCells.forEach(cell => {
          expect(cell).toHaveAttribute('role', 'gridcell');
          expect(cell).toHaveAttribute('aria-label');
          expect(cell).toHaveAttribute('title');
        });
      });
    });
  });

  describe('Integration Tests - All Requirements Validation', () => {
    it('should handle complete language switching workflow with table updates', async () => {
      const user = userEvent.setup();
      
      render(
        <I18nProvider>
          <div>
            <LanguageToggle />
            <ResultsTable data={mockJournalData} />
          </div>
        </I18nProvider>
      );

      // Initial state - Portuguese
      await waitFor(() => {
        expect(screen.getByRole('switch')).toHaveTextContent('EN');
        expect(screen.getByText('AÇÕES')).toBeInTheDocument();
        expect(screen.getByText('Qualis')).toBeInTheDocument();
        expect(screen.queryByText('SJR H-Index')).not.toBeInTheDocument();
      });

      // Switch to English
      await user.click(screen.getByRole('switch'));

      await waitFor(() => {
        expect(screen.getByRole('switch')).toHaveTextContent('PT');
        expect(screen.getByText('Actions')).toBeInTheDocument();
        expect(screen.getByText('SJR H-Index')).toBeInTheDocument();
        expect(screen.queryByText('Qualis')).not.toBeInTheDocument();
      });

      // Verify persistence
      expect(localStorageMock.setItem).toHaveBeenCalledWith('journalscope_language', 'en');

      // Switch back to Portuguese
      await user.click(screen.getByRole('switch'));

      await waitFor(() => {
        expect(screen.getByRole('switch')).toHaveTextContent('EN');
        expect(screen.getByText('AÇÕES')).toBeInTheDocument();
        expect(screen.getByText('Qualis')).toBeInTheDocument();
        expect(screen.queryByText('SJR H-Index')).not.toBeInTheDocument();
      });
    });

    it('should maintain auto-expansion functionality across language changes', async () => {
      const user = userEvent.setup();
      
      render(
        <I18nProvider>
          <div>
            <LanguageToggle />
            <ResultsTable data={mockJournalData} />
          </div>
        </I18nProvider>
      );

      await waitFor(() => {
        // Check auto-expansion works in Portuguese
        const longJournalCell = screen.getByText(/Very Long Journal Name That Exceeds Forty Characters/);
        const cellContainer = longJournalCell.closest('.journal-cell-auto-expand');
        expect(cellContainer).toHaveClass('two-line');
      });

      // Switch to English
      await user.click(screen.getByRole('switch'));

      await waitFor(() => {
        // Check auto-expansion still works in English
        const longJournalCell = screen.getByText(/Very Long Journal Name That Exceeds Forty Characters/);
        const cellContainer = longJournalCell.closest('.journal-cell-auto-expand');
        expect(cellContainer).toHaveClass('two-line');
      });
    });

    it('should handle error states gracefully while maintaining functionality', async () => {
      // Mock translation loading error
      const originalImport = global.import;
      global.import = vi.fn().mockRejectedValue(new Error('Translation load error'));
      
      render(
        <I18nProvider>
          <TestI18nComponent />
        </I18nProvider>
      );

      await waitFor(() => {
        // Should still render something even with translation errors
        expect(screen.getByTestId('current-language')).toBeInTheDocument();
      });

      // Restore original import
      global.import = originalImport;
    });

    it('should validate performance requirements are met', async () => {
      const performanceStart = performance.now();
      
      render(
        <I18nProvider>
          <ResultsTable data={mockJournalData} />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Journal of Business Research')).toBeInTheDocument();
      });

      const performanceEnd = performance.now();
      const renderTime = performanceEnd - performanceStart;
      
      // Should render within reasonable time (less than 1000ms for test data)
      expect(renderTime).toBeLessThan(1000);
    });
  });
});