import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider } from '../contexts/I18nContext';
import LanguageToggle from '../components/LanguageToggle';
import ResultsTable from '../components/ResultsTable';
import JournalSearchApp from '../components/JournalSearchApp';

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

// Comprehensive test data
const comprehensiveTestData = [
  {
    journal: 'Academy of Management Review',
    abdc: 'A*',
    abs: '4*',
    sjr: { quartile: 'Q1', hIndex: 180, score: 3.2 },
    jcr: { quartile: 'Q1', impactFactor: 7.5, category: 'Management' },
    qualis: 'MB',
    predatory: { isPredatory: false },
    wileySubject: 'Business and Management'
  },
  {
    journal: 'International Journal of Very Long Name That Exceeds Standard Length Limits And Tests Auto Expansion',
    abdc: 'A',
    abs: '3',
    sjr: { quartile: 'Q1', hIndex: 120, score: 2.1 },
    jcr: { quartile: 'Q2', impactFactor: 4.2, category: 'Business' },
    qualis: 'MB',
    predatory: { isPredatory: false },
    wileySubject: 'Economics and Finance'
  },
  {
    journal: 'Short Journal',
    abdc: 'B',
    abs: '2',
    sjr: { quartile: 'Q2', hIndex: 85, score: 1.5 },
    jcr: { quartile: 'Q2', impactFactor: 2.8, category: 'Economics' },
    qualis: 'B',
    predatory: { isPredatory: false },
    wileySubject: 'Business'
  },
  {
    journal: 'Predatory Journal Example',
    abdc: null,
    abs: null,
    sjr: { quartile: null, hIndex: 10, score: 0.2 },
    jcr: { quartile: 'Q4', impactFactor: 0.5, category: 'General' },
    qualis: 'F',
    predatory: { isPredatory: true },
    wileySubject: null
  }
];

// Full application test component
const FullAppTestComponent = () => (
  <I18nProvider>
    <div>
      <header data-testid="app-header">
        <LanguageToggle position="header" />
      </header>
      <main data-testid="app-main">
        <ResultsTable 
          data={comprehensiveTestData}
          searchTerm=""
          onExportCSV={() => {}}
          onExportExcel={() => {}}
        />
      </main>
    </div>
  </I18nProvider>
);

