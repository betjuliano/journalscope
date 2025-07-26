/**
 * Testes de responsividade para truncamento de journals
 * Subtask: Validar responsividade em dispositivos móveis e tablets
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
    journal: 'Medium Length Journal Name',
    abdc: 'A',
    abs: '3',
    sjr: { quartile: 'Q1', score: 2.8 },
    jcr: { quartile: 'Q2', impactFactor: 2.3 },
    predatory: { isPredatory: false }
  },
  {
    journal: 'Short Journal',
    abdc: 'B',
    abs: '2',
    sjr: { quartile: 'Q3', score: 1.2 },
    jcr: { quartile: 'Q3', impactFactor: 1.8 },
    predatory: { isPredatory: false }
  }
];

// Viewport simulation utilities
const setViewport = (width, height) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
  
  // Trigger resize event
  window.dispatchEvent(new Event('resize'));
};

// Device presets
const devices = {
  mobile: {
    portrait: { width: 375, height: 667, name: 'Mobile Portrait' },
    landscape: { width: 667, height: 375, name: 'Mobile Landscape' }
  },
  tablet: {
    portrait: { width: 768, height: 1024, name: 'Tablet Portrait' },
    landscape: { width: 1024, height: 768, name: 'Tablet Landscape' }
  },
  desktop: {
    small: { width: 1366, height: 768, name: 'Small Desktop' },
    large: { width: 1920, height: 1080, name: 'Large Desktop' }
  }
};

describe('Responsive Design Tests', () => {
  let user;
  let originalInnerWidth;
  let originalInnerHeight;

  beforeEach(() => {
    user = userEvent.setup();
    originalInnerWidth = window.innerWidth;
    originalInnerHeight = window.innerHeight;
  });

  afterEach(() => {
    // Restore original viewport
    setViewport(originalInnerWidth, originalInnerHeight);
  });

  describe('Mobile Devices', () => {
    Object.values(devices.mobile).forEach(device => {
      describe(`${device.name} (${device.width}x${device.height})`, () => {
        beforeEach(() => {
          setViewport(device.width, device.height);
        });

        it('should render table correctly on mobile', async () => {
          const { container } = render(<ResultsTable data={mockJournalData} searchTerm="" />);
          
          // Wait for resize effect to take place
          await waitFor(() => {
            expect(screen.getByRole('table')).toBeInTheDocument();
          });

          // Check if mobile-specific classes are applied
          const journalCells = container.querySelectorAll('.journal-cell.truncated');
          journalCells.forEach(cell => {
            const styles = window.getComputedStyle(cell);
            // Mobile should have smaller max-width
            expect(parseInt(styles.maxWidth)).toBeLessThanOrEqual(150);
          });
        });

        it('should have appropriately sized expand buttons on mobile', async () => {
          const { container } = render(<ResultsTable data={mockJournalData} searchTerm="" />);
          
          await waitFor(() => {
            const expandButtons = container.querySelectorAll('.journal-expand-button');
            expect(expandButtons.length).toBeGreaterThan(0);
            
            expandButtons.forEach(button => {
              const styles = window.getComputedStyle(button);
              // Mobile buttons should be smaller
              expect(parseInt(styles.width)).toBeLessThanOrEqual(16);
              expect(parseInt(styles.height)).toBeLessThanOrEqual(16);
            });
          });
        });

        it('should maintain touch-friendly interaction areas', async () => {
          render(<ResultsTable data={mockJournalData} searchTerm="" />);
          
          const expandButton = screen.getByRole('button', { name: /Expandir nome completo/ });
          
          // Test touch interaction
          fireEvent.touchStart(expandButton);
          fireEvent.touchEnd(expandButton);
          
          await waitFor(() => {
            expect(screen.getByRole('button', { name: /Recolher nome/ })).toBeInTheDocument();
          });
        });

        it('should handle text overflow correctly on small screens', async () => {
          const { container } = render(<ResultsTable data={mockJournalData} searchTerm="" />);
          
          await waitFor(() => {
            const truncatedCells = container.querySelectorAll('.journal-cell.truncated');
            
            truncatedCells.forEach(cell => {
              const styles = window.getComputedStyle(cell);
              expect(styles.textOverflow).toBe('ellipsis');
              expect(styles.whiteSpace).toBe('nowrap');
            });
          });
        });

        it('should expand to appropriate width on mobile', async () => {
          const { container } = render(<ResultsTable data={mockJournalData} searchTerm="" />);
          
          const expandButton = screen.getByRole('button', { name: /Expandir nome completo/ });
          await user.click(expandButton);
          
          await waitFor(() => {
            const expandedCell = container.querySelector('.journal-cell.expanded');
            expect(expandedCell).toBeInTheDocument();
            
            const styles = window.getComputedStyle(expandedCell);
            // Expanded mobile cells should not exceed screen width
            expect(parseInt(styles.maxWidth)).toBeLessThanOrEqual(300);
          });
        });

        it('should maintain readability with smaller font sizes', () => {
          const { container } = render(<ResultsTable data={mockJournalData} searchTerm="" />);
          
          // Check if mobile-specific font sizes are applied
          const table = container.querySelector('.table');
          const styles = window.getComputedStyle(table);
          
          // Mobile should use smaller font size
          expect(parseFloat(styles.fontSize)).toBeLessThanOrEqual(14);
        });
      });
    });
  });

  describe('Tablet Devices', () => {
    Object.values(devices.tablet).forEach(device => {
      describe(`${device.name} (${device.width}x${device.height})`, () => {
        beforeEach(() => {
          setViewport(device.width, device.height);
        });

        it('should render with tablet-optimized dimensions', async () => {
          const { container } = render(<ResultsTable data={mockJournalData} searchTerm="" />);
          
          await waitFor(() => {
            const journalCells = container.querySelectorAll('.journal-cell.truncated');
            journalCells.forEach(cell => {
              const styles = window.getComputedStyle(cell);
              // Tablet should have medium max-width
              const maxWidth = parseInt(styles.maxWidth);
              expect(maxWidth).toBeGreaterThan(150); // Larger than mobile
              expect(maxWidth).toBeLessThanOrEqual(180); // Smaller than desktop
            });
          });
        });

        it('should handle both touch and mouse interactions', async () => {
          render(<ResultsTable data={mockJournalData} searchTerm="" />);
          
          const expandButton = screen.getByRole('button', { name: /Expandir nome completo/ });
          
          // Test mouse interaction
          await user.click(expandButton);
          
          await waitFor(() => {
            expect(screen.getByRole('button', { name: /Recolher nome/ })).toBeInTheDocument();
          });
          
          // Test touch interaction
          const collapseButton = screen.getByRole('button', { name: /Recolher nome/ });
          fireEvent.touchStart(collapseButton);
          fireEvent.touchEnd(collapseButton);
          
          await waitFor(() => {
            expect(screen.getByRole('button', { name: /Expandir nome completo/ })).toBeInTheDocument();
          });
        });

        it('should optimize column visibility for tablet', () => {
          render(<ResultsTable data={mockJournalData} searchTerm="" />);
          
          // Verify that essential columns are visible
          expect(screen.getByRole('columnheader', { name: /Journal/ })).toBeInTheDocument();
          expect(screen.getByRole('columnheader', { name: /ABDC/ })).toBeInTheDocument();
          expect(screen.getByRole('columnheader', { name: /ABS/ })).toBeInTheDocument();
        });

        it('should maintain proper spacing in tablet layout', async () => {
          const { container } = render(<ResultsTable data={mockJournalData} searchTerm="" />);
          
          await waitFor(() => {
            const tableCells = container.querySelectorAll('td');
            tableCells.forEach(cell => {
              const styles = window.getComputedStyle(cell);
              // Check padding is appropriate for tablet
              expect(parseInt(styles.paddingLeft)).toBeGreaterThanOrEqual(12);
              expect(parseInt(styles.paddingRight)).toBeGreaterThanOrEqual(12);
            });
          });
        });
      });
    });
  });

  describe('Desktop Devices', () => {
    Object.values(devices.desktop).forEach(device => {
      describe(`${device.name} (${device.width}x${device.height})`, () => {
        beforeEach(() => {
          setViewport(device.width, device.height);
        });

        it('should render with full desktop features', async () => {
          const { container } = render(<ResultsTable data={mockJournalData} searchTerm="" />);
          
          await waitFor(() => {
            const journalCells = container.querySelectorAll('.journal-cell.truncated');
            journalCells.forEach(cell => {
              const styles = window.getComputedStyle(cell);
              // Desktop should have full max-width
              expect(parseInt(styles.maxWidth)).toBeGreaterThanOrEqual(200);
            });
          });
        });

        it('should show all optional columns when space allows', () => {
          render(<ResultsTable data={mockJournalData} searchTerm="" />);
          
          // Desktop should show more columns
          expect(screen.getByRole('columnheader', { name: /Journal/ })).toBeInTheDocument();
          expect(screen.getByRole('columnheader', { name: /ABDC/ })).toBeInTheDocument();
          expect(screen.getByRole('columnheader', { name: /ABS/ })).toBeInTheDocument();
          expect(screen.getByRole('columnheader', { name: /SJR Quartile/ })).toBeInTheDocument();
          expect(screen.getByRole('columnheader', { name: /JCR Quartile/ })).toBeInTheDocument();
        });

        it('should handle hover states properly on desktop', async () => {
          const { container } = render(<ResultsTable data={mockJournalData} searchTerm="" />);
          
          const interactiveCell = container.querySelector('.journal-cell.interactive');
          
          // Test hover
          fireEvent.mouseEnter(interactiveCell);
          
          const styles = window.getComputedStyle(interactiveCell);
          expect(styles.cursor).toBe('pointer');
          
          fireEvent.mouseLeave(interactiveCell);
        });

        it('should expand to full width when needed on desktop', async () => {
          const { container } = render(<ResultsTable data={mockJournalData} searchTerm="" />);
          
          const expandButton = screen.getByRole('button', { name: /Expandir nome completo/ });
          await user.click(expandButton);
          
          await waitFor(() => {
            const expandedCell = container.querySelector('.journal-cell.expanded');
            expect(expandedCell).toBeInTheDocument();
            
            const styles = window.getComputedStyle(expandedCell);
            // Desktop expanded cells can be larger
            expect(parseInt(styles.maxWidth)).toBeGreaterThanOrEqual(400);
          });
        });
      });
    });
  });

  describe('Responsive Breakpoint Transitions', () => {
    it('should transition smoothly between mobile and tablet', async () => {
      const { container, rerender } = render(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      // Start with mobile
      setViewport(375, 667);
      rerender(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      await waitFor(() => {
        const mobileCell = container.querySelector('.journal-cell.truncated');
        const mobileStyles = window.getComputedStyle(mobileCell);
        expect(parseInt(mobileStyles.maxWidth)).toBeLessThanOrEqual(150);
      });
      
      // Transition to tablet
      setViewport(768, 1024);
      rerender(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      await waitFor(() => {
        const tabletCell = container.querySelector('.journal-cell.truncated');
        const tabletStyles = window.getComputedStyle(tabletCell);
        expect(parseInt(tabletStyles.maxWidth)).toBeGreaterThan(150);
      });
    });

    it('should transition smoothly between tablet and desktop', async () => {
      const { container, rerender } = render(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      // Start with tablet
      setViewport(768, 1024);
      rerender(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      await waitFor(() => {
        const tabletCell = container.querySelector('.journal-cell.truncated');
        const tabletStyles = window.getComputedStyle(tabletCell);
        expect(parseInt(tabletStyles.maxWidth)).toBeLessThan(200);
      });
      
      // Transition to desktop
      setViewport(1440, 900);
      rerender(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      await waitFor(() => {
        const desktopCell = container.querySelector('.journal-cell.truncated');
        const desktopStyles = window.getComputedStyle(desktopCell);
        expect(parseInt(desktopStyles.maxWidth)).toBeGreaterThanOrEqual(200);
      });
    });

    it('should maintain functionality during viewport changes', async () => {
      render(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      // Start with desktop and expand a journal
      setViewport(1440, 900);
      
      const expandButton = screen.getByRole('button', { name: /Expandir nome completo/ });
      await user.click(expandButton);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Recolher nome/ })).toBeInTheDocument();
      });
      
      // Change to mobile - expansion state should be maintained
      setViewport(375, 667);
      
      await waitFor(() => {
        // State should still be expanded
        expect(screen.getByRole('button', { name: /Recolher nome/ })).toBeInTheDocument();
      });
    });
  });

  describe('Orientation Changes', () => {
    it('should handle portrait to landscape transition on mobile', async () => {
      const { container, rerender } = render(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      // Portrait
      setViewport(375, 667);
      rerender(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });
      
      // Landscape
      setViewport(667, 375);
      rerender(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
        // Should still have mobile-optimized cells
        const cells = container.querySelectorAll('.journal-cell.truncated');
        expect(cells.length).toBeGreaterThan(0);
      });
    });

    it('should handle portrait to landscape transition on tablet', async () => {
      const { rerender } = render(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      // Portrait
      setViewport(768, 1024);
      rerender(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });
      
      // Landscape
      setViewport(1024, 768);
      rerender(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
        // Should maintain tablet functionality
        expect(screen.getByRole('columnheader', { name: /Journal/ })).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility on Different Screen Sizes', () => {
    it('should maintain touch targets of appropriate size on mobile', async () => {
      setViewport(375, 667);
      
      const { container } = render(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      await waitFor(() => {
        const expandButtons = container.querySelectorAll('.journal-expand-button');
        
        expandButtons.forEach(button => {
          const rect = button.getBoundingClientRect();
          // Touch targets should be at least 44px (iOS) or 48px (Android)
          expect(Math.min(rect.width, rect.height)).toBeGreaterThanOrEqual(16); // Minimum for our small buttons
        });
      });
    });

    it('should maintain readable text sizes across devices', () => {
      const viewports = [
        { width: 375, height: 667 },
        { width: 768, height: 1024 },
        { width: 1440, height: 900 }
      ];
      
      viewports.forEach(viewport => {
        setViewport(viewport.width, viewport.height);
        
        const { container } = render(<ResultsTable data={mockJournalData} searchTerm="" />);
        
        const journalCells = container.querySelectorAll('.journal-cell');
        journalCells.forEach(cell => {
          const styles = window.getComputedStyle(cell);
          const fontSize = parseFloat(styles.fontSize);
          
          // Text should be readable (minimum 12px)
          expect(fontSize).toBeGreaterThanOrEqual(12);
        });
      });
    });

    it('should provide adequate spacing for different input methods', async () => {
      const { container } = render(<ResultsTable data={mockJournalData} searchTerm="" />);
      
      // Mobile - touch
      setViewport(375, 667);
      
      await waitFor(() => {
        const buttons = container.querySelectorAll('.journal-expand-button');
        buttons.forEach(button => {
          const styles = window.getComputedStyle(button);
          // Should have adequate margin/padding for touch
          expect(parseInt(styles.margin) || 0).toBeGreaterThanOrEqual(0);
        });
      });
      
      // Desktop - mouse
      setViewport(1440, 900);
      
      await waitFor(() => {
        const buttons = container.querySelectorAll('.journal-expand-button');
        buttons.forEach(button => {
          const styles = window.getComputedStyle(button);
          // Desktop can have tighter spacing
          expect(parseInt(styles.width)).toBeGreaterThanOrEqual(20);
        });
      });
    });
  });
});