/**
 * Testes de UX e ajustes finais para truncamento de journals
 * Subtask: Realizar ajustes finais de UX baseados em feedback
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResultsTable from '../components/ResultsTable';

// Mock data
const mockJournalData = [
  {
    journal: 'Journal with Very Long Name That Should Be Truncated Because It Exceeds Thirty Characters',
    abdc: 'A*',
    abs: '4*',
    sjr: { quartile: 'Q1', score: 3.2, hIndex: 67 },
    jcr: { quartile: 'Q1', impactFactor: 4.5, category: 'Computer Science' },
    predatory: { isPredatory: false },
    wileySubject: 'Technology'
  },
  {
    journal: 'Another Very Long Journal Name That Also Needs Truncation For Better Display',
    abdc: 'A',
    abs: '3',
    sjr: { quartile: 'Q2', score: 2.1 },
    jcr: { quartile: 'Q2', impactFactor: 2.8 },
    predatory: { isPredatory: false }
  },
  {
    journal: 'Short Journal',
    abdc: 'B',
    abs: '2',
    sjr: { quartile: 'Q3', score: 1.5 },
    jcr: { quartile: 'Q3', impactFactor: 1.9 },
    predatory: { isPredatory: true }
  },
  {
    journal: 'Medium Length Journal Name',
    abdc: 'C',
    abs: '1',
    sjr: { quartile: 'Q4', score: 0.8 },
    jcr: { quartile: 'Q4', impactFactor: 1.2 },
    predatory: { isPredatory: false }
  }
];

// UX testing utilities
const measureUserInteractionTime = async (interaction) => {
  const start = performance.now();
  await interaction();
  const end = performance.now();
  return end - start;
};

const simulateUserBehavior = {
  quickScan: async (user) => {
    // Simulate user quickly scanning the table
    const table = screen.getByRole('table');
    fireEvent.mouseEnter(table);
    await new Promise(resolve => setTimeout(resolve, 100));
    fireEvent.mouseLeave(table);
  },
  
  detailedReview: async (user) => {
    // Simulate user carefully reviewing journal names
    const journalCells = document.querySelectorAll('.journal-cell');
    for (let i = 0; i < Math.min(3, journalCells.length); i++) {
      fireEvent.mouseEnter(journalCells[i]);
      await new Promise(resolve => setTimeout(resolve, 200));
      fireEvent.mouseLeave(journalCells[i]);
    }
  },
  
  expandMultiple: async (user) => {
    // Simulate user expanding multiple journals
    const expandButtons = screen.getAllByRole('button', { name: /Expandir nome completo/ });
    for (let i = 0; i < Math.min(3, expandButtons.length); i++) {
      await user.click(expandButtons[i]);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
};

describe('UX and Final Adjustments Tests', () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Visual Feedback and Indicators', () => {
    it('should provide clear visual indicators for truncated content', () => {
      const { container } = render(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      // Check for ellipsis in truncated content
      const truncatedCells = container.querySelectorAll('.journal-cell.truncated');
      
      truncatedCells.forEach(cell => {
        const styles = window.getComputedStyle(cell);
        expect(styles.textOverflow).toBe('ellipsis');
        expect(styles.whiteSpace).toBe('nowrap');
        expect(styles.overflow).toBe('hidden');
      });
      
      // Check for expand buttons on truncated content
      const expandButtons = screen.getAllByRole('button', { name: /Expandir nome completo/ });
      expect(expandButtons.length).toBeGreaterThan(0);
    });

    it('should show appropriate hover states', async () => {
      const { container } = render(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      const interactiveCell = container.querySelector('.journal-cell.interactive');
      
      if (interactiveCell) {
        // Test hover state
        fireEvent.mouseEnter(interactiveCell);
        
        const styles = window.getComputedStyle(interactiveCell);
        expect(styles.cursor).toBe('pointer');
        
        // Should have visual feedback (color change, underline, etc.)
        expect(
          styles.textDecoration.includes('underline') ||
          styles.color !== 'rgb(17, 24, 39)' || // not default gray-900
          styles.backgroundColor !== 'rgba(0, 0, 0, 0)'
        ).toBe(true);
        
        fireEvent.mouseLeave(interactiveCell);
      }
    });

    it('should provide smooth transitions between states', async () => {
      const { container } = render(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      const expandButton = screen.getByRole('button', { name: /Expandir nome completo/ });
      const journalCell = expandButton.closest('.journal-cell-container').querySelector('.journal-cell');
      
      // Check transition properties
      const styles = window.getComputedStyle(journalCell);
      expect(styles.transition).toContain('all');
      expect(styles.transitionDuration).toBeTruthy();
      
      // Test transition during expansion
      await user.click(expandButton);
      
      await waitFor(() => {
        expect(journalCell).toHaveClass('expanded');
        expect(journalCell).not.toHaveClass('truncated');
      });
    });

    it('should display informative tooltips', async () => {
      render(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      const truncatedCell = screen.getByText(/Journal with Very Long Name/);
      const cellContainer = truncatedCell.closest('.journal-cell');
      
      // Check tooltip presence
      expect(cellContainer).toHaveAttribute('title');
      
      const tooltip = cellContainer.getAttribute('title');
      expect(tooltip).toContain('Because It Exceeds Thirty Characters');
      
      // Tooltip should contain full journal name
      expect(tooltip).toBe(mockJournalData[0].journal);
    });

    it('should show clear button states and feedback', async () => {
      const { container } = render(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      const expandButton = screen.getByRole('button', { name: /Expandir nome completo/ });
      
      // Initial state
      expect(expandButton.textContent).toContain('+');
      expect(expandButton).toHaveAttribute('title');
      
      // Hover state
      fireEvent.mouseEnter(expandButton);
      const hoverStyles = window.getComputedStyle(expandButton);
      expect(hoverStyles.transform).toContain('scale');
      
      fireEvent.mouseLeave(expandButton);
      
      // Expanded state
      await user.click(expandButton);
      
      await waitFor(() => {
        const collapseButton = screen.getByRole('button', { name: /Recolher nome/ });
        expect(collapseButton.textContent).toContain('−');
        expect(collapseButton).toHaveAttribute('title');
      });
    });
  });

  describe('User Interaction Patterns', () => {
    it('should handle rapid clicking gracefully', async () => {
      render(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      const expandButton = screen.getByRole('button', { name: /Expandir nome completo/ });
      
      // Rapid clicks
      for (let i = 0; i < 5; i++) {
        await user.click(expandButton);
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      // Should end up in a consistent state
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        const expandButtons = buttons.filter(btn => btn.getAttribute('aria-label')?.includes('Expandir'));
        const collapseButtons = buttons.filter(btn => btn.getAttribute('aria-label')?.includes('Recolher'));
        
        // Should have either expand or collapse button, not both
        expect(expandButtons.length + collapseButtons.length).toBe(1);
      });
    });

    it('should provide immediate visual feedback on interaction', async () => {
      render(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      const expandButton = screen.getByRole('button', { name: /Expandir nome completo/ });
      
      const interactionTime = await measureUserInteractionTime(async () => {
        await user.click(expandButton);
        
        await waitFor(() => {
          expect(screen.getByRole('button', { name: /Recolher nome/ })).toBeInTheDocument();
        });
      });
      
      // Interaction should feel immediate (< 200ms)
      expect(interactionTime).toBeLessThan(200);
    });

    it('should handle multiple simultaneous expansions intuitively', async () => {
      render(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      await simulateUserBehavior.expandMultiple(user);
      
      // All expanded journals should be visible
      const collapseButtons = screen.getAllByRole('button', { name: /Recolher nome/ });
      expect(collapseButtons.length).toBe(3);
      
      // Each should show full content
      expect(screen.getByText(/Because It Exceeds Thirty Characters/)).toBeInTheDocument();
      expect(screen.getByText(/Also Needs Truncation For Better Display/)).toBeInTheDocument();
    });

    it('should maintain context during interactions', async () => {
      render(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      // Expand first journal
      const firstExpandButton = screen.getAllByRole('button', { name: /Expandir nome completo/ })[0];
      await user.click(firstExpandButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Because It Exceeds Thirty Characters/)).toBeInTheDocument();
      });
      
      // Expand second journal
      const secondExpandButton = screen.getAllByRole('button', { name: /Expandir nome completo/ })[0];
      await user.click(secondExpandButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Also Needs Truncation For Better Display/)).toBeInTheDocument();
      });
      
      // First journal should still be expanded
      expect(screen.getByText(/Because It Exceeds Thirty Characters/)).toBeInTheDocument();
    });

    it('should handle edge cases gracefully', async () => {
      const edgeCaseData = [
        { journal: '', abdc: 'A' }, // Empty name
        { journal: 'A', abdc: 'B' }, // Single character
        { journal: 'Exactly thirty characters long!', abdc: 'C' }, // Exactly 30 chars
        { journal: 'Exactly thirty-one characters!', abdc: 'A' }, // 31 chars
      ];
      
      render(<ResultsTable data={edgeCaseData} searchTerm="" />);
      
      // Should render without errors
      expect(screen.getByRole('table')).toBeInTheDocument();
      
      // Only journals longer than 30 chars should have expand buttons
      const expandButtons = screen.getAllByRole('button', { name: /Expandir nome completo/ });
      expect(expandButtons.length).toBe(1); // Only the 31-char journal
    });
  });

  describe('Search Integration UX', () => {
    it('should maintain search highlighting in truncated text', () => {
      const { container } = render(<ResultsTable data={mockJournalData} searchTerm="Journal" />);
      
      // Check for highlighted terms in truncated content
      const highlights = container.querySelectorAll('.search-highlight');
      expect(highlights.length).toBeGreaterThan(0);
      
      // Highlights should be visible in truncated cells
      const truncatedCells = container.querySelectorAll('.journal-cell.truncated');
      let highlightInTruncated = false;
      
      truncatedCells.forEach(cell => {
        if (cell.querySelector('.search-highlight')) {
          highlightInTruncated = true;
        }
      });
      
      expect(highlightInTruncated).toBe(true);
    });

    it('should maintain search highlighting in expanded text', async () => {
      const { container } = render(<ResultsTable data={mockJournalData} searchTerm="Journal" />);
      
      const expandButton = screen.getByRole('button', { name: /Expandir nome completo/ });
      await user.click(expandButton);
      
      await waitFor(() => {
        const expandedCell = container.querySelector('.journal-cell.expanded');
        expect(expandedCell).toBeInTheDocument();
        
        // Should still have highlighting in expanded content
        const highlight = expandedCell.querySelector('.search-highlight');
        expect(highlight).toBeInTheDocument();
        expect(highlight.textContent).toBe('Journal');
      });
    });

    it('should reset expansions appropriately on search changes', async () => {
      const { rerender } = render(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      // Expand a journal
      const expandButton = screen.getByRole('button', { name: /Expandir nome completo/ });
      await user.click(expandButton);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Recolher nome/ })).toBeInTheDocument();
      });
      
      // Change search term
      rerender(<ResultsTable data={mockJournalData} searchTerm="test" />);
      
      // Expansions should be reset
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /Recolher nome/ })).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Expandir nome completo/ })).toBeInTheDocument();
      });
    });
  });

  describe('Layout and Spacing', () => {
    it('should maintain proper table layout with mixed content', async () => {
      render(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      // Expand some journals to create mixed layout
      const expandButtons = screen.getAllByRole('button', { name: /Expandir nome completo/ });
      await user.click(expandButtons[0]);
      
      await waitFor(() => {
        const table = screen.getByRole('table');
        const rows = within(table).getAllByRole('row');
        
        // All rows should maintain consistent structure
        rows.slice(1).forEach(row => { // Skip header
          const cells = within(row).getAllByRole('cell');
          expect(cells.length).toBeGreaterThan(0);
        });
      });
    });

    it('should prevent layout shifts during expansion', async () => {
      const { container } = render(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      const table = container.querySelector('table');
      const initialWidth = table.offsetWidth;
      
      // Expand a journal
      const expandButton = screen.getByRole('button', { name: /Expandir nome completo/ });
      await user.click(expandButton);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Recolher nome/ })).toBeInTheDocument();
      });
      
      // Table width should not change significantly
      const finalWidth = table.offsetWidth;
      expect(Math.abs(finalWidth - initialWidth)).toBeLessThan(50);
    });

    it('should handle long content without breaking layout', async () => {
      const veryLongData = [{
        journal: 'This is an extremely long journal name that goes on and on and should test the limits of our truncation and expansion system to ensure it handles edge cases properly without breaking the overall table layout or causing horizontal scrolling issues',
        abdc: 'A*',
        abs: '4*',
        sjr: { quartile: 'Q1', score: 3.2 },
        jcr: { quartile: 'Q1', impactFactor: 4.5 },
        predatory: { isPredatory: false }
      }];
      
      const { container } = render(<ResultsTable data={veryLongData} searchTerm="" />);
      
      // Should truncate very long content
      const truncatedCell = container.querySelector('.journal-cell.truncated');
      expect(truncatedCell).toBeInTheDocument();
      
      // Expand it
      const expandButton = screen.getByRole('button', { name: /Expandir nome completo/ });
      await user.click(expandButton);
      
      await waitFor(() => {
        const expandedCell = container.querySelector('.journal-cell.expanded');
        expect(expandedCell).toBeInTheDocument();
        
        // Should wrap text properly
        const styles = window.getComputedStyle(expandedCell);
        expect(styles.whiteSpace).toBe('normal');
        expect(styles.wordBreak).toBe('break-word');
      });
    });

    it('should maintain consistent spacing and alignment', () => {
      const { container } = render(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      const journalCells = container.querySelectorAll('.journal-cell-container');
      
      journalCells.forEach(cell => {
        const styles = window.getComputedStyle(cell);
        
        // Should have consistent minimum width
        expect(parseInt(styles.minWidth)).toBeGreaterThanOrEqual(200);
        
        // Should have proper positioning
        expect(styles.position).toBe('relative');
      });
    });
  });

  describe('Performance and Responsiveness', () => {
    it('should feel responsive during user interactions', async () => {
      render(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      const interactions = [
        () => simulateUserBehavior.quickScan(user),
        () => simulateUserBehavior.detailedReview(user),
        () => simulateUserBehavior.expandMultiple(user)
      ];
      
      for (const interaction of interactions) {
        const time = await measureUserInteractionTime(interaction);
        
        // Each interaction should feel responsive
        expect(time).toBeLessThan(1000);
      }
    });

    it('should maintain smooth animations', async () => {
      const { container } = render(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      const expandButton = screen.getByRole('button', { name: /Expandir nome completo/ });
      const journalCell = expandButton.closest('.journal-cell-container').querySelector('.journal-cell');
      
      // Check animation properties
      const styles = window.getComputedStyle(journalCell);
      expect(styles.transition).toContain('ease-in-out');
      
      // Test animation during state change
      const animationTime = await measureUserInteractionTime(async () => {
        await user.click(expandButton);
        
        await waitFor(() => {
          expect(journalCell).toHaveClass('expanded');
        });
      });
      
      // Animation should be smooth but not too slow
      expect(animationTime).toBeLessThan(500);
    });

    it('should handle rapid state changes smoothly', async () => {
      render(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      const expandButton = screen.getByRole('button', { name: /Expandir nome completo/ });
      
      // Rapid expand/collapse cycles
      for (let i = 0; i < 10; i++) {
        await user.click(expandButton);
        
        await waitFor(() => {
          const button = screen.getByRole('button', { name: /Recolher nome/ });
          expect(button).toBeInTheDocument();
        });
        
        const collapseButton = screen.getByRole('button', { name: /Recolher nome/ });
        await user.click(collapseButton);
        
        await waitFor(() => {
          expect(screen.getByRole('button', { name: /Expandir nome completo/ })).toBeInTheDocument();
        });
      }
      
      // Should end in consistent state
      expect(screen.getByRole('button', { name: /Expandir nome completo/ })).toBeInTheDocument();
    });
  });

  describe('Error States and Edge Cases UX', () => {
    it('should handle missing or invalid data gracefully', () => {
      const problematicData = [
        { journal: null, abdc: 'A' },
        { journal: undefined, abs: '3' },
        { journal: '', sjr: { quartile: 'Q1' } },
        { /* missing journal property */ abdc: 'B' }
      ];
      
      const { container } = render(<ResultsTable data={problematicData} searchTerm="" />);
      
      // Should render without crashing
      expect(screen.getByRole('table')).toBeInTheDocument();
      
      // Should show fallback content
      const fallbackElements = container.querySelectorAll('.journal-cell-fallback');
      expect(fallbackElements.length).toBeGreaterThan(0);
      
      // Fallback elements should be user-friendly
      fallbackElements.forEach(element => {
        expect(element.textContent).not.toBe('');
        expect(element.textContent).not.toContain('null');
        expect(element.textContent).not.toContain('undefined');
      });
    });

    it('should provide helpful feedback for error states', () => {
      const errorData = [
        { journal: 'Valid Journal', abdc: 'A' },
        { journal: null, abdc: 'B' }
      ];
      
      const { container } = render(<ResultsTable data={errorData} searchTerm="" />);
      
      // Check for user-friendly error indicators
      const errorIndicators = container.querySelectorAll('.error-indicator, .warning-indicator');
      
      errorIndicators.forEach(indicator => {
        // Should have helpful tooltip
        expect(indicator).toHaveAttribute('title');
        
        const title = indicator.getAttribute('title');
        expect(title).not.toContain('null');
        expect(title).not.toContain('undefined');
        expect(title.length).toBeGreaterThan(10); // Should be descriptive
      });
    });

    it('should maintain usability even with partial failures', async () => {
      const mixedData = [
        { journal: 'Working Journal Name That Should Be Truncated', abdc: 'A' },
        { journal: null, abdc: 'B' },
        { journal: 'Another Working Journal', abdc: 'C' }
      ];
      
      render(<ResultsTable data={mixedData} searchTerm="" />);
      
      // Working journals should still be interactive
      const expandButtons = screen.getAllByRole('button', { name: /Expandir nome completo/ });
      expect(expandButtons.length).toBeGreaterThan(0);
      
      // Should be able to expand working journals
      await user.click(expandButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Recolher nome/ })).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility and UX Integration', () => {
    it('should provide clear visual and auditory feedback', async () => {
      const { container } = render(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      const expandButton = screen.getByRole('button', { name: /Expandir nome completo/ });
      
      // Visual feedback
      fireEvent.mouseEnter(expandButton);
      const hoverStyles = window.getComputedStyle(expandButton);
      expect(hoverStyles.transform).toContain('scale');
      
      fireEvent.mouseLeave(expandButton);
      
      // Auditory feedback (ARIA live regions)
      await user.click(expandButton);
      
      await waitFor(() => {
        const liveRegions = container.querySelectorAll('[aria-live]');
        expect(liveRegions.length).toBeGreaterThan(0);
      });
    });

    it('should maintain consistent interaction patterns', async () => {
      render(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      const expandButtons = screen.getAllByRole('button', { name: /Expandir nome completo/ });
      
      // All expand buttons should behave consistently
      for (const button of expandButtons.slice(0, 2)) {
        await user.click(button);
        
        await waitFor(() => {
          // Should change to collapse button
          expect(button.getAttribute('aria-label')).toContain('Recolher');
          expect(button.textContent).toContain('−');
        });
        
        // Click again to collapse
        await user.click(button);
        
        await waitFor(() => {
          // Should change back to expand button
          expect(button.getAttribute('aria-label')).toContain('Expandir');
          expect(button.textContent).toContain('+');
        });
      }
    });

    it('should provide appropriate feedback timing', async () => {
      render(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      const expandButton = screen.getByRole('button', { name: /Expandir nome completo/ });
      
      const feedbackTime = await measureUserInteractionTime(async () => {
        await user.click(expandButton);
        
        // Wait for visual feedback
        await waitFor(() => {
          expect(screen.getByRole('button', { name: /Recolher nome/ })).toBeInTheDocument();
        });
      });
      
      // Feedback should be immediate (< 100ms for good UX)
      expect(feedbackTime).toBeLessThan(100);
    });
  });
});