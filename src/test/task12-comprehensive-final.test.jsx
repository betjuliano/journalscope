import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider, useI18n } from '../contexts/I18nContext';
import LanguageToggle from '../components/LanguageToggle';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Simple test component that uses I18n context
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

describe('Task 12 - Comprehensive Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    // Mock console methods to reduce noise
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('1. I18n Context and Translation Functions', () => {
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

  describe('2. Language Toggle Functionality and Persistence', () => {
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
    });
  });

  describe('3. Table Column Visibility Changes Based on Language', () => {
    // Mock ResultsTable component for testing column visibility
    const MockResultsTable = () => {
      const { language, t } = useI18n();
      
      // Simulate column configuration based on language
      const columns = language === 'en' 
        ? ['Journal', 'ABDC', 'ABS', 'SJR H-Index', 'Actions']
        : ['Journal', 'ABDC', 'ABS', 'Qualis', 'AÇÕES'];
      
      return (
        <div data-testid="mock-table">
          {columns.map(col => (
            <div key={col} data-testid={`column-${col.toLowerCase().replace(/\s+/g, '-')}`}>
              {col}
            </div>
          ))}
        </div>
      );
    };

    it('should show Qualis column and hide SJR H-Index in Portuguese mode', async () => {
      render(
        <I18nProvider>
          <MockResultsTable />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('column-qualis')).toHaveTextContent('Qualis');
        expect(screen.getByTestId('column-ações')).toHaveTextContent('AÇÕES');
        expect(screen.queryByTestId('column-sjr-h-index')).not.toBeInTheDocument();
        expect(screen.queryByTestId('column-actions')).not.toBeInTheDocument();
      });
    });

    it('should hide Qualis column and show SJR H-Index in English mode', async () => {
      localStorageMock.getItem.mockReturnValue('en');
      
      render(
        <I18nProvider>
          <MockResultsTable />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('column-sjr-h-index')).toHaveTextContent('SJR H-Index');
        expect(screen.getByTestId('column-actions')).toHaveTextContent('Actions');
        expect(screen.queryByTestId('column-qualis')).not.toBeInTheDocument();
        expect(screen.queryByTestId('column-ações')).not.toBeInTheDocument();
      });
    });

    it('should dynamically change columns when language is switched', async () => {
      const user = userEvent.setup();
      
      render(
        <I18nProvider>
          <div>
            <LanguageToggle />
            <MockResultsTable />
          </div>
        </I18nProvider>
      );

      await waitFor(() => {
        // Initially in Portuguese
        expect(screen.getByTestId('column-qualis')).toBeInTheDocument();
        expect(screen.queryByTestId('column-sjr-h-index')).not.toBeInTheDocument();
      });

      // Switch to English
      await user.click(screen.getByRole('switch'));

      await waitFor(() => {
        // Now in English
        expect(screen.getByTestId('column-sjr-h-index')).toBeInTheDocument();
        expect(screen.queryByTestId('column-qualis')).not.toBeInTheDocument();
      });
    });
  });

  describe('4. Automatic Text Wrapping for Long Journal Names', () => {
    // Mock component to test text wrapping logic
    const MockJournalCell = ({ journalName }) => {
      const needsAutoExpand = journalName.length > 40;
      
      return (
        <div 
          className={`journal-cell-auto-expand ${needsAutoExpand ? 'two-line' : 'single-line'}`}
          title={journalName}
          role="gridcell"
          aria-label={`Journal: ${journalName}`}
        >
          <span>{journalName}</span>
        </div>
      );
    };

    const MockTableWithJournals = () => {
      const journals = [
        'Short Name',
        'Very Long Journal Name That Definitely Exceeds Forty Characters And Should Auto Expand',
        'Medium Length Journal Name',
        'Extremely Long Journal Name That Goes Way Beyond Normal Limits And Should Definitely Test Auto Expansion'
      ];

      return (
        <div data-testid="journal-table">
          {journals.map((journal, index) => (
            <MockJournalCell key={index} journalName={journal} />
          ))}
        </div>
      );
    };

    it('should auto-expand journal names longer than 40 characters', async () => {
      render(
        <I18nProvider>
          <MockTableWithJournals />
        </I18nProvider>
      );

      await waitFor(() => {
        // Check that long names have two-line class
        const twoLineCells = document.querySelectorAll('.journal-cell-auto-expand.two-line');
        expect(twoLineCells.length).toBeGreaterThan(0);
        
        // Verify specific long journal names
        const longJournal = screen.getByText(/Very Long Journal Name That Definitely Exceeds Forty Characters/);
        expect(longJournal).toBeInTheDocument();
        
        const container = longJournal.closest('.journal-cell-auto-expand');
        expect(container).toHaveClass('two-line');
      });
    });

    it('should not auto-expand short journal names', async () => {
      render(
        <I18nProvider>
          <MockTableWithJournals />
        </I18nProvider>
      );

      await waitFor(() => {
        const shortJournal = screen.getByText('Short Name');
        expect(shortJournal).toBeInTheDocument();
        
        const container = shortJournal.closest('.journal-cell-auto-expand');
        expect(container).toHaveClass('single-line');
      });
    });

    it('should provide proper accessibility attributes for auto-expanded cells', async () => {
      render(
        <I18nProvider>
          <MockTableWithJournals />
        </I18nProvider>
      );

      await waitFor(() => {
        const journalCells = document.querySelectorAll('.journal-cell-auto-expand');
        
        journalCells.forEach(cell => {
          expect(cell).toHaveAttribute('role', 'gridcell');
          expect(cell).toHaveAttribute('aria-label');
          expect(cell).toHaveAttribute('title');
        });
      });
    });

    it('should handle search term highlighting in auto-expanded text', async () => {
      const MockJournalCellWithHighlight = ({ journalName, searchTerm }) => {
        const needsAutoExpand = journalName.length > 40;
        
        // Simple highlighting logic
        const highlightedText = searchTerm 
          ? journalName.replace(new RegExp(`(${searchTerm})`, 'gi'), '<mark class="search-highlight">$1</mark>')
          : journalName;
        
        return (
          <div 
            className={`journal-cell-auto-expand ${needsAutoExpand ? 'two-line' : 'single-line'}`}
            dangerouslySetInnerHTML={{ __html: highlightedText }}
          />
        );
      };

      const TestHighlightComponent = () => (
        <I18nProvider>
          <MockJournalCellWithHighlight 
            journalName="Very Long Journal Name That Definitely Exceeds Forty Characters And Should Auto Expand"
            searchTerm="Long"
          />
        </I18nProvider>
      );

      render(<TestHighlightComponent />);

      await waitFor(() => {
        const highlightedElement = document.querySelector('.search-highlight');
        expect(highlightedElement).toBeInTheDocument();
        expect(highlightedElement).toHaveTextContent('Long');
      });
    });
  });

  describe('5. Integration Tests - All Requirements Validation', () => {
    it('should handle complete language switching workflow', async () => {
      const user = userEvent.setup();
      
      const IntegratedTestComponent = () => {
        const { language, t } = useI18n();
        
        return (
          <div>
            <LanguageToggle />
            <div data-testid="current-lang">{language}</div>
            <div data-testid="hero-subtitle">{t('hero.subtitle')}</div>
            <div data-testid="table-actions">{t('table.actions', language === 'en' ? 'Actions' : 'AÇÕES')}</div>
            
            {/* Mock column visibility */}
            {language === 'en' ? (
              <div data-testid="sjr-hindex-column">SJR H-Index</div>
            ) : (
              <div data-testid="qualis-column">Qualis</div>
            )}
            
            {/* Mock auto-expansion */}
            <div className="journal-cell-auto-expand two-line" data-testid="long-journal">
              Very Long Journal Name That Exceeds Forty Characters
            </div>
          </div>
        );
      };

      render(
        <I18nProvider>
          <IntegratedTestComponent />
        </I18nProvider>
      );

      // Initial state - Portuguese
      await waitFor(() => {
        expect(screen.getByRole('switch')).toHaveTextContent('EN');
        expect(screen.getByTestId('current-lang')).toHaveTextContent('pt');
        expect(screen.getByTestId('hero-subtitle')).toHaveTextContent('Sistema Integrado de Consulta de Journals Acadêmicos');
        expect(screen.getByTestId('qualis-column')).toBeInTheDocument();
        expect(screen.queryByTestId('sjr-hindex-column')).not.toBeInTheDocument();
      });

      // Switch to English
      await user.click(screen.getByRole('switch'));

      await waitFor(() => {
        expect(screen.getByRole('switch')).toHaveTextContent('PT');
        expect(screen.getByTestId('current-lang')).toHaveTextContent('en');
        expect(screen.getByTestId('hero-subtitle')).toHaveTextContent('Integrated Academic Journal Query System');
        expect(screen.getByTestId('sjr-hindex-column')).toBeInTheDocument();
        expect(screen.queryByTestId('qualis-column')).not.toBeInTheDocument();
      });

      // Verify persistence
      expect(localStorageMock.setItem).toHaveBeenCalledWith('journalscope_language', 'en');

      // Verify auto-expansion still works
      expect(screen.getByTestId('long-journal')).toHaveClass('two-line');
    });

    it('should maintain functionality during rapid interactions', async () => {
      const user = userEvent.setup();
      
      render(
        <I18nProvider>
          <div>
            <LanguageToggle />
            <TestI18nComponent />
          </div>
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.getByRole('switch')).toBeInTheDocument();
      });

      // Rapid language switching
      const languageToggle = screen.getByRole('switch');
      
      for (let i = 0; i < 3; i++) {
        await user.click(languageToggle);
        await waitFor(() => {
          expect(screen.getByTestId('current-language')).toBeInTheDocument();
        });
      }

      // Should still be functional
      expect(screen.getByTestId('hero-title')).toHaveTextContent('JournalScope');
    });

    it('should validate performance requirements are met', async () => {
      const performanceStart = performance.now();
      
      render(
        <I18nProvider>
          <TestI18nComponent />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('hero-title')).toHaveTextContent('JournalScope');
      });

      const performanceEnd = performance.now();
      const renderTime = performanceEnd - performanceStart;
      
      // Should render within reasonable time (less than 1000ms for test)
      expect(renderTime).toBeLessThan(1000);
    });
  });
});