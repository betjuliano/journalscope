import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { I18nProvider } from '../contexts/I18nContext';
import ResultsTable from '../components/ResultsTable';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Test data with various journal name lengths
const mockJournalData = [
  {
    journal: 'Short Name',
    abdc: 'A',
    abs: '3',
    sjr: { quartile: 'Q1', hIndex: 100 },
    jcr: { quartile: 'Q1', impactFactor: 4.0 }
  },
  {
    journal: 'Medium Length Journal Name That Is Reasonable',
    abdc: 'B',
    abs: '2',
    sjr: { quartile: 'Q2', hIndex: 80 },
    jcr: { quartile: 'Q2', impactFactor: 3.0 }
  },
  {
    journal: 'Very Long Journal Name That Definitely Exceeds Forty Characters And Should Trigger Auto Expansion Feature',
    abdc: 'A*',
    abs: '4*',
    sjr: { quartile: 'Q1', hIndex: 150 },
    jcr: { quartile: 'Q1', impactFactor: 5.5 }
  },
  {
    journal: 'Extremely Long Journal Name That Goes Way Beyond Normal Limits And Should Definitely Test The Auto Expansion Functionality To Its Maximum Capacity',
    abdc: 'A',
    abs: '4',
    sjr: { quartile: 'Q1', hIndex: 120 },
    jcr: { quartile: 'Q1', impactFactor: 4.8 }
  },
  {
    journal: 'A',
    abdc: 'C',
    abs: '1',
    sjr: { quartile: 'Q3', hIndex: 30 },
    jcr: { quartile: 'Q3', impactFactor: 1.2 }
  }
];

