/**
 * Integration tests for search and filter functionality with journal truncation
 * Tests search highlighting, filter compatibility, and state management
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResultsTable from '../../components/ResultsTable';
import JournalSearchApp from '../../components/JournalSearchApp';

// Mock do hook useEmbeddedData
vi.mock('../../../hooks/useEmbeddedData', () => ({
  useEmbeddedData: () => ({
    filteredData: mockJournalsData,
    journalsData: mockJournalsData,
    isLoading: false,
    error: null,
    searchTerm: '',
    setSearchTerm: vi.fn(),
    filterABDC: '',
    setFilterABDC: vi.fn(),
    filterABS: '',
    setFilterABS: vi.fn(),
    filterWiley: false,
    setFilterWiley: vi.fn(),
    filterSJR: '',
    setFilterSJR: vi.fn(),
    stats: {
      total: 4,
      withABDC: 4,
      withABS: 4,
      withJCR: 4,
      withSJR: 4,
      withCiteScore: 4,
      withWiley: 4,
      withPredatory: 1
    },
    clearAllFilters: vi.fn(),
    applyPresetFilter: vi.fn()
  })
}));

const mockJournalsData = [
  {
    journal: 'Journal of Advanced Computer Science and Information Technology Research Systems',
    abdc: 'A*',
    abs: '4*',
    sjr: { quartile: 'Q1', score: 2.5 },
    jcr: { quartile: 'Q1', impactFactor: 3.2 },
    wileySubject: 'Computer Science',
    predatory: { isPredatory: false }
  },
  {
    journal: 'International Journal of Software Engineering and Development',
    abdc: 'A',
    abs: '4',
    sjr: { quartile: 'Q2', score: 1.8 },
    jcr: { quartile: 'Q2', impactFactor: 2.1 },
    wileySubject: 'Software Engineering',
    predatory: { isPredatory: false }
  },
  {
    journal: 'Proceedings of the International Conference on Machine Learning and Artificial Intelligence',
    abdc: 'B',
    abs: '3',
    sjr: { quartile: 'Q3', score: 1.2 },
    jcr: { quartile: 'Q3', impactFactor: 1.5 },
    wileySubject: 'Artificial Intelligence',
    predatory: { isPredatory: true }
  },
  {
    journal: 'Short Tech Journal',
    abdc: 'C',
    abs: '2',
    sjr: { quartile: 'Q4', score: 0.8 },
    jcr: { quartile: 'Q4', impactFactor: 0.9 },
    wileySubject: 'Technology',
    predatory: { isPredatory: false }
  }
];

describe('Search and Filter Integration with Journal Truncation', () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Search Functionality', () => {
    it('should search in full journal names, not just truncated text', async () => {
      render(
        <ResultsTable 
          data={mockJournalsData}
          searchTerm="Information Technology"
        />
      );

      // Deve encontrar o journal mesmo que "Information Technology" não esteja visível no texto truncado
      expect(screen.getByText(/Journal of Advanced Computer Science/)).toBeInTheDocument();
    });

    it('should highlight search terms in truncated text', async () => {
      render(
        <ResultsTable 
          data={mockJournalsData}
          searchTerm="Journal"
        />
      );

      // Verificar que termos são destacados
      const highlightedElements = screen.getAllByText('Journal');
      expect(highlightedElements.length).toBeGreaterThan(0);

      // Verificar que highlight funciona em texto truncado
      const journalCells = screen.getAllByRole('gridcell');
      const journalCell = journalCells.find(cell => 
        cell.textContent?.includes('Journal of Advanced Computer Science')
      );
      
      if (journalCell) {
        expect(within(journalCell).getByText('Journal')).toBeInTheDocument();
      }
    });

    it('should highlight search terms in expanded text', async () => {
      render(
        <ResultsTable 
          data={mockJournalsData}
          searchTerm="Computer Science"
        />
      );

      // Expandir journal que contém o termo
      const expandButton = screen.getAllByRole('button', { name: /expandir nome completo/i })[0];
      await user.click(expandButton);

      // Verificar que highlight funciona no texto expandido
      expect(screen.getByText('Computer')).toBeInTheDocument();
      expect(screen.getByText('Science')).toBeInTheDocument();
    });

    it('should maintain search highlighting when toggling expansion', async () => {
      render(
        <ResultsTable 
          data={mockJournalsData}
          searchTerm="International"
        />
      );

      // Encontrar journal com "International" no nome
      const expandButtons = screen.getAllByRole('button', { name: /expandir nome completo/i });
      
      // Expandir journal que contém "International"
      await user.click(expandButtons[1]); // Segundo journal

      // Verificar highlight no texto expandido
      expect(screen.getByText('International')).toBeInTheDocument();

      // Recolher
      const collapseButton = screen.getByRole('button', { name: /recolher nome/i });
      await user.click(collapseButton);

      // Verificar que highlight ainda funciona no texto truncado
      expect(screen.getByText('International')).toBeInTheDocument();
    });

    it('should be case insensitive', async () => {
      render(
        <ResultsTable 
          data={mockJournalsData}
          searchTerm="COMPUTER SCIENCE"
        />
      );

      // Deve encontrar mesmo com case diferente
      expect(screen.getByText(/Journal of Advanced Computer Science/)).toBeInTheDocument();
    });

    it('should handle partial word matches', async () => {
      render(
        <ResultsTable 
          data={mockJournalsData}
          searchTerm="Comput"
        />
      );

      // Deve encontrar "Computer"
      expect(screen.getByText(/Journal of Advanced Computer Science/)).toBeInTheDocument();
    });

    it('should handle multiple search terms', async () => {
      render(
        <ResultsTable 
          data={mockJournalsData}
          searchTerm="Machine Learning"
        />
      );

      // Deve encontrar journal que contém ambos os termos
      expect(screen.getByText(/Proceedings of the International Conference/)).toBeInTheDocument();
    });

    it('should handle special characters in search', async () => {
      const dataWithSpecialChars = [
        {
          journal: 'Journal of C++ Programming & Software Development',
          abdc: 'A*',
          abs: '4*',
          sjr: { quartile: 'Q1', score: 2.5 },
          predatory: { isPredatory: false }
        }
      ];

      render(
        <ResultsTable 
          data={dataWithSpecialChars}
          searchTerm="C++"
        />
      );

      expect(screen.getByText(/Journal of C\+\+ Programming/)).toBeInTheDocument();
    });
  });

  describe('Filter Integration', () => {
    it('should reset expansion state when ABDC filter is applied', async () => {
      const { rerender } = render(
        <ResultsTable 
          data={mockJournalsData}
          searchTerm=""
          filterABDC=""
        />
      );

      // Expandir um journal
      const expandButton = screen.getAllByRole('button', { name: /expandir nome completo/i })[0];
      await user.click(expandButton);

      // Verificar que está expandido
      expect(screen.getByText(/Journal of Advanced Computer Science and Information Technology Research Systems/)).toBeInTheDocument();

      // Aplicar filtro ABDC
      const filteredData = mockJournalsData.filter(j => j.abdc === 'A*');
      rerender(
        <ResultsTable 
          data={filteredData}
          searchTerm=""
          filterABDC="A*"
        />
      );

      // Verificar que expansão foi resetada
      await waitFor(() => {
        const newExpandButton = screen.queryByRole('button', { name: /expandir nome completo/i });
        expect(newExpandButton).toBeInTheDocument();
      });
    });

    it('should reset expansion state when ABS filter is applied', async () => {
      const { rerender } = render(
        <ResultsTable 
          data={mockJournalsData}
          searchTerm=""
          filterABS=""
        />
      );

      // Expandir journal
      const expandButton = screen.getAllByRole('button', { name: /expandir nome completo/i })[0];
      await user.click(expandButton);

      // Aplicar filtro ABS
      const filteredData = mockJournalsData.filter(j => j.abs === '4*');
      rerender(
        <ResultsTable 
          data={filteredData}
          searchTerm=""
          filterABS="4*"
        />
      );

      // Expansão deve ser resetada
      await waitFor(() => {
        const newExpandButton = screen.queryByRole('button', { name: /expandir nome completo/i });
        expect(newExpandButton).toBeInTheDocument();
      });
    });

    it('should reset expansion state when Wiley filter is applied', async () => {
      const { rerender } = render(
        <ResultsTable 
          data={mockJournalsData}
          searchTerm=""
          filterWiley={false}
        />
      );

      // Expandir journal
      const expandButton = screen.getAllByRole('button', { name: /expandir nome completo/i })[0];
      await user.click(expandButton);

      // Aplicar filtro Wiley
      const filteredData = mockJournalsData.filter(j => j.wileySubject);
      rerender(
        <ResultsTable 
          data={filteredData}
          searchTerm=""
          filterWiley={true}
        />
      );

      // Expansão deve ser resetada
      await waitFor(() => {
        const newExpandButton = screen.queryByRole('button', { name: /expandir nome completo/i });
        expect(newExpandButton).toBeInTheDocument();
      });
    });

    it('should reset expansion state when SJR filter is applied', async () => {
      const { rerender } = render(
        <ResultsTable 
          data={mockJournalsData}
          searchTerm=""
          filterSJR=""
        />
      );

      // Expandir journal
      const expandButton = screen.getAllByRole('button', { name: /expandir nome completo/i })[0];
      await user.click(expandButton);

      // Aplicar filtro SJR
      const filteredData = mockJournalsData.filter(j => j.sjr?.quartile === 'Q1');
      rerender(
        <ResultsTable 
          data={filteredData}
          searchTerm=""
          filterSJR="Q1"
        />
      );

      // Expansão deve ser resetada
      await waitFor(() => {
        const newExpandButton = screen.queryByRole('button', { name: /expandir nome completo/i });
        expect(newExpandButton).toBeInTheDocument();
      });
    });

    it('should work with combined filters', async () => {
      const filteredData = mockJournalsData.filter(j => 
        j.abdc === 'A*' && j.sjr?.quartile === 'Q1'
      );

      render(
        <ResultsTable 
          data={filteredData}
          searchTerm=""
          filterABDC="A*"
          filterSJR="Q1"
        />
      );

      // Deve mostrar apenas journals que atendem ambos os critérios
      expect(screen.getByText(/Journal of Advanced Computer Science/)).toBeInTheDocument();
      expect(screen.queryByText(/International Journal of Software/)).not.toBeInTheDocument();
    });

    it('should handle predatory journal filtering', async () => {
      const nonPredatoryData = mockJournalsData.filter(j => !j.predatory?.isPredatory);

      render(
        <ResultsTable 
          data={nonPredatoryData}
          searchTerm=""
        />
      );

      // Não deve mostrar journals predatórios
      expect(screen.queryByText(/Proceedings of the International Conference/)).not.toBeInTheDocument();
      expect(screen.getByText(/Journal of Advanced Computer Science/)).toBeInTheDocument();
    });
  });

  describe('Quick Filters Integration', () => {
    it('should work with top-tier filter', async () => {
      const topTierData = mockJournalsData.filter(j => 
        j.abdc === 'A*' || j.abs === '4*'
      );

      render(
        <ResultsTable 
          data={topTierData}
          searchTerm=""
        />
      );

      // Deve mostrar apenas journals top-tier
      expect(screen.getByText(/Journal of Advanced Computer Science/)).toBeInTheDocument();
      expect(screen.queryByText(/Short Tech Journal/)).not.toBeInTheDocument();
    });

    it('should work with high-quality filter', async () => {
      const highQualityData = mockJournalsData.filter(j => 
        j.abdc === 'A' || j.abs === '4'
      );

      render(
        <ResultsTable 
          data={highQualityData}
          searchTerm=""
        />
      );

      // Deve mostrar journals de alta qualidade
      expect(screen.getByText(/International Journal of Software/)).toBeInTheDocument();
    });

    it('should reset expansion when quick filters are applied', async () => {
      const { rerender } = render(
        <ResultsTable 
          data={mockJournalsData}
          searchTerm=""
        />
      );

      // Expandir journal
      const expandButton = screen.getAllByRole('button', { name: /expandir nome completo/i })[0];
      await user.click(expandButton);

      // Aplicar filtro rápido
      const topTierData = mockJournalsData.filter(j => j.abdc === 'A*');
      rerender(
        <ResultsTable 
          data={topTierData}
          searchTerm=""
        />
      );

      // Expansão deve ser resetada
      await waitFor(() => {
        const newExpandButton = screen.queryByRole('button', { name: /expandir nome completo/i });
        expect(newExpandButton).toBeInTheDocument();
      });
    });
  });

  describe('Search and Filter Combination', () => {
    it('should work with search term and filters combined', async () => {
      const filteredData = mockJournalsData.filter(j => 
        j.journal.toLowerCase().includes('computer') && j.abdc === 'A*'
      );

      render(
        <ResultsTable 
          data={filteredData}
          searchTerm="Computer"
          filterABDC="A*"
        />
      );

      // Deve mostrar apenas journals que atendem ambos os critérios
      expect(screen.getByText(/Journal of Advanced Computer Science/)).toBeInTheDocument();
      expect(screen.getByText('Computer')).toBeInTheDocument(); // Highlight
    });

    it('should maintain search highlighting with filters', async () => {
      const filteredData = mockJournalsData.filter(j => j.abdc === 'A*');

      render(
        <ResultsTable 
          data={filteredData}
          searchTerm="Advanced"
          filterABDC="A*"
        />
      );

      // Deve destacar termo de busca mesmo com filtros aplicados
      expect(screen.getByText('Advanced')).toBeInTheDocument();
    });

    it('should handle empty results with search and filters', async () => {
      render(
        <ResultsTable 
          data={[]}
          searchTerm="NonExistent"
          filterABDC="A*"
        />
      );

      // Deve mostrar mensagem de nenhum resultado
      expect(screen.getByText(/Nenhum journal encontrado/)).toBeInTheDocument();
    });
  });

  describe('State Management', () => {
    it('should preserve search highlighting during expansion toggle', async () => {
      render(
        <ResultsTable 
          data={mockJournalsData}
          searchTerm="Journal"
        />
      );

      // Verificar highlight inicial
      expect(screen.getAllByText('Journal').length).toBeGreaterThan(0);

      // Expandir journal
      const expandButton = screen.getAllByRole('button', { name: /expandir nome completo/i })[0];
      await user.click(expandButton);

      // Highlight deve ser mantido no texto expandido
      expect(screen.getAllByText('Journal').length).toBeGreaterThan(0);

      // Recolher
      const collapseButton = screen.getByRole('button', { name: /recolher nome/i });
      await user.click(collapseButton);

      // Highlight deve ser mantido no texto truncado
      expect(screen.getAllByText('Journal').length).toBeGreaterThan(0);
    });

    it('should handle rapid filter changes', async () => {
      const { rerender } = render(
        <ResultsTable 
          data={mockJournalsData}
          searchTerm=""
          filterABDC=""
        />
      );

      // Expandir journal
      const expandButton = screen.getAllByRole('button', { name: /expandir nome completo/i })[0];
      await user.click(expandButton);

      // Aplicar múltiplos filtros rapidamente
      rerender(
        <ResultsTable 
          data={mockJournalsData.filter(j => j.abdc === 'A*')}
          searchTerm=""
          filterABDC="A*"
        />
      );

      rerender(
        <ResultsTable 
          data={mockJournalsData.filter(j => j.abs === '4*')}
          searchTerm=""
          filterABS="4*"
        />
      );

      // Estado deve ser consistente
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });
    });

    it('should handle search term changes with expanded journals', async () => {
      const { rerender } = render(
        <ResultsTable 
          data={mockJournalsData}
          searchTerm=""
        />
      );

      // Expandir journal
      const expandButton = screen.getAllByRole('button', { name: /expandir nome completo/i })[0];
      await user.click(expandButton);

      // Mudar termo de busca
      rerender(
        <ResultsTable 
          data={mockJournalsData}
          searchTerm="Computer"
        />
      );

      // Expansão deve ser resetada e highlight aplicado
      await waitFor(() => {
        expect(screen.getByText('Computer')).toBeInTheDocument();
      });
    });
  });

  describe('Performance with Search and Filters', () => {
    it('should handle large datasets with search efficiently', async () => {
      // Criar dataset grande
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        journal: `Journal Number ${i} of Advanced Research in Computer Science and Technology`,
        abdc: ['A*', 'A', 'B', 'C'][i % 4],
        abs: ['4*', '4', '3', '2', '1'][i % 5],
        sjr: { quartile: ['Q1', 'Q2', 'Q3', 'Q4'][i % 4], score: Math.random() * 3 },
        predatory: { isPredatory: i % 10 === 0 }
      }));

      const startTime = performance.now();

      render(
        <ResultsTable 
          data={largeDataset}
          searchTerm="Computer Science"
        />
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Render com busca não deve demorar mais que 1 segundo
      expect(renderTime).toBeLessThan(1000);

      // Verificar que resultados são mostrados
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('should handle multiple filters efficiently', async () => {
      const largeDataset = Array.from({ length: 500 }, (_, i) => ({
        journal: `Long Journal Name ${i} That Needs Truncation`,
        abdc: ['A*', 'A', 'B', 'C'][i % 4],
        abs: ['4*', '4', '3', '2', '1'][i % 5],
        sjr: { quartile: ['Q1', 'Q2', 'Q3', 'Q4'][i % 4] },
        wileySubject: i % 2 === 0 ? 'Computer Science' : '',
        predatory: { isPredatory: i % 10 === 0 }
      }));

      const filteredData = largeDataset.filter(j => 
        j.abdc === 'A*' && j.sjr?.quartile === 'Q1' && j.wileySubject
      );

      const startTime = performance.now();

      render(
        <ResultsTable 
          data={filteredData}
          searchTerm="Journal"
          filterABDC="A*"
          filterSJR="Q1"
          filterWiley={true}
        />
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Render com múltiplos filtros não deve demorar mais que 500ms
      expect(renderTime).toBeLessThan(500);
    });
  });
});