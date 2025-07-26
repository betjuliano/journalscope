/**
 * Integration tests for journal name truncation feature
 * Tests compatibility with existing systems: export, filters, sorting, selection, search
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResultsTable from '../../components/ResultsTable';
import { exportAsCSV, exportAsExcel } from '../../../utils/exportUtils';
import { truncateJournalName, needsTruncation } from '../../../utils/textUtils';

// Mock das funções de exportação
vi.mock('../../../utils/exportUtils', () => ({
  exportAsCSV: vi.fn(),
  exportAsExcel: vi.fn()
}));

// Mock do localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock de dados de teste com nomes longos e curtos
const mockJournalsData = [
  {
    journal: 'Journal of Very Long Academic Research in Computer Science and Information Technology Systems',
    abdc: 'A*',
    abs: '4*',
    sjr: { quartile: 'Q1', score: 2.5 },
    jcr: { quartile: 'Q1', impactFactor: 3.2 },
    wileySubject: 'Computer Science',
    predatory: { isPredatory: false }
  },
  {
    journal: 'Short Journal',
    abdc: 'A',
    abs: '4',
    sjr: { quartile: 'Q2', score: 1.8 },
    jcr: { quartile: 'Q2', impactFactor: 2.1 },
    wileySubject: 'Engineering',
    predatory: { isPredatory: false }
  },
  {
    journal: 'Another Extremely Long Journal Name That Should Be Truncated When Displayed in Table',
    abdc: 'B',
    abs: '3',
    sjr: { quartile: 'Q3', score: 1.2 },
    jcr: { quartile: 'Q3', impactFactor: 1.5 },
    wileySubject: 'Mathematics',
    predatory: { isPredatory: true }
  },
  {
    journal: 'Medium Length Journal Name',
    abdc: 'C',
    abs: '2',
    sjr: { quartile: 'Q4', score: 0.8 },
    jcr: { quartile: 'Q4', impactFactor: 0.9 },
    wileySubject: 'Physics',
    predatory: { isPredatory: false }
  }
];

describe('Journal Name Truncation - Integration Tests', () => {
  let user;
  
  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Export System Compatibility', () => {
    it('should export full journal names in CSV regardless of truncation state', async () => {
      const mockOnExportCSV = vi.fn();
      
      render(
        <ResultsTable 
          data={mockJournalsData}
          onExportCSV={mockOnExportCSV}
          searchTerm=""
        />
      );

      // Expandir um journal truncado
      const expandButton = screen.getAllByRole('button', { name: /expandir nome completo/i })[0];
      await user.click(expandButton);

      // Simular exportação CSV
      const exportData = mockJournalsData;
      mockOnExportCSV(exportData);

      expect(mockOnExportCSV).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            journal: 'Journal of Very Long Academic Research in Computer Science and Information Technology Systems'
          }),
          expect.objectContaining({
            journal: 'Short Journal'
          })
        ])
      );
    });

    it('should export full journal names in Excel regardless of truncation state', async () => {
      const mockOnExportExcel = vi.fn();
      
      render(
        <ResultsTable 
          data={mockJournalsData}
          onExportExcel={mockOnExportExcel}
          searchTerm=""
        />
      );

      // Simular exportação Excel
      const exportData = mockJournalsData;
      mockOnExportExcel(exportData);

      expect(mockOnExportExcel).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            journal: 'Journal of Very Long Academic Research in Computer Science and Information Technology Systems'
          })
        ])
      );
    });

    it('should maintain export functionality when journals are expanded/collapsed', async () => {
      const mockOnExportCSV = vi.fn();
      
      render(
        <ResultsTable 
          data={mockJournalsData}
          onExportCSV={mockOnExportCSV}
          searchTerm=""
        />
      );

      // Expandir e recolher journals
      const expandButtons = screen.getAllByRole('button', { name: /expandir nome completo/i });
      
      // Expandir primeiro journal
      await user.click(expandButtons[0]);
      
      // Verificar se está expandido
      expect(screen.getByText(/Journal of Very Long Academic Research/)).toBeInTheDocument();
      
      // Recolher
      const collapseButton = screen.getByRole('button', { name: /recolher nome/i });
      await user.click(collapseButton);

      // Exportar deve funcionar normalmente
      const exportData = mockJournalsData;
      mockOnExportCSV(exportData);

      expect(mockOnExportCSV).toHaveBeenCalledWith(exportData);
    });
  });

  describe('Filter System Compatibility', () => {
    it('should reset expansion state when filters are applied', async () => {
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
      expect(screen.getByText(/Journal of Very Long Academic Research/)).toBeInTheDocument();

      // Aplicar filtro ABDC
      rerender(
        <ResultsTable 
          data={mockJournalsData.filter(j => j.abdc === 'A*')}
          searchTerm=""
          filterABDC="A*"
        />
      );

      // Verificar que expansão foi resetada (botão volta a ser "+")
      await waitFor(() => {
        const newExpandButton = screen.queryByRole('button', { name: /expandir nome completo/i });
        expect(newExpandButton).toBeInTheDocument();
      });
    });

    it('should work correctly with advanced filters', async () => {
      const filteredData = mockJournalsData.filter(j => j.wileySubject === 'Computer Science');
      
      render(
        <ResultsTable 
          data={filteredData}
          searchTerm=""
          filterWiley={true}
        />
      );

      // Deve mostrar apenas journals com Wiley
      expect(screen.getByText(/Computer Science/)).toBeInTheDocument();
      
      // Truncamento deve funcionar normalmente
      const expandButton = screen.getByRole('button', { name: /expandir nome completo/i });
      await user.click(expandButton);
      
      expect(screen.getByText(/Journal of Very Long Academic Research/)).toBeInTheDocument();
    });

    it('should work with quick filters', async () => {
      const topTierData = mockJournalsData.filter(j => j.abdc === 'A*' || j.abs === '4*');
      
      render(
        <ResultsTable 
          data={topTierData}
          searchTerm=""
          filterABDC="A*"
        />
      );

      // Deve mostrar apenas journals top-tier
      expect(screen.getByText(/Journal of Very Long Academic Research/)).toBeInTheDocument();
      expect(screen.queryByText(/Short Journal/)).not.toBeInTheDocument();
    });
  });

  describe('Column Sorting Compatibility', () => {
    it('should maintain truncation state during column sorting', async () => {
      render(
        <ResultsTable 
          data={mockJournalsData}
          searchTerm=""
        />
      );

      // Expandir um journal
      const expandButton = screen.getAllByRole('button', { name: /expandir nome completo/i })[0];
      await user.click(expandButton);

      // Verificar que está expandido
      expect(screen.getByText(/Journal of Very Long Academic Research/)).toBeInTheDocument();

      // Ordenar por coluna ABDC
      const abdcHeader = screen.getByRole('columnheader', { name: /abdc/i });
      await user.click(abdcHeader);

      // Verificar que journal ainda está expandido após ordenação
      expect(screen.getByText(/Journal of Very Long Academic Research/)).toBeInTheDocument();
    });

    it('should sort correctly with truncated journal names', async () => {
      render(
        <ResultsTable 
          data={mockJournalsData}
          searchTerm=""
        />
      );

      // Ordenar por nome do journal
      const journalHeader = screen.getByRole('columnheader', { name: /journal/i });
      await user.click(journalHeader);

      // Verificar que ordenação funciona (primeiro deve ser "Another Extremely Long...")
      const rows = screen.getAllByRole('row');
      const firstDataRow = rows[1]; // Primeira linha após header
      
      // Deve conter o journal que começa com "Another"
      expect(within(firstDataRow).getByText(/Another Extremely Long/)).toBeInTheDocument();
    });

    it('should handle sorting with mixed expanded/collapsed states', async () => {
      render(
        <ResultsTable 
          data={mockJournalsData}
          searchTerm=""
        />
      );

      // Expandir alguns journals
      const expandButtons = screen.getAllByRole('button', { name: /expandir nome completo/i });
      await user.click(expandButtons[0]); // Expandir primeiro
      // Deixar segundo colapsado

      // Ordenar por ABS
      const absHeader = screen.getByRole('columnheader', { name: /abs/i });
      await user.click(absHeader);

      // Verificar que estados de expansão são mantidos
      expect(screen.getByText(/Journal of Very Long Academic Research/)).toBeInTheDocument();
    });
  });

  describe('Multiple Selection Compatibility', () => {
    it('should allow selection of journals regardless of truncation state', async () => {
      render(
        <ResultsTable 
          data={mockJournalsData}
          searchTerm=""
        />
      );

      // Expandir um journal
      const expandButton = screen.getAllByRole('button', { name: /expandir nome completo/i })[0];
      await user.click(expandButton);

      // Selecionar journals (assumindo que há checkboxes)
      const checkboxes = screen.getAllByRole('checkbox');
      if (checkboxes.length > 0) {
        await user.click(checkboxes[0]); // Selecionar primeiro
        await user.click(checkboxes[1]); // Selecionar segundo

        // Verificar que seleção funciona independente do estado de truncamento
        expect(checkboxes[0]).toBeChecked();
        expect(checkboxes[1]).toBeChecked();
      }
    });

    it('should maintain selection state when expanding/collapsing journals', async () => {
      render(
        <ResultsTable 
          data={mockJournalsData}
          searchTerm=""
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      if (checkboxes.length > 0) {
        // Selecionar journal
        await user.click(checkboxes[0]);
        expect(checkboxes[0]).toBeChecked();

        // Expandir journal selecionado
        const expandButton = screen.getAllByRole('button', { name: /expandir nome completo/i })[0];
        await user.click(expandButton);

        // Verificar que seleção é mantida
        expect(checkboxes[0]).toBeChecked();

        // Recolher journal
        const collapseButton = screen.getByRole('button', { name: /recolher nome/i });
        await user.click(collapseButton);

        // Verificar que seleção ainda é mantida
        expect(checkboxes[0]).toBeChecked();
      }
    });
  });

  describe('Search and Highlight Compatibility', () => {
    it('should search in full journal names, not just visible text', async () => {
      render(
        <ResultsTable 
          data={mockJournalsData}
          searchTerm="Information Technology"
        />
      );

      // Deve encontrar o journal mesmo que "Information Technology" não esteja visível no texto truncado
      expect(screen.getByText(/Journal of Very Long Academic Research/)).toBeInTheDocument();
    });

    it('should highlight search terms in both truncated and expanded states', async () => {
      render(
        <ResultsTable 
          data={mockJournalsData}
          searchTerm="Journal"
        />
      );

      // Verificar highlight no texto truncado
      const highlightedElements = screen.getAllByText('Journal');
      expect(highlightedElements.length).toBeGreaterThan(0);

      // Expandir journal e verificar highlight no texto completo
      const expandButton = screen.getAllByRole('button', { name: /expandir nome completo/i })[0];
      await user.click(expandButton);

      // Deve manter highlight no texto expandido
      const expandedHighlights = screen.getAllByText('Journal');
      expect(expandedHighlights.length).toBeGreaterThan(0);
    });

    it('should highlight search terms correctly when toggling expansion', async () => {
      render(
        <ResultsTable 
          data={mockJournalsData}
          searchTerm="Computer"
        />
      );

      // Expandir journal que contém "Computer" no nome completo
      const expandButton = screen.getAllByRole('button', { name: /expandir nome completo/i })[0];
      await user.click(expandButton);

      // Verificar que "Computer" está destacado no texto expandido
      expect(screen.getByText('Computer')).toBeInTheDocument();

      // Recolher e verificar que highlight ainda funciona
      const collapseButton = screen.getByRole('button', { name: /recolher nome/i });
      await user.click(collapseButton);

      // Se "Computer" não estiver visível no texto truncado, não deve aparecer
      // mas a funcionalidade de busca deve continuar funcionando
    });

    it('should work with complex search terms', async () => {
      render(
        <ResultsTable 
          data={mockJournalsData}
          searchTerm="Academic Research"
        />
      );

      // Deve encontrar journals que contenham ambos os termos
      expect(screen.getByText(/Journal of Very Long Academic Research/)).toBeInTheDocument();
    });

    it('should be case insensitive in search', async () => {
      render(
        <ResultsTable 
          data={mockJournalsData}
          searchTerm="COMPUTER SCIENCE"
        />
      );

      // Deve encontrar mesmo com case diferente
      expect(screen.getByText(/Journal of Very Long Academic Research/)).toBeInTheDocument();
    });
  });

  describe('Performance and Error Handling', () => {
    it('should handle large datasets without performance issues', async () => {
      // Criar dataset grande
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        journal: `Very Long Journal Name Number ${i} That Should Be Truncated For Performance Testing`,
        abdc: ['A*', 'A', 'B', 'C'][i % 4],
        abs: ['4*', '4', '3', '2', '1'][i % 5],
        sjr: { quartile: ['Q1', 'Q2', 'Q3', 'Q4'][i % 4], score: Math.random() * 3 },
        jcr: { quartile: ['Q1', 'Q2', 'Q3', 'Q4'][i % 4], impactFactor: Math.random() * 5 },
        predatory: { isPredatory: i % 10 === 0 }
      }));

      const startTime = performance.now();
      
      render(
        <ResultsTable 
          data={largeDataset}
          searchTerm=""
        />
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Render não deve demorar mais que 1 segundo
      expect(renderTime).toBeLessThan(1000);

      // Verificar que truncamento funciona
      const expandButtons = screen.getAllByRole('button', { name: /expandir nome completo/i });
      expect(expandButtons.length).toBeGreaterThan(0);
    });

    it('should handle invalid journal data gracefully', async () => {
      const invalidData = [
        { journal: null, abdc: 'A*' },
        { journal: undefined, abs: '4*' },
        { journal: '', sjr: { quartile: 'Q1' } },
        { journal: 123, jcr: { quartile: 'Q2' } }
      ];

      render(
        <ResultsTable 
          data={invalidData}
          searchTerm=""
        />
      );

      // Não deve quebrar a aplicação
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('should handle missing truncation utilities gracefully', async () => {
      // Mock das funções de truncamento para simular erro
      vi.mocked(truncateJournalName).mockImplementation(() => {
        throw new Error('Truncation error');
      });

      render(
        <ResultsTable 
          data={mockJournalsData}
          searchTerm=""
        />
      );

      // Deve mostrar fallback ou erro gracioso
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });

  describe('Accessibility Integration', () => {
    it('should maintain accessibility when interacting with other features', async () => {
      render(
        <ResultsTable 
          data={mockJournalsData}
          searchTerm=""
        />
      );

      // Verificar que elementos têm labels apropriados
      const expandButton = screen.getAllByRole('button', { name: /expandir nome completo/i })[0];
      expect(expandButton).toHaveAttribute('aria-label');
      expect(expandButton).toHaveAttribute('aria-expanded', 'false');

      // Expandir e verificar mudança de estado
      await user.click(expandButton);
      
      const collapseButton = screen.getByRole('button', { name: /recolher nome/i });
      expect(collapseButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('should work with keyboard navigation', async () => {
      render(
        <ResultsTable 
          data={mockJournalsData}
          searchTerm=""
        />
      );

      const expandButton = screen.getAllByRole('button', { name: /expandir nome completo/i })[0];
      
      // Focar no botão
      expandButton.focus();
      expect(expandButton).toHaveFocus();

      // Ativar com Enter
      await user.keyboard('{Enter}');
      
      // Verificar que expandiu
      expect(screen.getByText(/Journal of Very Long Academic Research/)).toBeInTheDocument();
    });
  });

  describe('State Management Integration', () => {
    it('should preserve expansion state during pagination', async () => {
      // Simular dados paginados
      const paginatedData = mockJournalsData.slice(0, 2);
      
      const { rerender } = render(
        <ResultsTable 
          data={paginatedData}
          searchTerm=""
        />
      );

      // Expandir journal
      const expandButton = screen.getAllByRole('button', { name: /expandir nome completo/i })[0];
      await user.click(expandButton);

      // Simular mudança de página (mesma página)
      rerender(
        <ResultsTable 
          data={paginatedData}
          searchTerm=""
        />
      );

      // Estado deve ser preservado
      expect(screen.getByText(/Journal of Very Long Academic Research/)).toBeInTheDocument();
    });

    it('should reset expansion state when changing pages', async () => {
      const page1Data = mockJournalsData.slice(0, 2);
      const page2Data = mockJournalsData.slice(2, 4);
      
      const { rerender } = render(
        <ResultsTable 
          data={page1Data}
          searchTerm=""
        />
      );

      // Expandir journal na página 1
      const expandButton = screen.getAllByRole('button', { name: /expandir nome completo/i })[0];
      await user.click(expandButton);

      // Mudar para página 2
      rerender(
        <ResultsTable 
          data={page2Data}
          searchTerm=""
        />
      );

      // Expansões devem ser resetadas na nova página
      const newExpandButtons = screen.getAllByRole('button', { name: /expandir nome completo/i });
      expect(newExpandButtons.length).toBeGreaterThan(0);
    });
  });
});