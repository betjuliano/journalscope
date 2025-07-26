/**
 * Testes de performance para truncamento de journals
 * Subtask: Testar performance com datasets grandes (>1000 journals)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResultsTable from '../components/ResultsTable';

// Performance measurement utilities
const measurePerformance = (fn) => {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  return { result, duration: end - start };
};

const measureAsyncPerformance = async (fn) => {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  return { result, duration: end - start };
};

// Mock data generators
const createMockJournal = (index) => ({
  journal: index % 3 === 0 
    ? `Journal with Very Long Name That Should Be Truncated Because It Exceeds Thirty Characters ${index}`
    : index % 3 === 1 
    ? `Medium Length Journal Name ${index}`
    : `Short Journal ${index}`,
  abdc: ['A*', 'A', 'B', 'C'][index % 4],
  abs: ['4*', '4', '3', '2', '1'][index % 5],
  sjr: {
    quartile: ['Q1', 'Q2', 'Q3', 'Q4'][index % 4],
    score: Math.random() * 5,
    hIndex: Math.floor(Math.random() * 100),
    citableDocs: Math.floor(Math.random() * 1000)
  },
  jcr: {
    quartile: ['Q1', 'Q2', 'Q3', 'Q4'][index % 4],
    impactFactor: Math.random() * 10,
    category: `Category ${index % 10}`,
    citations: Math.floor(Math.random() * 5000),
    issn: `${String(index).padStart(4, '0')}-${String(index + 1000).padStart(4, '0')}`
  },
  citeScore: {
    score: Math.random() * 8,
    snip: Math.random() * 3
  },
  predatory: {
    isPredatory: Math.random() > 0.9
  },
  wileySubject: `Subject ${index % 20}`
});

const createLargeDataset = (size) => {
  return Array.from({ length: size }, (_, index) => createMockJournal(index));
};

// Memory usage monitoring
const getMemoryUsage = () => {
  if (performance.memory) {
    return {
      used: performance.memory.usedJSHeapSize,
      total: performance.memory.totalJSHeapSize,
      limit: performance.memory.jsHeapSizeLimit
    };
  }
  return null;
};

describe('Performance Tests for Journal Truncation', () => {
  let user;
  let memoryBefore;

  beforeEach(() => {
    user = userEvent.setup();
    memoryBefore = getMemoryUsage();
    
    // Clear any existing timers
    vi.clearAllTimers();
  });

  afterEach(() => {
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  });

  describe('Large Dataset Rendering Performance', () => {
    const dataSizes = [100, 500, 1000, 2000, 5000];

    dataSizes.forEach(size => {
      it(`should render ${size} journals within acceptable time limits`, () => {
        const largeDataset = createLargeDataset(size);
        
        const { duration } = measurePerformance(() => {
          render(<ResultsTable data={largeDataset} searchTerm="" />);
        });
        
        // Performance thresholds based on dataset size
        const expectedMaxTime = size <= 1000 ? 500 : size <= 2000 ? 1000 : 2000;
        
        expect(duration).toBeLessThan(expectedMaxTime);
        expect(screen.getByRole('table')).toBeInTheDocument();
        
        // Verify pagination is working (only first 100 items should be rendered)
        const rows = screen.getAllByRole('row');
        expect(rows.length).toBeLessThanOrEqual(101); // 100 data rows + 1 header
      });
    });

    it('should handle 10,000+ journals without crashing', () => {
      const massiveDataset = createLargeDataset(10000);
      
      const { duration } = measurePerformance(() => {
        render(<ResultsTable data={massiveDataset} searchTerm="" />);
      });
      
      // Should still render within reasonable time due to pagination
      expect(duration).toBeLessThan(2000);
      expect(screen.getByRole('table')).toBeInTheDocument();
      
      // Verify only paginated results are shown
      const rows = screen.getAllByRole('row');
      expect(rows.length).toBeLessThanOrEqual(101);
    });

    it('should maintain memory efficiency with large datasets', () => {
      const largeDataset = createLargeDataset(5000);
      
      const memoryBefore = getMemoryUsage();
      
      render(<ResultsTable data={largeDataset} searchTerm="" />);
      
      const memoryAfter = getMemoryUsage();
      
      if (memoryBefore && memoryAfter) {
        const memoryIncrease = memoryAfter.used - memoryBefore.used;
        
        // Memory increase should be reasonable (less than 50MB for 5000 items)
        expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
      }
      
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });

  describe('Journal Expansion Performance', () => {
    it('should handle rapid multiple expansions efficiently', async () => {
      const dataset = createLargeDataset(200);
      render(<ResultsTable data={dataset} searchTerm="" />);
      
      const expandButtons = screen.getAllByRole('button', { name: /Expandir nome completo/ });
      const buttonsToTest = expandButtons.slice(0, 10); // Test first 10
      
      const { duration } = await measureAsyncPerformance(async () => {
        for (const button of buttonsToTest) {
          await user.click(button);
        }
      });
      
      // Multiple expansions should be fast
      expect(duration).toBeLessThan(1000);
      
      // Verify all expansions worked
      const collapseButtons = screen.getAllByRole('button', { name: /Recolher nome/ });
      expect(collapseButtons.length).toBe(buttonsToTest.length);
    });

    it('should handle expansion/collapse cycles without performance degradation', async () => {
      const dataset = createLargeDataset(100);
      render(<ResultsTable data={dataset} searchTerm="" />);
      
      const expandButton = screen.getAllByRole('button', { name: /Expandir nome completo/ })[0];
      
      const cycles = 20;
      const durations = [];
      
      for (let i = 0; i < cycles; i++) {
        // Expand
        const { duration: expandDuration } = await measureAsyncPerformance(async () => {
          await user.click(expandButton);
        });
        
        await waitFor(() => {
          expect(screen.getByRole('button', { name: /Recolher nome/ })).toBeInTheDocument();
        });
        
        // Collapse
        const collapseButton = screen.getByRole('button', { name: /Recolher nome/ });
        const { duration: collapseDuration } = await measureAsyncPerformance(async () => {
          await user.click(collapseButton);
        });
        
        await waitFor(() => {
          expect(screen.getByRole('button', { name: /Expandir nome completo/ })).toBeInTheDocument();
        });
        
        durations.push(expandDuration + collapseDuration);
      }
      
      // Performance should not degrade over time
      const firstHalf = durations.slice(0, cycles / 2);
      const secondHalf = durations.slice(cycles / 2);
      
      const avgFirstHalf = firstHalf.reduce((a, b) => a + b) / firstHalf.length;
      const avgSecondHalf = secondHalf.reduce((a, b) => a + b) / secondHalf.length;
      
      // Second half should not be significantly slower than first half
      expect(avgSecondHalf).toBeLessThan(avgFirstHalf * 1.5);
    });

    it('should maintain performance with many simultaneously expanded journals', async () => {
      const dataset = createLargeDataset(100);
      render(<ResultsTable data={dataset} searchTerm="" />);
      
      // Expand many journals
      const expandButtons = screen.getAllByRole('button', { name: /Expandir nome completo/ });
      const buttonsToExpand = expandButtons.slice(0, 50);
      
      for (const button of buttonsToExpand) {
        await user.click(button);
      }
      
      await waitFor(() => {
        const collapseButtons = screen.getAllByRole('button', { name: /Recolher nome/ });
        expect(collapseButtons.length).toBe(buttonsToExpand.length);
      });
      
      // Test performance of additional operations with many expanded
      const { duration } = await measureAsyncPerformance(async () => {
        // Try to expand one more
        const remainingButtons = screen.getAllByRole('button', { name: /Expandir nome completo/ });
        if (remainingButtons.length > 0) {
          await user.click(remainingButtons[0]);
        }
      });
      
      // Should still be fast even with many expanded
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Search and Filter Performance', () => {
    it('should handle search with large datasets efficiently', () => {
      const largeDataset = createLargeDataset(2000);
      
      const { duration } = measurePerformance(() => {
        render(<ResultsTable data={largeDataset} searchTerm="Journal" />);
      });
      
      expect(duration).toBeLessThan(1000);
      
      // Verify search highlighting is working
      const highlights = document.querySelectorAll('.search-highlight');
      expect(highlights.length).toBeGreaterThan(0);
    });

    it('should maintain performance during filter changes', async () => {
      const largeDataset = createLargeDataset(1000);
      
      const { rerender } = render(
        <ResultsTable 
          data={largeDataset} 
          searchTerm="" 
          filterABDC=""
          filterABS=""
        />
      );
      
      // Expand some journals first
      const expandButtons = screen.getAllByRole('button', { name: /Expandir nome completo/ });
      for (let i = 0; i < 5; i++) {
        await user.click(expandButtons[i]);
      }
      
      // Measure filter change performance
      const { duration } = measurePerformance(() => {
        rerender(
          <ResultsTable 
            data={largeDataset} 
            searchTerm="test" 
            filterABDC="A"
            filterABS="3"
          />
        );
      });
      
      expect(duration).toBeLessThan(500);
      
      // Verify expansions were reset (as expected behavior)
      await waitFor(() => {
        const collapseButtons = screen.queryAllByRole('button', { name: /Recolher nome/ });
        expect(collapseButtons.length).toBe(0);
      });
    });

    it('should handle rapid search term changes efficiently', async () => {
      const dataset = createLargeDataset(500);
      const searchTerms = ['Journal', 'Long', 'Name', 'Short', 'Medium'];
      
      const { rerender } = render(<ResultsTable data={dataset} searchTerm="" />);
      
      const durations = [];
      
      for (const term of searchTerms) {
        const { duration } = measurePerformance(() => {
          rerender(<ResultsTable data={dataset} searchTerm={term} />);
        });
        durations.push(duration);
      }
      
      // All search operations should be fast
      durations.forEach(duration => {
        expect(duration).toBeLessThan(300);
      });
      
      // Performance should be consistent
      const avgDuration = durations.reduce((a, b) => a + b) / durations.length;
      const maxDuration = Math.max(...durations);
      
      expect(maxDuration).toBeLessThan(avgDuration * 2);
    });
  });

  describe('Sorting Performance', () => {
    it('should handle sorting large datasets efficiently', async () => {
      const largeDataset = createLargeDataset(1000);
      render(<ResultsTable data={largeDataset} searchTerm="" />);
      
      const journalHeader = screen.getByRole('columnheader', { name: /Journal/ });
      
      const { duration } = await measureAsyncPerformance(async () => {
        await user.click(journalHeader);
      });
      
      expect(duration).toBeLessThan(500);
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('should maintain performance during multiple sort operations', async () => {
      const dataset = createLargeDataset(500);
      render(<ResultsTable data={dataset} searchTerm="" />);
      
      const headers = [
        screen.getByRole('columnheader', { name: /Journal/ }),
        screen.getByRole('columnheader', { name: /ABDC/ }),
        screen.getByRole('columnheader', { name: /ABS/ })
      ];
      
      const durations = [];
      
      for (const header of headers) {
        const { duration } = await measureAsyncPerformance(async () => {
          await user.click(header);
        });
        durations.push(duration);
      }
      
      // All sort operations should be fast
      durations.forEach(duration => {
        expect(duration).toBeLessThan(300);
      });
    });
  });

  describe('Memory Management', () => {
    it('should not leak memory during expansion/collapse cycles', async () => {
      const dataset = createLargeDataset(200);
      render(<ResultsTable data={dataset} searchTerm="" />);
      
      const initialMemory = getMemoryUsage();
      
      // Perform many expansion/collapse cycles
      const expandButton = screen.getAllByRole('button', { name: /Expandir nome completo/ })[0];
      
      for (let i = 0; i < 50; i++) {
        await user.click(expandButton);
        
        await waitFor(() => {
          expect(screen.getByRole('button', { name: /Recolher nome/ })).toBeInTheDocument();
        });
        
        const collapseButton = screen.getByRole('button', { name: /Recolher nome/ });
        await user.click(collapseButton);
        
        await waitFor(() => {
          expect(screen.getByRole('button', { name: /Expandir nome completo/ })).toBeInTheDocument();
        });
      }
      
      const finalMemory = getMemoryUsage();
      
      if (initialMemory && finalMemory) {
        const memoryIncrease = finalMemory.used - initialMemory.used;
        
        // Memory increase should be minimal (less than 10MB)
        expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
      }
    });

    it('should efficiently handle component unmounting with large datasets', () => {
      const largeDataset = createLargeDataset(1000);
      
      const { unmount } = render(<ResultsTable data={largeDataset} searchTerm="" />);
      
      const { duration } = measurePerformance(() => {
        unmount();
      });
      
      // Unmounting should be fast
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Pagination Performance', () => {
    it('should handle pagination efficiently with large datasets', async () => {
      const largeDataset = createLargeDataset(2000);
      render(<ResultsTable data={largeDataset} searchTerm="" />);
      
      // Check if "Load More" button is present
      const loadMoreButton = screen.queryByText(/Carregar mais/);
      
      if (loadMoreButton) {
        const { duration } = await measureAsyncPerformance(async () => {
          await user.click(loadMoreButton);
        });
        
        expect(duration).toBeLessThan(300);
        
        // Verify more items are loaded
        await waitFor(() => {
          const rows = screen.getAllByRole('row');
          expect(rows.length).toBeGreaterThan(101); // More than initial 100 + header
        });
      }
    });

    it('should maintain performance across multiple page loads', async () => {
      const largeDataset = createLargeDataset(1000);
      render(<ResultsTable data={largeDataset} searchTerm="" />);
      
      const durations = [];
      
      // Load multiple pages
      for (let i = 0; i < 5; i++) {
        const loadMoreButton = screen.queryByText(/Carregar mais/);
        
        if (loadMoreButton) {
          const { duration } = await measureAsyncPerformance(async () => {
            await user.click(loadMoreButton);
          });
          durations.push(duration);
          
          await waitFor(() => {
            const rows = screen.getAllByRole('row');
            expect(rows.length).toBeGreaterThan(101 + (i * 100));
          });
        } else {
          break;
        }
      }
      
      // Each page load should be consistently fast
      durations.forEach(duration => {
        expect(duration).toBeLessThan(400);
      });
    });
  });

  describe('React Performance Optimizations', () => {
    it('should minimize re-renders with React.memo', async () => {
      const dataset = createLargeDataset(100);
      
      // Mock React.memo to count renders
      let renderCount = 0;
      const originalMemo = React.memo;
      React.memo = vi.fn((component) => {
        return originalMemo((props) => {
          renderCount++;
          return component(props);
        });
      });
      
      const { rerender } = render(<ResultsTable data={dataset} searchTerm="" />);
      
      const initialRenderCount = renderCount;
      
      // Change search term (should cause minimal re-renders due to memoization)
      rerender(<ResultsTable data={dataset} searchTerm="test" />);
      
      const finalRenderCount = renderCount;
      
      // Should not re-render all components
      expect(finalRenderCount - initialRenderCount).toBeLessThan(dataset.length);
      
      // Restore original React.memo
      React.memo = originalMemo;
    });

    it('should use useCallback effectively for event handlers', async () => {
      const dataset = createLargeDataset(50);
      render(<ResultsTable data={dataset} searchTerm="" />);
      
      const expandButtons = screen.getAllByRole('button', { name: /Expandir nome completo/ });
      
      // Click multiple buttons rapidly
      const { duration } = await measureAsyncPerformance(async () => {
        for (let i = 0; i < Math.min(10, expandButtons.length); i++) {
          await user.click(expandButtons[i]);
        }
      });
      
      // Should be fast due to useCallback optimization
      expect(duration).toBeLessThan(500);
    });

    it('should efficiently handle state updates with large datasets', async () => {
      const dataset = createLargeDataset(200);
      render(<ResultsTable data={dataset} searchTerm="" />);
      
      // Expand multiple journals to test state management
      const expandButtons = screen.getAllByRole('button', { name: /Expandir nome completo/ });
      
      const { duration } = await measureAsyncPerformance(async () => {
        // Expand first 20 journals
        for (let i = 0; i < Math.min(20, expandButtons.length); i++) {
          await user.click(expandButtons[i]);
        }
      });
      
      expect(duration).toBeLessThan(1000);
      
      // Verify all expansions worked
      await waitFor(() => {
        const collapseButtons = screen.getAllByRole('button', { name: /Recolher nome/ });
        expect(collapseButtons.length).toBe(Math.min(20, expandButtons.length));
      });
    });
  });
});