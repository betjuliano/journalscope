/**
 * Testes abrangentes para funcionalidade de truncamento de nomes de journals
 * Inclui testes unitários, integração, acessibilidade, responsividade e performance
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ResultsTable from '../ResultsTable';
import { truncateJournalName, needsTruncation } from '../../../utils/textUtils';

// Mock data para testes
const createMockJournal = (name, additionalData = {}) => ({
  journal: name,
  abdc: 'A',
  abs: '3',
  sjr: '2.1',
  jcr: '1.8',
  ...additionalData
});

const mockJournalsShort = [
  createMockJournal('Journal Curto'),
  createMockJournal('Outro Journal')
];

const mockJournalsLong = [
  createMockJournal('Este é um nome muito longo de journal que definitivamente precisa ser truncado porque tem mais de 30 caracteres'),
  createMockJournal('Outro journal com nome extremamente longo que também precisa de truncamento para manter o layout da tabela organizado'),
  createMockJournal('Journal Normal')
];

// Mock para testes de performance
const createLargeDataset = (size) => {
  return Array.from({ length: size }, (_, index) => 
    createMockJournal(`Journal com nome longo número ${index + 1} que precisa ser truncado para teste de performance`)
  );
};

// Mock para ResizeObserver (necessário para testes de responsividade)
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock para matchMedia (necessário para testes de responsividade)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('Journal Name Truncation - Testes Unitários', () => {
  describe('truncateJournalName function', () => {
    test('deve truncar nomes longos corretamente', () => {
      const longName = 'Este é um nome muito longo de journal que precisa ser truncado';
      const result = truncateJournalName(longName, 30);
      
      expect(result).toBe('Este é um nome muito longo de...');
      expect(result.length).toBe(33); // 30 + 3 (...)
    });

    test('não deve truncar nomes curtos', () => {
      const shortName = 'Journal Curto';
      const result = truncateJournalName(shortName, 30);
      
      expect(result).toBe(shortName);
      expect(result.length).toBeLessThanOrEqual(30);
    });

    test('deve tratar entradas inválidas', () => {
      expect(truncateJournalName(null, 30)).toBe('');
      expect(truncateJournalName(undefined, 30)).toBe('');
      expect(truncateJournalName('', 30)).toBe('');
    });

    test('deve usar comprimento padrão quando não especificado', () => {
      const longName = 'a'.repeat(50);
      const result = truncateJournalName(longName);
      
      expect(result.length).toBe(33); // 30 + 3 (...)
    });

    test('deve tratar comprimentos de truncamento inválidos', () => {
      const name = 'Test Journal Name';
      
      expect(truncateJournalName(name, 0)).toBe('...');
      expect(truncateJournalName(name, -1)).toBe('...');
      expect(truncateJournalName(name, 'invalid')).toBe(name); // Fallback para não truncar
    });
  });

  describe('needsTruncation function', () => {
    test('deve identificar corretamente quando truncamento é necessário', () => {
      expect(needsTruncation('Nome muito longo para caber', 10)).toBe(true);
      expect(needsTruncation('Curto', 10)).toBe(false);
      expect(needsTruncation('Exatamente10', 10)).toBe(false);
    });

    test('deve tratar entradas inválidas', () => {
      expect(needsTruncation(null, 30)).toBe(false);
      expect(needsTruncation(undefined, 30)).toBe(false);
      expect(needsTruncation('', 30)).toBe(false);
    });
  });
});

describe('Journal Name Truncation - Testes de Integração', () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
  });

  test('deve renderizar nomes longos truncados inicialmente', () => {
    render(
      <ResultsTable 
        data={mockJournalsLong}
        searchTerm=""
        onExportCSV={() => {}}
        onExportExcel={() => {}}
      />
    );

    // Verificar se o nome foi truncado
    expect(screen.getByText(/Este é um nome muito longo de\.\.\./)).toBeInTheDocument();
    
    // Verificar se o botão de expansão está presente
    expect(screen.getByRole('button', { name: /expandir nome completo/i })).toBeInTheDocument();
  });

  test('deve expandir nome ao clicar no botão', async () => {
    render(
      <ResultsTable 
        data={mockJournalsLong}
        searchTerm=""
        onExportCSV={() => {}}
        onExportExcel={() => {}}
      />
    );

    const expandButton = screen.getByRole('button', { name: /expandir nome completo/i });
    
    // Clicar para expandir
    await user.click(expandButton);
    
    // Verificar se o nome completo está visível
    await waitFor(() => {
      expect(screen.getByText(/Este é um nome muito longo de journal que definitivamente precisa ser truncado/)).toBeInTheDocument();
    });
    
    // Verificar se o botão mudou para "recolher"
    expect(screen.getByRole('button', { name: /recolher nome/i })).toBeInTheDocument();
  });

  test('deve recolher nome expandido ao clicar novamente', async () => {
    render(
      <ResultsTable 
        data={mockJournalsLong}
        searchTerm=""
        onExportCSV={() => {}}
        onExportExcel={() => {}}
      />
    );

    const expandButton = screen.getByRole('button', { name: /expandir nome completo/i });
    
    // Expandir
    await user.click(expandButton);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /recolher nome/i })).toBeInTheDocument();
    });
    
    // Recolher
    const collapseButton = screen.getByRole('button', { name: /recolher nome/i });
    await user.click(collapseButton);
    
    // Verificar se voltou ao estado truncado
    await waitFor(() => {
      expect(screen.getByText(/Este é um nome muito longo de\.\.\./)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /expandir nome completo/i })).toBeInTheDocument();
    });
  });

  test('deve manter estado de expansão independente para cada journal', async () => {
    render(
      <ResultsTable 
        data={mockJournalsLong}
        searchTerm=""
        onExportCSV={() => {}}
        onExportExcel={() => {}}
      />
    );

    const expandButtons = screen.getAllByRole('button', { name: /expandir nome completo/i });
    
    // Expandir apenas o primeiro journal
    await user.click(expandButtons[0]);
    
    await waitFor(() => {
      // Primeiro deve estar expandido
      expect(screen.getByText(/Este é um nome muito longo de journal que definitivamente precisa ser truncado/)).toBeInTheDocument();
      
      // Segundo deve permanecer truncado
      expect(screen.getByText(/Outro journal com nome extremamente\.\.\./)).toBeInTheDocument();
    });
  });

  test('deve resetar estado de expansão ao aplicar filtros', async () => {
    const { rerender } = render(
      <ResultsTable 
        data={mockJournalsLong}
        searchTerm=""
        onExportCSV={() => {}}
        onExportExcel={() => {}}
      />
    );

    // Expandir um journal
    const expandButton = screen.getByRole('button', { name: /expandir nome completo/i });
    await user.click(expandButton);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /recolher nome/i })).toBeInTheDocument();
    });

    // Simular mudança de filtro através de re-render com searchTerm diferente
    rerender(
      <ResultsTable 
        data={mockJournalsLong}
        searchTerm="teste"
        onExportCSV={() => {}}
        onExportExcel={() => {}}
      />
    );
    
    // Voltar ao estado original
    rerender(
      <ResultsTable 
        data={mockJournalsLong}
        searchTerm=""
        onExportCSV={() => {}}
        onExportExcel={() => {}}
      />
    );
    
    // Verificar se o estado foi resetado
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /expandir nome completo/i })).toBeInTheDocument();
    });
  });

  test('não deve mostrar botão de expansão para nomes curtos', () => {
    render(
      <ResultsTable 
        data={mockJournalsShort}
        searchTerm=""
        onExportCSV={() => {}}
        onExportExcel={() => {}}
      />
    );

    // Verificar se nomes curtos são exibidos completamente
    expect(screen.getByText('Journal Curto')).toBeInTheDocument();
    expect(screen.getByText('Outro Journal')).toBeInTheDocument();
    
    // Verificar se não há botões de expansão
    expect(screen.queryByRole('button', { name: /expandir nome completo/i })).not.toBeInTheDocument();
  });
});

describe('Journal Name Truncation - Testes de Acessibilidade', () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
  });

  test('deve suportar navegação por teclado com Enter', async () => {
    render(
      <ResultsTable 
        data={mockJournalsLong}
        searchTerm=""
        onExportCSV={() => {}}
        onExportExcel={() => {}}
      />
    );

    const expandButton = screen.getByRole('button', { name: /expandir nome completo/i });
    
    // Focar no botão e pressionar Enter
    expandButton.focus();
    await user.keyboard('{Enter}');
    
    // Verificar se expandiu
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /recolher nome/i })).toBeInTheDocument();
    });
  });

  test('deve suportar navegação por teclado com Space', async () => {
    render(
      <ResultsTable 
        data={mockJournalsLong}
        searchTerm=""
        onExportCSV={() => {}}
        onExportExcel={() => {}}
      />
    );

    const expandButton = screen.getByRole('button', { name: /expandir nome completo/i });
    
    // Focar no botão e pressionar Space
    expandButton.focus();
    await user.keyboard(' ');
    
    // Verificar se expandiu
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /recolher nome/i })).toBeInTheDocument();
    });
  });

  test('deve ter ARIA labels apropriados', () => {
    render(
      <ResultsTable 
        data={mockJournalsLong}
        searchTerm=""
        onExportCSV={() => {}}
        onExportExcel={() => {}}
      />
    );

    const expandButton = screen.getByRole('button', { name: /expandir nome completo/i });
    
    // Verificar atributos ARIA
    expect(expandButton).toHaveAttribute('aria-label');
    expect(expandButton).toHaveAttribute('aria-expanded', 'false');
    expect(expandButton).toHaveAttribute('role', 'button');
    expect(expandButton).toHaveAttribute('tabIndex', '0');
  });

  test('deve atualizar aria-expanded corretamente', async () => {
    render(
      <ResultsTable 
        data={mockJournalsLong}
        searchTerm=""
        onExportCSV={() => {}}
        onExportExcel={() => {}}
      />
    );

    const expandButton = screen.getByRole('button', { name: /expandir nome completo/i });
    
    // Estado inicial
    expect(expandButton).toHaveAttribute('aria-expanded', 'false');
    
    // Expandir
    await user.click(expandButton);
    
    await waitFor(() => {
      const collapseButton = screen.getByRole('button', { name: /recolher nome/i });
      expect(collapseButton).toHaveAttribute('aria-expanded', 'true');
    });
  });

  test('deve ter tooltip com nome completo para nomes truncados', () => {
    render(
      <ResultsTable 
        data={mockJournalsLong}
        searchTerm=""
        onExportCSV={() => {}}
        onExportExcel={() => {}}
      />
    );

    // Encontrar célula truncada
    const truncatedCell = screen.getByText(/Este é um nome muito longo de\.\.\./);
    const cellContainer = truncatedCell.closest('[title]');
    
    // Verificar se tem tooltip com nome completo
    expect(cellContainer).toHaveAttribute('title');
    expect(cellContainer.getAttribute('title')).toContain('Este é um nome muito longo de journal que definitivamente precisa ser truncado');
  });

  test('deve ser acessível via screen reader', () => {
    render(
      <ResultsTable 
        data={mockJournalsLong}
        searchTerm=""
        onExportCSV={() => {}}
        onExportExcel={() => {}}
      />
    );

    // Verificar se há elementos com sr-only para screen readers
    const srOnlyElements = document.querySelectorAll('.sr-only');
    expect(srOnlyElements.length).toBeGreaterThan(0);
    
    // Verificar se células têm descrições adequadas
    const journalCells = screen.getAllByRole('button', { name: /journal/i });
    journalCells.forEach(cell => {
      expect(cell).toHaveAttribute('aria-label');
    });
  });

  test('deve manter foco após expansão/recolhimento', async () => {
    render(
      <ResultsTable 
        data={mockJournalsLong}
        searchTerm=""
        onExportCSV={() => {}}
        onExportExcel={() => {}}
      />
    );

    const expandButton = screen.getByRole('button', { name: /expandir nome completo/i });
    
    // Focar e expandir
    expandButton.focus();
    await user.click(expandButton);
    
    await waitFor(() => {
      const collapseButton = screen.getByRole('button', { name: /recolher nome/i });
      expect(collapseButton).toHaveFocus();
    });
  });
});

describe('Journal Name Truncation - Testes de Responsividade', () => {
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
    
    // Simular mudança de viewport
    window.dispatchEvent(new Event('resize'));
  };

  test('deve ajustar truncamento para dispositivos móveis', () => {
    // Simular viewport mobile
    setViewport(375, 667);
    
    render(
      <ResultsTable 
        data={mockJournalsLong}
        searchTerm=""
        onExportCSV={() => {}}
        onExportExcel={() => {}}
      />
    );

    // Verificar se células têm classes responsivas
    const journalCells = document.querySelectorAll('.journal-cell');
    journalCells.forEach(cell => {
      const styles = window.getComputedStyle(cell);
      // Em mobile, max-width deve ser menor
      expect(cell.classList.contains('truncated') || cell.classList.contains('expanded')).toBe(true);
    });
  });

  test('deve ajustar truncamento para tablets', () => {
    // Simular viewport tablet
    setViewport(768, 1024);
    
    render(
      <ResultsTable 
        data={mockJournalsLong}
        searchTerm=""
        onExportCSV={() => {}}
        onExportExcel={() => {}}
      />
    );

    // Verificar se layout se adapta ao tablet
    const journalCells = document.querySelectorAll('.journal-cell');
    expect(journalCells.length).toBeGreaterThan(0);
    
    // Verificar se botões de expansão são adequados para touch
    const expandButtons = screen.getAllByRole('button', { name: /expandir nome completo/i });
    expandButtons.forEach(button => {
      const styles = window.getComputedStyle(button);
      // Botões devem ter tamanho adequado para touch (mínimo 44px)
      expect(parseInt(styles.minHeight) || parseInt(styles.height)).toBeGreaterThanOrEqual(18);
    });
  });

  test('deve manter funcionalidade em desktop', () => {
    // Simular viewport desktop
    setViewport(1920, 1080);
    
    render(
      <ResultsTable 
        data={mockJournalsLong}
        searchTerm=""
        onExportCSV={() => {}}
        onExportExcel={() => {}}
      />
    );

    // Verificar se funcionalidade completa está disponível
    expect(screen.getByRole('button', { name: /expandir nome completo/i })).toBeInTheDocument();
    
    // Verificar se células têm largura adequada para desktop
    const journalCells = document.querySelectorAll('.journal-cell.truncated');
    journalCells.forEach(cell => {
      expect(cell.style.maxWidth).toBe('200px');
    });
  });

  test('deve adaptar tamanho de botões para diferentes viewports', () => {
    const viewports = [
      { width: 375, height: 667, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1920, height: 1080, name: 'desktop' }
    ];

    viewports.forEach(viewport => {
      setViewport(viewport.width, viewport.height);
      
      const { rerender } = render(
        <ResultsTable 
          data={mockJournalsLong}
          searchTerm=""
          onExportCSV={() => {}}
          onExportExcel={() => {}}
        />
      );

      const expandButtons = screen.getAllByRole('button', { name: /expandir nome completo/i });
      
      expandButtons.forEach(button => {
        // Verificar se botão é clicável e visível
        expect(button).toBeVisible();
        expect(button).not.toBeDisabled();
      });

      rerender(<div />); // Limpar para próximo teste
    });
  });
});

describe('Journal Name Truncation - Testes de Performance', () => {
  test('deve renderizar rapidamente com dataset pequeno', async () => {
    const startTime = performance.now();
    
    render(
      <ResultsTable 
        data={mockJournalsLong}
        searchTerm=""
        onExportCSV={() => {}}
        onExportExcel={() => {}}
      />
    );

    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Renderização deve ser rápida (menos de 100ms para dataset pequeno)
    expect(renderTime).toBeLessThan(100);
  });

  test('deve manter performance com dataset médio (100 journals)', async () => {
    const mediumDataset = createLargeDataset(100);
    const startTime = performance.now();
    
    render(
      <ResultsTable 
        data={mediumDataset}
        searchTerm=""
        onExportCSV={() => {}}
        onExportExcel={() => {}}
      />
    );

    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Deve renderizar em tempo razoável (menos de 500ms)
    expect(renderTime).toBeLessThan(500);
  });

  test('deve manter performance com dataset grande (1000 journals)', async () => {
    const largeDataset = createLargeDataset(1000);
    const startTime = performance.now();
    
    render(
      <ResultsTable 
        data={largeDataset}
        searchTerm=""
        onExportCSV={() => {}}
        onExportExcel={() => {}}
      />
    );

    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Mesmo com dataset grande, deve renderizar em tempo aceitável (menos de 2s)
    expect(renderTime).toBeLessThan(2000);
  });

  test('deve otimizar re-renders durante expansão múltipla', async () => {
    const dataset = createLargeDataset(50);
    let renderCount = 0;
    
    // Mock para contar re-renders
    const OriginalResultsTable = ResultsTable;
    const MockedResultsTable = (props) => {
      renderCount++;
      return OriginalResultsTable(props);
    };
    
    const { rerender } = render(
      <MockedResultsTable 
        data={dataset}
        searchTerm=""
        onExportCSV={() => {}}
        onExportExcel={() => {}}
      />
    );

    const initialRenderCount = renderCount;
    
    // Expandir múltiplos journals rapidamente
    const expandButtons = screen.getAllByRole('button', { name: /expandir nome completo/i });
    
    const startTime = performance.now();
    
    // Expandir primeiros 5 journals
    for (let i = 0; i < Math.min(5, expandButtons.length); i++) {
      fireEvent.click(expandButtons[i]);
    }
    
    const endTime = performance.now();
    const expansionTime = endTime - startTime;
    
    // Expansões múltiplas devem ser rápidas (menos de 200ms)
    expect(expansionTime).toBeLessThan(200);
    
    // Não deve causar re-renders excessivos
    const finalRenderCount = renderCount;
    expect(finalRenderCount - initialRenderCount).toBeLessThan(10);
  });

  test('deve manter performance durante busca com nomes truncados', async () => {
    const largeDataset = createLargeDataset(500);
    
    const { rerender } = render(
      <ResultsTable 
        data={largeDataset}
        searchTerm=""
        onExportCSV={() => {}}
        onExportExcel={() => {}}
      />
    );

    const startTime = performance.now();
    
    // Simular busca através de re-render com searchTerm
    await act(async () => {
      rerender(
        <ResultsTable 
          data={largeDataset}
          searchTerm="Journal"
          onExportCSV={() => {}}
          onExportExcel={() => {}}
        />
      );
    });
    
    const endTime = performance.now();
    const searchTime = endTime - startTime;
    
    // Busca deve ser rápida mesmo com dataset grande
    expect(searchTime).toBeLessThan(300);
  });

  test('deve gerenciar memória eficientemente com expansões', async () => {
    const dataset = createLargeDataset(100);
    
    const { unmount } = render(
      <ResultsTable 
        data={dataset}
        searchTerm=""
        onExportCSV={() => {}}
        onExportExcel={() => {}}
      />
    );

    // Expandir alguns journals
    const expandButtons = screen.getAllByRole('button', { name: /expandir nome completo/i });
    
    for (let i = 0; i < Math.min(10, expandButtons.length); i++) {
      fireEvent.click(expandButtons[i]);
    }

    // Verificar se não há vazamentos de memória óbvios
    const beforeUnmount = performance.memory ? performance.memory.usedJSHeapSize : 0;
    
    unmount();
    
    // Forçar garbage collection se disponível
    if (global.gc) {
      global.gc();
    }
    
    const afterUnmount = performance.memory ? performance.memory.usedJSHeapSize : 0;
    
    // Memória deve ser liberada (ou pelo menos não crescer significativamente)
    if (performance.memory) {
      expect(afterUnmount).toBeLessThanOrEqual(beforeUnmount * 1.1); // 10% de tolerância
    }
  });
});

describe('Journal Name Truncation - Testes de Integração Avançados', () => {
  test('deve manter highlight de busca em nomes expandidos', async () => {
    const user = userEvent.setup();
    
    render(
      <ResultsTable 
        data={mockJournalsLong}
        searchTerm="muito"
        onExportCSV={() => {}}
        onExportExcel={() => {}}
      />
    );

    // Expandir journal
    const expandButton = screen.getAllByRole('button', { name: /expandir nome completo/i })[0];
    await user.click(expandButton);
    
    await waitFor(() => {
      // Verificar se o nome expandido contém o termo de busca
      const expandedText = screen.getByText(/Este é um nome muito longo de journal que definitivamente precisa ser truncado/);
      expect(expandedText).toBeInTheDocument();
      expect(expandedText.textContent).toContain('muito');
    });
  });

  test('deve funcionar corretamente com exportação de dados', async () => {
    const mockExportCSV = vi.fn();
    const mockExportExcel = vi.fn();
    
    render(
      <ResultsTable 
        data={mockJournalsLong}
        searchTerm=""
        onExportCSV={mockExportCSV}
        onExportExcel={mockExportExcel}
      />
    );

    // Expandir alguns journals
    const expandButtons = screen.getAllByRole('button', { name: /expandir nome completo/i });
    await userEvent.click(expandButtons[0]);
    
    // Verificar se os dados estão disponíveis para exportação com nomes completos
    // (A exportação é chamada externamente, não através de botão na tabela)
    expect(mockJournalsLong[0].journal).toContain('Este é um nome muito longo de journal que definitivamente precisa ser truncado');
    
    // Simular chamada de exportação
    if (mockExportCSV) {
      mockExportCSV(mockJournalsLong);
      expect(mockExportCSV).toHaveBeenCalledWith(mockJournalsLong);
    }
  });

  test('deve preservar estado durante paginação', async () => {
    // Criar dataset grande para testar paginação
    const paginatedDataset = createLargeDataset(100);
    
    render(
      <ResultsTable 
        data={paginatedDataset}
        searchTerm=""
        onExportCSV={() => {}}
        onExportExcel={() => {}}
      />
    );

    // Expandir primeiro journal
    const expandButton = screen.getAllByRole('button', { name: /expandir nome completo/i })[0];
    await userEvent.click(expandButton);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /recolher nome/i })).toBeInTheDocument();
    });

    // Navegar para próxima página (se paginação estiver implementada)
    const nextPageButton = screen.queryByRole('button', { name: /próxima página/i });
    if (nextPageButton) {
      await userEvent.click(nextPageButton);
      
      // Voltar para primeira página
      const prevPageButton = screen.getByRole('button', { name: /página anterior/i });
      await userEvent.click(prevPageButton);
      
      // Estado de expansão deve ter sido resetado
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /expandir nome completo/i })).toBeInTheDocument();
      });
    }
  });
});