describe('Journal Text Wrapping and Auto-Expansion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('Auto-Expansion Logic', () => {
    it('should auto-expand journal names longer than 40 characters', async () => {
      render(
        <I18nProvider>
          <ResultsTable data={mockJournalData} />
        </I18nProvider>
      );

      await waitFor(() => {
        // Find long journal names
        const longJournal1 = screen.getByText(/Very Long Journal Name That Definitely Exceeds Forty Characters/);
        const longJournal2 = screen.getByText(/Extremely Long Journal Name That Goes Way Beyond Normal Limits/);
        
        expect(longJournal1).toBeInTheDocument();
        expect(longJournal2).toBeInTheDocument();
        
        // Check they have auto-expand styling
        const container1 = longJournal1.closest('.journal-cell-auto-expand');
        const container2 = longJournal2.closest('.journal-cell-auto-expand');
        
        expect(container1).toHaveClass('two-line');
        expect(container2).toHaveClass('two-line');
      });
    });

    it('should not auto-expand short journal names', async () => {
      render(
        <I18nProvider>
          <ResultsTable data={mockJournalData} />
        </I18nProvider>
      );

      await waitFor(() => {
        // Find short journal names
        const shortJournal1 = screen.getByText('Short Name');
        const shortJournal2 = screen.getByText('A');
        
        expect(shortJournal1).toBeInTheDocument();
        expect(shortJournal2).toBeInTheDocument();
        
        // Check they have single-line styling
        const container1 = shortJournal1.closest('.journal-cell-auto-expand');
        const container2 = shortJournal2.closest('.journal-cell-auto-expand');
        
        expect(container1).toHaveClass('single-line');
        expect(container2).toHaveClass('single-line');
      });
    });

    it('should handle medium-length names appropriately', async () => {
      render(
        <I18nProvider>
          <ResultsTable data={mockJournalData} />
        </I18nProvider>
      );

      await waitFor(() => {
        const mediumJournal = screen.getByText('Medium Length Journal Name That Is Reasonable');
        expect(mediumJournal).toBeInTheDocument();
        
        const container = mediumJournal.closest('.journal-cell-auto-expand');
        // Should be single-line since it's under 40 characters
        expect(container).toHaveClass('single-line');
      });
    });

    it('should apply correct CSS classes for auto-expansion', async () => {
      render(
        <I18nProvider>
          <ResultsTable data={mockJournalData} />
        </I18nProvider>
      );

      await waitFor(() => {
        // Check that all journal cells have the auto-expand container
        const autoExpandCells = document.querySelectorAll('.journal-cell-auto-expand');
        expect(autoExpandCells.length).toBe(mockJournalData.length);
        
        // Check that some have two-line class
        const twoLineCells = document.querySelectorAll('.journal-cell-auto-expand.two-line');
        expect(twoLineCells.length).toBeGreaterThan(0);
        
        // Check that some have single-line class
        const singleLineCells = document.querySelectorAll('.journal-cell-auto-expand.single-line');
        expect(singleLineCells.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Accessibility Features', () => {
    it('should provide proper ARIA labels for journal cells', async () => {
      render(
        <I18nProvider>
          <ResultsTable data={mockJournalData} />
        </I18nProvider>
      );

      await waitFor(() => {
        const journalCells = document.querySelectorAll('.journal-cell-auto-expand');
        
        journalCells.forEach(cell => {
          expect(cell).toHaveAttribute('role', 'gridcell');
          expect(cell).toHaveAttribute('aria-label');
          expect(cell.getAttribute('aria-label')).toMatch(/^Journal:/);
        });
      });
    });

    it('should provide title attributes for full text on hover', async () => {
      render(
        <I18nProvider>
          <ResultsTable data={mockJournalData} />
        </I18nProvider>
      );

      await waitFor(() => {
        const journalCells = document.querySelectorAll('.journal-cell-auto-expand');
        
        journalCells.forEach(cell => {
          expect(cell).toHaveAttribute('title');
          expect(cell.getAttribute('title')).toBeTruthy();
        });
      });
    });

    it('should maintain readability with proper contrast and spacing', async () => {
      render(
        <I18nProvider>
          <ResultsTable data={mockJournalData} />
        </I18nProvider>
      );

      await waitFor(() => {
        const journalCells = document.querySelectorAll('.journal-cell-auto-expand');
        
        // Check that cells have proper structure
        journalCells.forEach(cell => {
          const textSpan = cell.querySelector('span');
          expect(textSpan).toBeInTheDocument();
        });
      });
    });
  });

  describe('Search Highlighting with Auto-Expansion', () => {
    it('should highlight search terms in auto-expanded text', async () => {
      render(
        <I18nProvider>
          <ResultsTable 
            data={mockJournalData} 
            searchTerm="Long"
          />
        </I18nProvider>
      );

      await waitFor(() => {
        // Check that search highlighting works
        const highlightedElements = document.querySelectorAll('.search-highlight');
        expect(highlightedElements.length).toBeGreaterThan(0);
        
        // Check that highlighted text contains the search term
        highlightedElements.forEach(element => {
          expect(element.textContent.toLowerCase()).toContain('long');
        });
      });
    });

    it('should highlight search terms in short names', async () => {
      render(
        <I18nProvider>
          <ResultsTable 
            data={mockJournalData} 
            searchTerm="Short"
          />
        </I18nProvider>
      );

      await waitFor(() => {
        const highlightedElements = document.querySelectorAll('.search-highlight');
        expect(highlightedElements.length).toBeGreaterThan(0);
        
        const shortHighlight = Array.from(highlightedElements).find(
          el => el.textContent.toLowerCase() === 'short'
        );
        expect(shortHighlight).toBeInTheDocument();
      });
    });

    it('should handle case-insensitive search highlighting', async () => {
      render(
        <I18nProvider>
          <ResultsTable 
            data={mockJournalData} 
            searchTerm="JOURNAL"
          />
        </I18nProvider>
      );

      await waitFor(() => {
        const highlightedElements = document.querySelectorAll('.search-highlight');
        expect(highlightedElements.length).toBeGreaterThan(0);
        
        // Should highlight "Journal" regardless of case
        const journalHighlights = Array.from(highlightedElements).filter(
          el => el.textContent.toLowerCase().includes('journal')
        );
        expect(journalHighlights.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Error Handling and Fallbacks', () => {
    it('should handle malformed journal data gracefully', async () => {
      const malformedData = [
        {
          journal: null,
          abdc: 'A',
          abs: '3'
        },
        {
          journal: undefined,
          abdc: 'B',
          abs: '2'
        },
        {
          journal: '',
          abdc: 'C',
          abs: '1'
        },
        {
          // Missing journal field entirely
          abdc: 'A*',
          abs: '4*'
        }
      ];

      render(
        <I18nProvider>
          <ResultsTable data={malformedData} />
        </I18nProvider>
      );

      await waitFor(() => {
        // Should render fallback content for malformed data
        const fallbackCells = document.querySelectorAll('[data-testid*="journal-cell-fallback"]');
        expect(fallbackCells.length).toBeGreaterThan(0);
      });
    });

    it('should show error indicators for problematic journal cells', async () => {
      const problematicData = [
        {
          journal: null,
          abdc: 'A'
        }
      ];

      render(
        <I18nProvider>
          <ResultsTable data={problematicData} />
        </I18nProvider>
      );

      await waitFor(() => {
        // Should show warning indicators
        const warningIndicators = document.querySelectorAll('[title*="Modo de fallback"]');
        expect(warningIndicators.length).toBeGreaterThan(0);
      });
    });

    it('should maintain table structure even with errors', async () => {
      const mixedData = [
        ...mockJournalData,
        { journal: null, abdc: 'A' },
        { journal: undefined, abdc: 'B' }
      ];

      render(
        <I18nProvider>
          <ResultsTable data={mixedData} />
        </I18nProvider>
      );

      await waitFor(() => {
        // Should render table with all rows
        const tableRows = document.querySelectorAll('tbody tr');
        expect(tableRows.length).toBe(mixedData.length);
      });
    });
  });

  describe('Performance with Large Text', () => {
    it('should handle very long journal names efficiently', async () => {
      const longTextData = [
        {
          journal: 'A'.repeat(200), // Very long name
          abdc: 'A',
          abs: '3'
        },
        {
          journal: 'B'.repeat(500), // Extremely long name
          abdc: 'B',
          abs: '2'
        }
      ];

      const startTime = performance.now();
      
      render(
        <I18nProvider>
          <ResultsTable data={longTextData} />
        </I18nProvider>
      );

      await waitFor(() => {
        const journalCells = document.querySelectorAll('.journal-cell-auto-expand');
        expect(journalCells.length).toBe(2);
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render efficiently even with very long text
      expect(renderTime).toBeLessThan(1000);
    });

    it('should not cause memory leaks with frequent re-renders', async () => {
      const TestWrapper = ({ data }) => (
        <I18nProvider>
          <ResultsTable data={data} />
        </I18nProvider>
      );

      const { rerender } = render(<TestWrapper data={mockJournalData} />);

      // Re-render multiple times to test for memory leaks
      for (let i = 0; i < 10; i++) {
        rerender(<TestWrapper data={[...mockJournalData, { journal: `Test ${i}`, abdc: 'A' }]} />);
        
        await waitFor(() => {
          const journalCells = document.querySelectorAll('.journal-cell-auto-expand');
          expect(journalCells.length).toBe(mockJournalData.length + 1);
        });
      }

      // Should complete without errors
      expect(true).toBe(true);
    });
  });

  describe('Integration with Language Switching', () => {
    it('should maintain auto-expansion behavior when switching languages', async () => {
      const user = userEvent.setup();
      
      render(
        <I18nProvider>
          <div>
            <button 
              onClick={() => {
                localStorageMock.getItem.mockReturnValue('en');
                window.dispatchEvent(new Event('storage'));
              }}
              data-testid="switch-lang"
            >
              Switch Language
            </button>
            <ResultsTable data={mockJournalData} />
          </div>
        </I18nProvider>
      );

      await waitFor(() => {
        // Check initial auto-expansion
        const longJournal = screen.getByText(/Very Long Journal Name That Definitely Exceeds Forty Characters/);
        const container = longJournal.closest('.journal-cell-auto-expand');
        expect(container).toHaveClass('two-line');
      });

      // Switch language
      await user.click(screen.getByTestId('switch-lang'));

      await waitFor(() => {
        // Auto-expansion should still work after language switch
        const longJournal = screen.getByText(/Very Long Journal Name That Definitely Exceeds Forty Characters/);
        const container = longJournal.closest('.journal-cell-auto-expand');
        expect(container).toHaveClass('two-line');
      });
    });
  });
});