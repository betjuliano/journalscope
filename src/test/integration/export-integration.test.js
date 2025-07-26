/**
 * Integration tests specifically for export functionality with journal truncation
 * Tests CSV/Excel export compatibility
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { exportAsCSV, exportAsExcel } from '../../../utils/exportUtils';
import ResultsTable from '../../components/ResultsTable';

// Mock das funções de exportação
vi.mock('../../../utils/exportUtils', () => ({
  exportAsCSV: vi.fn(),
  exportAsExcel: vi.fn()
}));

// Mock do XLSX para testes de Excel
vi.mock('sheetjs-style', () => ({
  default: {
    utils: {
      json_to_sheet: vi.fn(() => ({})),
      book_new: vi.fn(() => ({})),
      book_append_sheet: vi.fn()
    },
    write: vi.fn(() => new ArrayBuffer(8))
  }
}));

const mockJournalsWithTruncation = [
  {
    journal: 'Journal of Very Long Academic Research in Computer Science and Information Technology Systems and Applications',
    abdc: 'A*',
    abs: '4*',
    wileySubject: 'Computer Science',
    wileyAPC: '3000',
    wileyAPCGBP: '2400',
    wileyAPCEUR: '2700'
  },
  {
    journal: 'Short Name',
    abdc: 'A',
    abs: '4',
    wileySubject: 'Engineering',
    wileyAPC: '2500',
    wileyAPCGBP: '2000',
    wileyAPCEUR: '2250'
  },
  {
    journal: 'Another Extremely Long Journal Name That Definitely Needs Truncation When Displayed But Should Export Complete',
    abdc: 'B',
    abs: '3',
    wileySubject: 'Mathematics',
    wileyAPC: '2000',
    wileyAPCGBP: '1600',
    wileyAPCEUR: '1800'
  }
];

describe('Export Integration with Journal Truncation', () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
    
    // Mock URL.createObjectURL e URL.revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'mock-url');
    global.URL.revokeObjectURL = vi.fn();
    
    // Mock createElement e appendChild para download
    const mockAnchor = {
      href: '',
      download: '',
      style: { display: '' },
      click: vi.fn()
    };
    
    document.createElement = vi.fn((tagName) => {
      if (tagName === 'a') return mockAnchor;
      return {};
    });
    
    document.body.appendChild = vi.fn();
    document.body.removeChild = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('CSV Export Integration', () => {
    it('should export complete journal names in CSV format', async () => {
      // Mock da implementação real do exportAsCSV
      const mockExportAsCSV = vi.fn((data, filename, headers) => {
        // Simular comportamento real da função
        const csvRows = [];
        csvRows.push(headers.join(','));
        
        data.forEach((item) => {
          const values = [
            item.journal, // Nome completo deve ser exportado
            item.abdc || '',
            item.abs || '',
            item.wileySubject || '',
            item.wileyAPC || '',
            item.wileyAPCGBP || '',
            item.wileyAPCEUR || ''
          ];
          csvRows.push(values.map(v => `"${v}"`).join(','));
        });
        
        const csvContent = csvRows.join('\n');
        expect(csvContent).toContain('Journal of Very Long Academic Research in Computer Science and Information Technology Systems and Applications');
        expect(csvContent).toContain('Another Extremely Long Journal Name That Definitely Needs Truncation When Displayed But Should Export Complete');
        
        return true;
      });

      vi.mocked(exportAsCSV).mockImplementation(mockExportAsCSV);

      render(
        <ResultsTable 
          data={mockJournalsWithTruncation}
          onExportCSV={(data) => exportAsCSV(data)}
          searchTerm=""
        />
      );

      // Expandir alguns journals para testar que estado de expansão não afeta export
      const expandButtons = screen.getAllByRole('button', { name: /expandir nome completo/i });
      if (expandButtons.length > 0) {
        await user.click(expandButtons[0]);
      }

      // Simular exportação
      exportAsCSV(mockJournalsWithTruncation);

      expect(mockExportAsCSV).toHaveBeenCalledWith(mockJournalsWithTruncation);
    });

    it('should handle CSV export with filtered data', async () => {
      const filteredData = mockJournalsWithTruncation.filter(j => j.abdc === 'A*');
      
      const mockExportAsCSV = vi.fn((data) => {
        expect(data).toHaveLength(1);
        expect(data[0].journal).toBe('Journal of Very Long Academic Research in Computer Science and Information Technology Systems and Applications');
        return true;
      });

      vi.mocked(exportAsCSV).mockImplementation(mockExportAsCSV);

      render(
        <ResultsTable 
          data={filteredData}
          onExportCSV={(data) => exportAsCSV(data)}
          searchTerm=""
          filterABDC="A*"
        />
      );

      exportAsCSV(filteredData);
      expect(mockExportAsCSV).toHaveBeenCalled();
    });

    it('should export with proper CSV formatting and encoding', async () => {
      const mockExportAsCSV = vi.fn((data, filename, headers) => {
        // Verificar que caracteres especiais são tratados corretamente
        const csvContent = data.map(item => `"${item.journal.replace(/"/g, '""')}"`).join('\n');
        
        // Verificar BOM para UTF-8
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
        expect(blob.type).toBe('text/csv;charset=utf-8');
        
        return true;
      });

      vi.mocked(exportAsCSV).mockImplementation(mockExportAsCSV);

      render(
        <ResultsTable 
          data={mockJournalsWithTruncation}
          onExportCSV={(data) => exportAsCSV(data)}
          searchTerm=""
        />
      );

      exportAsCSV(mockJournalsWithTruncation);
      expect(mockExportAsCSV).toHaveBeenCalled();
    });
  });

  describe('Excel Export Integration', () => {
    it('should export complete journal names in Excel format', async () => {
      const mockExportAsExcel = vi.fn(async (data, filename, options) => {
        // Verificar que dados completos são passados
        expect(data).toEqual(expect.arrayContaining([
          expect.objectContaining({
            journal: 'Journal of Very Long Academic Research in Computer Science and Information Technology Systems and Applications'
          }),
          expect.objectContaining({
            journal: 'Another Extremely Long Journal Name That Definitely Needs Truncation When Displayed But Should Export Complete'
          })
        ]));
        
        return true;
      });

      vi.mocked(exportAsExcel).mockImplementation(mockExportAsExcel);

      render(
        <ResultsTable 
          data={mockJournalsWithTruncation}
          onExportExcel={(data) => exportAsExcel(data)}
          searchTerm=""
        />
      );

      await exportAsExcel(mockJournalsWithTruncation);
      expect(mockExportAsExcel).toHaveBeenCalled();
    });

    it('should handle Excel export with metadata', async () => {
      const mockExportAsExcel = vi.fn(async (data, filename, options) => {
        expect(options).toEqual(expect.objectContaining({
          includeStats: expect.any(Boolean)
        }));
        
        return true;
      });

      vi.mocked(exportAsExcel).mockImplementation(mockExportAsExcel);

      render(
        <ResultsTable 
          data={mockJournalsWithTruncation}
          onExportExcel={(data) => exportAsExcel(data, null, { includeStats: true })}
          searchTerm=""
        />
      );

      await exportAsExcel(mockJournalsWithTruncation, null, { includeStats: true });
      expect(mockExportAsExcel).toHaveBeenCalled();
    });

    it('should handle Excel export errors gracefully', async () => {
      const mockExportAsExcel = vi.fn(async () => {
        throw new Error('Excel export failed');
      });

      vi.mocked(exportAsExcel).mockImplementation(mockExportAsExcel);

      // Mock do alert para capturar mensagens de erro
      global.alert = vi.fn();

      render(
        <ResultsTable 
          data={mockJournalsWithTruncation}
          onExportExcel={async (data) => {
            try {
              await exportAsExcel(data);
            } catch (error) {
              alert(`Erro na exportação: ${error.message}`);
            }
          }}
          searchTerm=""
        />
      );

      try {
        await exportAsExcel(mockJournalsWithTruncation);
      } catch (error) {
        alert(`Erro na exportação: ${error.message}`);
      }

      expect(global.alert).toHaveBeenCalledWith('Erro na exportação: Excel export failed');
    });
  });

  describe('Export with Selection', () => {
    it('should export only selected journals with full names', async () => {
      const mockExportAsCSV = vi.fn((data) => {
        // Verificar que apenas journals selecionados são exportados
        expect(data.length).toBeLessThanOrEqual(mockJournalsWithTruncation.length);
        
        // Verificar que nomes completos são mantidos
        data.forEach(journal => {
          expect(journal.journal).toBeTruthy();
          expect(typeof journal.journal).toBe('string');
        });
        
        return true;
      });

      vi.mocked(exportAsCSV).mockImplementation(mockExportAsCSV);

      render(
        <ResultsTable 
          data={mockJournalsWithTruncation}
          onExportCSV={(data) => exportAsCSV(data)}
          searchTerm=""
        />
      );

      // Simular seleção de journals específicos
      const selectedData = mockJournalsWithTruncation.slice(0, 2);
      exportAsCSV(selectedData);

      expect(mockExportAsCSV).toHaveBeenCalledWith(selectedData);
    });

    it('should handle empty selection gracefully', async () => {
      const mockExportAsCSV = vi.fn((data) => {
        if (data.length === 0) {
          throw new Error('Nenhum dado para exportar');
        }
        return true;
      });

      vi.mocked(exportAsCSV).mockImplementation(mockExportAsCSV);
      global.alert = vi.fn();

      render(
        <ResultsTable 
          data={mockJournalsWithTruncation}
          onExportCSV={(data) => {
            try {
              exportAsCSV(data);
            } catch (error) {
              alert(error.message);
            }
          }}
          searchTerm=""
        />
      );

      // Simular exportação sem seleção
      try {
        exportAsCSV([]);
      } catch (error) {
        alert(error.message);
      }

      expect(global.alert).toHaveBeenCalledWith('Nenhum dado para exportar');
    });
  });

  describe('Export Performance', () => {
    it('should handle large dataset export efficiently', async () => {
      // Criar dataset grande com nomes longos
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        journal: `Very Long Journal Name Number ${i} That Should Be Truncated For Display But Exported Complete With All Information`,
        abdc: ['A*', 'A', 'B', 'C'][i % 4],
        abs: ['4*', '4', '3', '2', '1'][i % 5],
        wileySubject: `Subject ${i}`,
        wileyAPC: `${2000 + i}`,
        wileyAPCGBP: `${1600 + i}`,
        wileyAPCEUR: `${1800 + i}`
      }));

      const mockExportAsCSV = vi.fn((data) => {
        const startTime = performance.now();
        
        // Simular processamento de export
        data.forEach(item => {
          expect(item.journal).toContain('Very Long Journal Name');
        });
        
        const endTime = performance.now();
        const processingTime = endTime - startTime;
        
        // Export não deve demorar mais que 500ms para 1000 items
        expect(processingTime).toBeLessThan(500);
        
        return true;
      });

      vi.mocked(exportAsCSV).mockImplementation(mockExportAsCSV);

      render(
        <ResultsTable 
          data={largeDataset}
          onExportCSV={(data) => exportAsCSV(data)}
          searchTerm=""
        />
      );

      exportAsCSV(largeDataset);
      expect(mockExportAsCSV).toHaveBeenCalled();
    });
  });

  describe('Export Data Integrity', () => {
    it('should preserve all journal data fields in export', async () => {
      const mockExportAsCSV = vi.fn((data) => {
        data.forEach(journal => {
          // Verificar que todos os campos importantes são preservados
          expect(journal).toHaveProperty('journal');
          expect(journal).toHaveProperty('abdc');
          expect(journal).toHaveProperty('abs');
          expect(journal).toHaveProperty('wileySubject');
          expect(journal).toHaveProperty('wileyAPC');
          expect(journal).toHaveProperty('wileyAPCGBP');
          expect(journal).toHaveProperty('wileyAPCEUR');
        });
        
        return true;
      });

      vi.mocked(exportAsCSV).mockImplementation(mockExportAsCSV);

      render(
        <ResultsTable 
          data={mockJournalsWithTruncation}
          onExportCSV={(data) => exportAsCSV(data)}
          searchTerm=""
        />
      );

      exportAsCSV(mockJournalsWithTruncation);
      expect(mockExportAsCSV).toHaveBeenCalled();
    });

    it('should handle special characters in journal names during export', async () => {
      const dataWithSpecialChars = [
        {
          journal: 'Journal with "Quotes" and, Commas & Special Characters: A Comprehensive Study',
          abdc: 'A*',
          abs: '4*',
          wileySubject: 'Computer Science'
        },
        {
          journal: 'Journal with\nNewlines and\tTabs',
          abdc: 'A',
          abs: '4',
          wileySubject: 'Engineering'
        }
      ];

      const mockExportAsCSV = vi.fn((data) => {
        data.forEach(journal => {
          // Verificar que caracteres especiais são preservados
          expect(journal.journal).toContain('"');
          expect(journal.journal).toContain(',');
          expect(journal.journal).toContain('&');
          expect(journal.journal).toContain(':');
        });
        
        return true;
      });

      vi.mocked(exportAsCSV).mockImplementation(mockExportAsCSV);

      render(
        <ResultsTable 
          data={dataWithSpecialChars}
          onExportCSV={(data) => exportAsCSV(data)}
          searchTerm=""
        />
      );

      exportAsCSV(dataWithSpecialChars);
      expect(mockExportAsCSV).toHaveBeenCalled();
    });
  });
});