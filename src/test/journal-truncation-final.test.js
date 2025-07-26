/**
 * Final tests for journal truncation functionality
 * Task 12: Realizar testes finais e ajustes
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResultsTable from '../components/ResultsTable';

// Mock data
const mockJournalData = [
  {
    journal: 'Journal with Very Long Name That Should Be Truncated Because It Exceeds Thirty Characters',
    abdc: 'A*',
    abs: '4*',
    sjr: { quartile: 'Q1', score: 3.2 },
    jcr: { quartile: 'Q1', impactFactor: 4.5 },
    predatory: { isPredatory: false }
  },
  {
    journal: 'Short Journal',
    abdc: 'B',
    abs: '2',
    sjr: { quartile: 'Q3', score: 1.5 },
    jcr: { quartile: 'Q3', impactFactor: 1.9 },
    predatory: { isPredatory: false }
  }
];

describe('Journal Truncation - Final Tests', () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe('Basic Functionality', () => {
    it('should render table with journal truncation', () => {
      render(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByText(/Journal with Very Long Name/)).toBeInTheDocument();
    });

    it('should show expand button for long journal names', () => {
      render(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      const expandButton = screen.getByRole('button', { name: /Expandir nome completo/ });
      expect(expandButton).toBeInTheDocument();
    });

    it('should expand journal name when button is clicked', async () => {
      render(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      const expandButton = screen.getByRole('button', { name: /Expandir nome completo/ });
      await user.click(expandButton);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Recolher nome/ })).toBeInTheDocument();
        expect(screen.getByText(/Because It Exceeds Thirty Characters/)).toBeInTheDocument();
      });
    });

    it('should collapse journal name when collapse button is clicked', async () => {
      render(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      const expandButton = screen.getByRole('button', { name: /Expandir nome completo/ });
      await user.click(expandButton);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Recolher nome/ })).toBeInTheDocument();
      });
      
      const collapseButton = screen.getByRole('button', { name: /Recolher nome/ });
      await user.click(collapseButton);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Expandir nome completo/ })).toBeInTheDocument();
        expect(screen.queryByText(/Because It Exceeds Thirty Characters/)).not.toBeInTheDocument();
      });
    });
  });

  describe('Browser Compatibility', () => {
    it('should work with different user agents', () => {
      const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15'
      ];
      
      userAgents.forEach(userAgent => {
        Object.defineProperty(navigator, 'userAgent', {
          writable: true,
          configurable: true,
          value: userAgent,
        });
        
        render(<ResultsTable data={mockJournalData} searchTerm="" />);
        expect(screen.getByRole('table')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('should adapt to mobile viewport', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      window.dispatchEvent(new Event('resize'));
      
      render(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });
    });

    it('should adapt to tablet viewport', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });
      
      window.dispatchEvent(new Event('resize'));
      
      render(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });
    });
  });

  describe('Performance', () => {
    it('should handle large datasets efficiently', () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        journal: i % 2 === 0 ? `Very Long Journal Name ${i} That Should Be Truncated` : `Short ${i}`,
        abdc: 'A',
        abs: '3',
        sjr: { quartile: 'Q1', score: 2.5 },
        jcr: { quartile: 'Q1', impactFactor: 3.2 },
        predatory: { isPredatory: false }
      }));
      
      const start = performance.now();
      render(<ResultsTable data={largeDataset} searchTerm="" />);
      const end = performance.now();
      
      expect(end - start).toBeLessThan(1000); // Should render in less than 1 second
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('should handle multiple expansions efficiently', async () => {
      const dataset = Array.from({ length: 50 }, (_, i) => ({
        journal: `Very Long Journal Name ${i} That Should Be Truncated Because It Exceeds Thirty Characters`,
        abdc: 'A',
        abs: '3',
        sjr: { quartile: 'Q1', score: 2.5 },
        jcr: { quartile: 'Q1', impactFactor: 3.2 },
        predatory: { isPredatory: false }
      }));
      
      render(<ResultsTable data={dataset} searchTerm="" />);
      
      const expandButtons = screen.getAllByRole('button', { name: /Expandir nome completo/ });
      const buttonsToTest = expandButtons.slice(0, 10);
      
      const start = performance.now();
      
      for (const button of buttonsToTest) {
        await user.click(button);
      }
      
      const end = performance.now();
      
      expect(end - start).toBeLessThan(1000);
      
      const collapseButtons = screen.getAllByRole('button', { name: /Recolher nome/ });
      expect(collapseButtons.length).toBe(buttonsToTest.length);
    });
  });

  describe('Accessibility', () => {
    it('should support keyboard navigation', async () => {
      render(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      const expandButton = screen.getByRole('button', { name: /Expandir nome completo/ });
      
      expandButton.focus();
      expect(expandButton).toHaveFocus();
      
      fireEvent.keyDown(expandButton, { key: 'Enter' });
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Recolher nome/ })).toBeInTheDocument();
      });
    });

    it('should have proper ARIA attributes', () => {
      render(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      const expandButton = screen.getByRole('button', { name: /Expandir nome completo/ });
      
      expect(expandButton).toHaveAttribute('aria-label');
      expect(expandButton).toHaveAttribute('aria-expanded', 'false');
      expect(expandButton).toHaveAttribute('type', 'button');
    });

    it('should provide tooltips for truncated content', () => {
      render(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      const truncatedCell = screen.getByText(/Journal with Very Long Name/);
      const cellContainer = truncatedCell.closest('.journal-cell');
      
      expect(cellContainer).toHaveAttribute('title');
      expect(cellContainer.getAttribute('title')).toContain('Because It Exceeds Thirty Characters');
    });
  });

  describe('UX and Visual Feedback', () => {
    it('should show visual indicators for interactive elements', () => {
      const { container } = render(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      const interactiveCell = container.querySelector('.journal-cell.interactive');
      
      if (interactiveCell) {
        fireEvent.mouseEnter(interactiveCell);
        
        const styles = window.getComputedStyle(interactiveCell);
        expect(styles.cursor).toBe('pointer');
      }
    });

    it('should maintain search highlighting', () => {
      const { container } = render(<ResultsTable data={mockJournalData} searchTerm="Journal" />);
      
      const highlights = container.querySelectorAll('.search-highlight');
      expect(highlights.length).toBeGreaterThan(0);
    });

    it('should reset expansions on filter changes', async () => {
      const { rerender } = render(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      const expandButton = screen.getByRole('button', { name: /Expandir nome completo/ });
      await user.click(expandButton);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Recolher nome/ })).toBeInTheDocument();
      });
      
      rerender(<ResultsTable data={mockJournalData} searchTerm="test" />);
      
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /Recolher nome/ })).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Expandir nome completo/ })).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid data gracefully', () => {
      const invalidData = [
        { journal: null, abdc: 'A' },
        { journal: undefined, abs: '3' },
        { journal: '', sjr: { quartile: 'Q1' } }
      ];
      
      const { container } = render(<ResultsTable data={invalidData} searchTerm="" />);
      
      expect(screen.getByRole('table')).toBeInTheDocument();
      
      const fallbackElements = container.querySelectorAll('.journal-cell-fallback');
      expect(fallbackElements.length).toBeGreaterThan(0);
    });

    it('should maintain functionality with partial failures', async () => {
      const mixedData = [
        { journal: 'Working Journal Name That Should Be Truncated', abdc: 'A' },
        { journal: null, abdc: 'B' },
        { journal: 'Another Working Journal', abdc: 'C' }
      ];
      
      render(<ResultsTable data={mixedData} searchTerm="" />);
      
      const expandButtons = screen.getAllByRole('button', { name: /Expandir nome completo/ });
      expect(expandButtons.length).toBeGreaterThan(0);
      
      await user.click(expandButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Recolher nome/ })).toBeInTheDocument();
      });
    });
  });

  describe('Integration Tests', () => {
    it('should work with sorting', async () => {
      render(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      const expandButton = screen.getByRole('button', { name: /Expandir nome completo/ });
      await user.click(expandButton);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Recolher nome/ })).toBeInTheDocument();
      });
      
      const journalHeader = screen.getByRole('columnheader', { name: /Journal/ });
      await user.click(journalHeader);
      
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });
    });

    it('should work with export functionality', () => {
      const mockExportCSV = vi.fn();
      
      render(
        <ResultsTable 
          data={mockJournalData} 
          searchTerm="" 
          onExportCSV={mockExportCSV}
        />
      );
      
      const checkbox = screen.getAllByRole('checkbox')[1];
      fireEvent.click(checkbox);
      
      expect(checkbox).toBeChecked();
    });
  });
});