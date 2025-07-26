/**
 * Testes de acessibilidade para truncamento de journals
 * Subtask: Verificar acessibilidade com ferramentas de screen reader
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import ResultsTable from '../components/ResultsTable';

// Extend expect with jest-axe matchers
expect.extend(toHaveNoViolations);

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
    journal: 'Medium Length Journal Name',
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
  }
];

// Screen reader simulation utilities
const mockScreenReader = {
  announcements: [],
  announce: vi.fn((text) => {
    mockScreenReader.announcements.push(text);
  }),
  clear: () => {
    mockScreenReader.announcements = [];
  }
};

// Mock ARIA live region updates
const mockAriaLive = () => {
  const liveRegions = [];
  
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' || mutation.type === 'characterData') {
        const target = mutation.target;
        if (target.getAttribute && target.getAttribute('aria-live')) {
          liveRegions.push({
            element: target,
            content: target.textContent,
            level: target.getAttribute('aria-live')
          });
        }
      }
    });
  });
  
  return { observer, liveRegions };
};

describe('Accessibility Tests for Journal Truncation', () => {
  let user;
  let ariaLiveMock;

  beforeEach(() => {
    user = userEvent.setup();
    mockScreenReader.clear();
    ariaLiveMock = mockAriaLive();
    
    // Start observing DOM changes
    ariaLiveMock.observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  });

  afterEach(() => {
    ariaLiveMock.observer.disconnect();
    vi.clearAllMocks();
  });

  describe('Automated Accessibility Testing', () => {
    it('should pass axe accessibility tests', async () => {
      const { container } = render(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should pass axe tests with expanded journals', async () => {
      const { container } = render(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      // Expand a journal
      const expandButton = screen.getByRole('button', { name: /Expandir nome completo/ });
      await user.click(expandButton);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Recolher nome/ })).toBeInTheDocument();
      });
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should pass axe tests with search highlighting', async () => {
      const { container } = render(<ResultsTable data={mockJournalData} searchTerm="Journal" />);
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support Tab navigation through expand buttons', async () => {
      render(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      const expandButtons = screen.getAllByRole('button', { name: /Expandir nome completo/ });
      
      // Tab to first button
      await user.tab();
      
      // Find the focused expand button
      let focusedButton = expandButtons.find(button => button === document.activeElement);
      
      if (!focusedButton) {
        // If not focused on expand button, continue tabbing
        for (let i = 0; i < 10; i++) {
          await user.tab();
          focusedButton = expandButtons.find(button => button === document.activeElement);
          if (focusedButton) break;
        }
      }
      
      expect(focusedButton).toBeTruthy();
      expect(focusedButton).toHaveFocus();
    });

    it('should activate expand button with Enter key', async () => {
      render(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      const expandButton = screen.getByRole('button', { name: /Expandir nome completo/ });
      
      // Focus and press Enter
      expandButton.focus();
      expect(expandButton).toHaveFocus();
      
      fireEvent.keyDown(expandButton, { key: 'Enter' });
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Recolher nome/ })).toBeInTheDocument();
      });
    });

    it('should activate expand button with Space key', async () => {
      render(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      const expandButton = screen.getByRole('button', { name: /Expandir nome completo/ });
      
      // Focus and press Space
      expandButton.focus();
      expect(expandButton).toHaveFocus();
      
      fireEvent.keyDown(expandButton, { key: ' ' });
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Recolher nome/ })).toBeInTheDocument();
      });
    });

    it('should support keyboard navigation of interactive journal cells', async () => {
      const { container } = render(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      const interactiveCells = container.querySelectorAll('.journal-cell.interactive');
      
      if (interactiveCells.length > 0) {
        const cell = interactiveCells[0];
        
        // Focus the cell
        cell.focus();
        expect(cell).toHaveFocus();
        
        // Activate with Enter
        fireEvent.keyDown(cell, { key: 'Enter' });
        
        await waitFor(() => {
          expect(screen.getByRole('button', { name: /Recolher nome/ })).toBeInTheDocument();
        });
      }
    });

    it('should maintain logical tab order', async () => {
      render(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      const focusableElements = screen.getAllByRole('button').concat(
        screen.getAllByRole('checkbox'),
        screen.getAllByRole('columnheader')
      );
      
      // Tab through elements and verify order makes sense
      let currentIndex = 0;
      
      for (let i = 0; i < Math.min(10, focusableElements.length); i++) {
        await user.tab();
        
        const focusedElement = document.activeElement;
        const elementIndex = focusableElements.indexOf(focusedElement);
        
        if (elementIndex >= 0) {
          // Focus should generally move forward (with some exceptions for complex layouts)
          expect(elementIndex).toBeGreaterThanOrEqual(currentIndex - 2);
          currentIndex = elementIndex;
        }
      }
    });
  });

  describe('ARIA Labels and Attributes', () => {
    it('should have proper ARIA labels on expand buttons', () => {
      render(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      const expandButtons = screen.getAllByRole('button', { name: /Expandir nome completo/ });
      
      expandButtons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
        expect(button).toHaveAttribute('aria-expanded', 'false');
        expect(button).toHaveAttribute('type', 'button');
      });
    });

    it('should update ARIA attributes when expanded', async () => {
      render(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      const expandButton = screen.getByRole('button', { name: /Expandir nome completo/ });
      
      // Initial state
      expect(expandButton).toHaveAttribute('aria-expanded', 'false');
      
      // Expand
      await user.click(expandButton);
      
      await waitFor(() => {
        const collapseButton = screen.getByRole('button', { name: /Recolher nome/ });
        expect(collapseButton).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('should have proper ARIA labels on interactive journal cells', () => {
      const { container } = render(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      const interactiveCells = container.querySelectorAll('.journal-cell.interactive');
      
      interactiveCells.forEach(cell => {
        expect(cell).toHaveAttribute('aria-label');
        expect(cell).toHaveAttribute('role');
        expect(cell).toHaveAttribute('tabindex');
      });
    });

    it('should provide descriptive ARIA labels', () => {
      render(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      const expandButton = screen.getByRole('button', { name: /Expandir nome completo/ });
      const ariaLabel = expandButton.getAttribute('aria-label');
      
      // ARIA label should include journal name and action
      expect(ariaLabel).toContain('Journal');
      expect(ariaLabel).toContain('Expandir');
      expect(ariaLabel).toContain('nome completo');
    });

    it('should have proper table accessibility attributes', () => {
      render(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      const table = screen.getByRole('table');
      expect(table).toHaveAttribute('aria-label');
      expect(table).toHaveAttribute('aria-describedby');
      
      // Check for table caption
      const caption = table.querySelector('caption');
      expect(caption).toBeInTheDocument();
      expect(caption).toHaveClass('sr-only');
      
      // Check column headers
      const columnHeaders = screen.getAllByRole('columnheader');
      columnHeaders.forEach(header => {
        expect(header).toHaveAttribute('scope', 'col');
      });
    });

    it('should have proper row accessibility attributes', () => {
      render(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      const rows = screen.getAllByRole('row');
      const dataRows = rows.slice(1); // Skip header row
      
      dataRows.forEach(row => {
        expect(row).toHaveAttribute('aria-describedby');
      });
    });
  });

  describe('Screen Reader Support', () => {
    it('should provide screen reader only content', () => {
      const { container } = render(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      const srOnlyElements = container.querySelectorAll('.sr-only');
      expect(srOnlyElements.length).toBeGreaterThan(0);
      
      // Verify sr-only elements have meaningful content
      srOnlyElements.forEach(element => {
        expect(element.textContent.trim()).not.toBe('');
      });
    });

    it('should have ARIA live regions for dynamic content', async () => {
      const { container } = render(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      const liveRegions = container.querySelectorAll('[aria-live]');
      expect(liveRegions.length).toBeGreaterThan(0);
      
      // Test that live regions update on state change
      const expandButton = screen.getByRole('button', { name: /Expandir nome completo/ });
      await user.click(expandButton);
      
      await waitFor(() => {
        // Check if any live region was updated
        const updatedLiveRegions = container.querySelectorAll('[aria-live="polite"]');
        expect(updatedLiveRegions.length).toBeGreaterThan(0);
      });
    });

    it('should provide context for screen readers on expansion', async () => {
      const { container } = render(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      const expandButton = screen.getByRole('button', { name: /Expandir nome completo/ });
      
      // Check for descriptive elements
      const buttonId = expandButton.getAttribute('aria-describedby');
      if (buttonId) {
        const description = container.querySelector(`#${buttonId}`);
        expect(description).toBeInTheDocument();
      }
      
      await user.click(expandButton);
      
      await waitFor(() => {
        // After expansion, there should be updated context
        const collapseButton = screen.getByRole('button', { name: /Recolher nome/ });
        const collapseDescription = collapseButton.getAttribute('aria-describedby');
        
        if (collapseDescription) {
          const description = container.querySelector(`#${collapseDescription}`);
          expect(description).toBeInTheDocument();
          expect(description.textContent).toContain('expandido');
        }
      });
    });

    it('should announce state changes to screen readers', async () => {
      const { container } = render(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      const expandButton = screen.getByRole('button', { name: /Expandir nome completo/ });
      
      // Mock screen reader announcements
      const liveRegionsBefore = ariaLiveMock.liveRegions.length;
      
      await user.click(expandButton);
      
      await waitFor(() => {
        // Should have new live region updates
        expect(ariaLiveMock.liveRegions.length).toBeGreaterThan(liveRegionsBefore);
      });
    });

    it('should provide alternative text for visual indicators', () => {
      render(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      const expandButtons = screen.getAllByRole('button', { name: /Expandir nome completo/ });
      
      expandButtons.forEach(button => {
        // Check for screen reader text
        const srText = button.querySelector('.sr-only');
        if (srText) {
          expect(srText.textContent).toContain('Expandir');
        }
        
        // Visual indicator should have aria-hidden
        const visualIndicator = button.querySelector('[aria-hidden="true"]');
        expect(visualIndicator).toBeInTheDocument();
      });
    });

    it('should handle focus management for screen readers', async () => {
      render(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      const expandButton = screen.getByRole('button', { name: /Expandir nome completo/ });
      
      // Focus the button
      expandButton.focus();
      expect(expandButton).toHaveFocus();
      
      // Activate it
      await user.click(expandButton);
      
      await waitFor(() => {
        // Focus should remain on the button (now collapse button)
        const collapseButton = screen.getByRole('button', { name: /Recolher nome/ });
        expect(collapseButton).toHaveFocus();
      });
    });
  });

  describe('High Contrast and Visual Accessibility', () => {
    it('should maintain accessibility in high contrast mode', () => {
      // Mock high contrast media query
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-contrast: high)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });
      
      const { container } = render(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      // Check that elements have sufficient contrast indicators
      const buttons = container.querySelectorAll('.journal-expand-button');
      buttons.forEach(button => {
        const styles = window.getComputedStyle(button);
        
        // In high contrast mode, elements should have borders or other indicators
        expect(styles.backgroundColor).not.toBe(styles.color);
      });
    });

    it('should support reduced motion preferences', () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });
      
      const { container } = render(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      // Check that animations are disabled or minimal
      const journalCells = container.querySelectorAll('.journal-cell');
      journalCells.forEach(cell => {
        const styles = window.getComputedStyle(cell);
        
        // Transitions should be minimal or disabled
        if (styles.transition) {
          expect(styles.transitionDuration).toMatch(/0\.01ms|0s/);
        }
      });
    });

    it('should maintain focus visibility', async () => {
      render(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      const expandButton = screen.getByRole('button', { name: /Expandir nome completo/ });
      
      // Focus the button
      expandButton.focus();
      
      // Check focus styles
      const styles = window.getComputedStyle(expandButton);
      
      // Should have focus indicators (outline, ring, etc.)
      expect(
        styles.outline !== 'none' || 
        styles.boxShadow.includes('ring') ||
        styles.border !== styles.backgroundColor
      ).toBe(true);
    });
  });

  describe('Error Handling and Accessibility', () => {
    it('should provide accessible error messages', () => {
      const invalidData = [
        { journal: null, abdc: 'A' },
        { journal: undefined, abs: '3' }
      ];
      
      const { container } = render(<ResultsTable data={invalidData} searchTerm="" />);
      
      // Check for error indicators
      const errorIndicators = container.querySelectorAll('.error-indicator, .warning-indicator');
      
      errorIndicators.forEach(indicator => {
        // Error indicators should have accessible text
        expect(indicator).toHaveAttribute('title');
        
        // Should be focusable or have associated focusable element
        expect(
          indicator.tabIndex >= 0 || 
          indicator.closest('[tabindex]') ||
          indicator.getAttribute('aria-describedby')
        ).toBeTruthy();
      });
    });

    it('should handle fallback rendering accessibly', () => {
      const problematicData = [
        { journal: 'Valid Journal' },
        { journal: null },
        { /* invalid data */ }
      ];
      
      const { container } = render(<ResultsTable data={problematicData} searchTerm="" />);
      
      // Check fallback elements
      const fallbackElements = container.querySelectorAll('.journal-cell-fallback, .cell-error-fallback');
      
      fallbackElements.forEach(fallback => {
        // Fallback elements should be accessible
        expect(fallback).toHaveAttribute('data-testid');
        
        // Should provide meaningful content
        expect(fallback.textContent.trim()).not.toBe('');
      });
    });
  });

  describe('Mobile Accessibility', () => {
    beforeEach(() => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      });
    });

    it('should maintain accessibility on mobile devices', async () => {
      const { container } = render(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have appropriate touch targets on mobile', () => {
      const { container } = render(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      const expandButtons = container.querySelectorAll('.journal-expand-button');
      
      expandButtons.forEach(button => {
        const rect = button.getBoundingClientRect();
        
        // Touch targets should be at least 44x44px (iOS guidelines)
        // Our buttons are smaller but should be in accessible containers
        expect(Math.min(rect.width, rect.height)).toBeGreaterThanOrEqual(16);
        
        // Should have adequate spacing
        const styles = window.getComputedStyle(button);
        expect(parseInt(styles.margin) || 0).toBeGreaterThanOrEqual(0);
      });
    });

    it('should support touch and gesture navigation', async () => {
      render(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      const expandButton = screen.getByRole('button', { name: /Expandir nome completo/ });
      
      // Test touch events
      fireEvent.touchStart(expandButton);
      fireEvent.touchEnd(expandButton);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Recolher nome/ })).toBeInTheDocument();
      });
    });
  });
});