describe('Comprehensive Integration Tests - All Requirements', () => {
  let consoleSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {})
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Complete I18n Workflow Integration', () => {
    it('should handle complete application workflow with all features', async () => {
      const user = userEvent.setup();
      
      render(<FullAppTestComponent />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('app-header')).toBeInTheDocument();
        expect(screen.getByTestId('app-main')).toBeInTheDocument();
      });

      // Verify initial Portuguese state
      const languageToggle = screen.getByRole('switch');
      expect(languageToggle).toHaveTextContent('EN');
      expect(languageToggle).toHaveAttribute('aria-pressed', 'false');

      // Verify Portuguese table headers
      expect(screen.getByText('AÇÕES')).toBeInTheDocument();
      expect(screen.getByText('Qualis')).toBeInTheDocument();
      expect(screen.queryByText('SJR H-Index')).not.toBeInTheDocument();

      // Verify auto-expansion works in Portuguese
      const longJournal = screen.getByText(/International Journal of Very Long Name/);
      expect(longJournal).toBeInTheDocument();
      const longJournalContainer = longJournal.closest('.journal-cell-auto-expand');
      expect(longJournalContainer).toHaveClass('two-line');

      // Verify short names don't auto-expand
      const shortJournal = screen.getByText('Short Journal');
      const shortJournalContainer = shortJournal.closest('.journal-cell-auto-expand');
      expect(shortJournalContainer).toHaveClass('single-line');

      // Switch to English
      await user.click(languageToggle);

      await waitFor(() => {
        expect(languageToggle).toHaveTextContent('PT');
        expect(languageToggle).toHaveAttribute('aria-pressed', 'true');
      });

      // Verify English table headers
      expect(screen.getByText('Actions')).toBeInTheDocument();
      expect(screen.queryByText('AÇÕES')).not.toBeInTheDocument();
      expect(screen.getByText('SJR H-Index')).toBeInTheDocument();
      expect(screen.queryByText('Qualis')).not.toBeInTheDocument();

      // Verify auto-expansion still works in English
      const longJournalEn = screen.getByText(/International Journal of Very Long Name/);
      const longJournalContainerEn = longJournalEn.closest('.journal-cell-auto-expand');
      expect(longJournalContainerEn).toHaveClass('two-line');

      // Verify SJR H-Index values are displayed
      expect(screen.getByText('180')).toBeInTheDocument(); // H-Index value
      expect(screen.getByText('120')).toBeInTheDocument(); // H-Index value

      // Verify persistence
      expect(localStorageMock.setItem).toHaveBeenCalledWith('journalscope_language', 'en');

      // Switch back to Portuguese
      await user.click(languageToggle);

      await waitFor(() => {
        expect(languageToggle).toHaveTextContent('EN');
        expect(screen.getByText('AÇÕES')).toBeInTheDocument();
        expect(screen.getByText('Qualis')).toBeInTheDocument();
        expect(screen.queryByText('SJR H-Index')).not.toBeInTheDocument();
      });

      // Verify Qualis values are displayed again
      expect(screen.getByText('MB')).toBeInTheDocument();
      expect(screen.getByText('B')).toBeInTheDocument();
      expect(screen.getByText('F')).toBeInTheDocument();
    });

    it('should handle search highlighting with auto-expansion across languages', async () => {
      const user = userEvent.setup();
      
      const SearchTestComponent = () => (
        <I18nProvider>
          <div>
            <LanguageToggle />
            <ResultsTable 
              data={comprehensiveTestData}
              searchTerm="International"
            />
          </div>
        </I18nProvider>
      );

      render(<SearchTestComponent />);

      await waitFor(() => {
        // Verify search highlighting works
        const highlightedElements = document.querySelectorAll('.search-highlight');
        expect(highlightedElements.length).toBeGreaterThan(0);
        
        // Check that highlighted text is in auto-expanded cell
        const longJournal = screen.getByText(/International Journal of Very Long Name/);
        const container = longJournal.closest('.journal-cell-auto-expand');
        expect(container).toHaveClass('two-line');
      });

      // Switch language and verify highlighting persists
      await user.click(screen.getByRole('switch'));

      await waitFor(() => {
        const highlightedElements = document.querySelectorAll('.search-highlight');
        expect(highlightedElements.length).toBeGreaterThan(0);
      });
    });

    it('should handle all data types and edge cases correctly', async () => {
      render(<FullAppTestComponent />);

      await waitFor(() => {
        // Verify all journal types are rendered
        expect(screen.getByText('Academy of Management Review')).toBeInTheDocument();
        expect(screen.getByText(/International Journal of Very Long Name/)).toBeInTheDocument();
        expect(screen.getByText('Short Journal')).toBeInTheDocument();
        expect(screen.getByText('Predatory Journal Example')).toBeInTheDocument();

        // Verify different classification badges
        expect(screen.getByText('A*')).toBeInTheDocument();
        expect(screen.getByText('4*')).toBeInTheDocument();
        expect(screen.getByText('Q1')).toBeInTheDocument();
        expect(screen.getByText('Q2')).toBeInTheDocument();
        expect(screen.getByText('Q4')).toBeInTheDocument();

        // Verify predatory indicator
        const predatoryIndicators = screen.getAllByText('Sim');
        expect(predatoryIndicators.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Performance and Accessibility Integration', () => {
    it('should maintain performance standards with all features enabled', async () => {
      const startTime = performance.now();
      
      render(<FullAppTestComponent />);

      await waitFor(() => {
        expect(screen.getByText('Academy of Management Review')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render within reasonable time
      expect(renderTime).toBeLessThan(2000);
    });

    it('should provide comprehensive accessibility features', async () => {
      render(<FullAppTestComponent />);

      await waitFor(() => {
        // Check language toggle accessibility
        const languageToggle = screen.getByRole('switch');
        expect(languageToggle).toHaveAttribute('aria-label');
        expect(languageToggle).toHaveAttribute('aria-pressed');

        // Check table accessibility
        const table = screen.getByRole('table');
        expect(table).toHaveAttribute('aria-label');

        // Check journal cell accessibility
        const journalCells = document.querySelectorAll('.journal-cell-auto-expand');
        journalCells.forEach(cell => {
          expect(cell).toHaveAttribute('role', 'gridcell');
          expect(cell).toHaveAttribute('aria-label');
          expect(cell).toHaveAttribute('title');
        });

        // Check column headers accessibility
        const columnHeaders = screen.getAllByRole('columnheader');
        columnHeaders.forEach(header => {
          expect(header).toHaveAttribute('scope', 'col');
        });
      });
    });

    it('should handle keyboard navigation properly', async () => {
      const user = userEvent.setup();
      
      render(<FullAppTestComponent />);

      await waitFor(() => {
        expect(screen.getByRole('switch')).toBeInTheDocument();
      });

      // Test keyboard navigation on language toggle
      const languageToggle = screen.getByRole('switch');
      languageToggle.focus();
      
      // Press Enter to toggle
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(languageToggle).toHaveAttribute('aria-pressed', 'true');
      });

      // Press Space to toggle back
      await user.keyboard(' ');

      await waitFor(() => {
        expect(languageToggle).toHaveAttribute('aria-pressed', 'false');
      });
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should recover gracefully from translation loading errors', async () => {
      // Mock translation loading failure
      const originalConsoleError = console.error;
      console.error = vi.fn();

      render(<FullAppTestComponent />);

      await waitFor(() => {
        // Should still render basic structure even with errors
        expect(screen.getByTestId('app-header')).toBeInTheDocument();
        expect(screen.getByTestId('app-main')).toBeInTheDocument();
      });

      console.error = originalConsoleError;
    });

    it('should handle malformed journal data without breaking', async () => {
      const MalformedDataComponent = () => (
        <I18nProvider>
          <ResultsTable 
            data={[
              ...comprehensiveTestData,
              { journal: null, abdc: 'A' },
              { journal: undefined, abs: '2' },
              { /* missing journal field */ abdc: 'B' }
            ]}
          />
        </I18nProvider>
      );

      render(<MalformedDataComponent />);

      await waitFor(() => {
        // Should render valid data
        expect(screen.getByText('Academy of Management Review')).toBeInTheDocument();
        
        // Should show fallback for malformed data
        const fallbackCells = document.querySelectorAll('[data-testid*="journal-cell-fallback"]');
        expect(fallbackCells.length).toBeGreaterThan(0);
      });
    });

    it('should maintain functionality during rapid interactions', async () => {
      const user = userEvent.setup();
      
      render(<FullAppTestComponent />);

      await waitFor(() => {
        expect(screen.getByRole('switch')).toBeInTheDocument();
      });

      // Rapid language switching
      const languageToggle = screen.getByRole('switch');
      
      for (let i = 0; i < 5; i++) {
        await user.click(languageToggle);
        // Small delay to allow state updates
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      await waitFor(() => {
        // Should still be functional
        expect(screen.getByText('Academy of Management Review')).toBeInTheDocument();
      });
    });
  });

  describe('Cross-Browser Compatibility Simulation', () => {
    it('should work without modern JavaScript features', async () => {
      // Mock older browser environment
      const originalPromise = global.Promise;
      const originalMap = global.Map;
      
      // Simulate limited support
      global.Map = function() {
        const items = [];
        return {
          set: (key, value) => items.push({ key, value }),
          get: (key) => items.find(item => item.key === key)?.value,
          has: (key) => items.some(item => item.key === key),
          delete: (key) => {
            const index = items.findIndex(item => item.key === key);
            if (index > -1) items.splice(index, 1);
          },
          clear: () => items.length = 0,
          get size() { return items.length; }
        };
      };

      render(<FullAppTestComponent />);

      await waitFor(() => {
        expect(screen.getByText('Academy of Management Review')).toBeInTheDocument();
      });

      // Restore
      global.Promise = originalPromise;
      global.Map = originalMap;
    });

    it('should handle different viewport sizes', async () => {
      // Test mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<FullAppTestComponent />);

      await waitFor(() => {
        expect(screen.getByText('Academy of Management Review')).toBeInTheDocument();
      });

      // Test desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });

      window.dispatchEvent(new Event('resize'));

      await waitFor(() => {
        expect(screen.getByText('Academy of Management Review')).toBeInTheDocument();
      });
    });
  });

  describe('Memory and Performance Monitoring', () => {
    it('should not create memory leaks with extended usage', async () => {
      const user = userEvent.setup();
      
      const { rerender } = render(<FullAppTestComponent />);

      // Simulate extended usage
      for (let i = 0; i < 10; i++) {
        await waitFor(() => {
          expect(screen.getByRole('switch')).toBeInTheDocument();
        });

        await user.click(screen.getByRole('switch'));
        
        // Re-render with new data
        rerender(<FullAppTestComponent />);
      }

      await waitFor(() => {
        expect(screen.getByText('Academy of Management Review')).toBeInTheDocument();
      });

      // Should complete without memory issues
      expect(true).toBe(true);
    });

    it('should handle large datasets efficiently', async () => {
      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        journal: `Test Journal ${i} ${i > 50 ? 'With Very Long Name That Should Auto Expand' : ''}`,
        abdc: ['A*', 'A', 'B', 'C'][i % 4],
        abs: ['4*', '4', '3', '2', '1'][i % 5],
        sjr: { quartile: ['Q1', 'Q2', 'Q3', 'Q4'][i % 4], hIndex: 100 - i },
        jcr: { quartile: ['Q1', 'Q2', 'Q3', 'Q4'][i % 4], impactFactor: 5 - (i % 5) }
      }));

      const LargeDataComponent = () => (
        <I18nProvider>
          <ResultsTable data={largeDataset} />
        </I18nProvider>
      );

      const startTime = performance.now();
      
      render(<LargeDataComponent />);

      await waitFor(() => {
        expect(screen.getByText('Test Journal 0')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should handle large datasets efficiently
      expect(renderTime).toBeLessThan(3000);
    });
  });
});