/**
 * Testes essenciais para funcionalidade de truncamento de nomes de journals
 * Foca nos aspectos fundamentais que estão implementados
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ResultsTable from '../ResultsTable';
import { truncateJournalName, needsTruncation } from '../../../utils/textUtils';

// Mock data para testes
const mockJournalsForTesting = [
  {
    journal: 'Este é um nome muito longo de journal que definitivamente precisa ser truncado porque tem mais de 30 caracteres',
    abdc: 'A*',
    abs: '4',
    sjr: '2.5',
    jcr: '3.2'
  },
  {
    journal: 'Journal Curto',
    abdc: 'A',
    abs: '3',
    sjr: '1.8',
    jcr: '2.1'
  }
];

// Mock para ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe('Journal Truncation - Testes Unitários Essenciais', () => {
  describe('truncateJournalName function', () => {
    test('deve truncar nomes longos corretamente', () => {
      const longName = 'Este é um nome muito longo de journal que precisa ser truncado';
      const result = truncateJournalName(longName, 30);
      
      expect(result).toBe('Este é um nome muito longo de ...');
      expect(result.length).toBe(33); // 30 + 3 ('...')
    });

    test('não deve truncar nomes curtos', () => {
      const shortName = 'Journal Curto';
      const result = truncateJournalName(shortName, 30);
      
      expect(result).toBe(shortName);
    });

    test('deve tratar entradas inválidas', () => {
      expect(truncateJournalName(null, 30)).toBe('');
      expect(truncateJournalName(undefined, 30)).toBe('');
      expect(truncateJournalName('', 30)).toBe('');
    });
  });

  describe('needsTruncation function', () => {
    test('deve identificar quando truncamento é necessário', () => {
      expect(needsTruncation('Nome muito longo para caber', 10)).toBe(true);
      expect(needsTruncation('Curto', 10)).toBe(false);
    });

    test('deve tratar entradas inválidas', () => {
      expect(needsTruncation(null, 30)).toBe(false);
      expect(needsTruncation(undefined, 30)).toBe(false);
    });
  });
});

describe('Journal Truncation - Testes de Integração Básicos', () => {
  test('deve renderizar tabela com journals', () => {
    render(
      <ResultsTable 
        data={mockJournalsForTesting}
        searchTerm=""
        onExportCSV={() => {}}
        onExportExcel={() => {}}
      />
    );

    // Verificar se a tabela foi renderizada
    expect(screen.getByRole('table')).toBeInTheDocument();
    
    // Verificar se há journals na tabela
    expect(screen.getByText('Journal Curto')).toBeInTheDocument();
  });

  test('deve mostrar botões de expansão para nomes longos', () => {
    render(
      <ResultsTable 
        data={mockJournalsForTesting}
        searchTerm=""
        onExportCSV={() => {}}
        onExportExcel={() => {}}
      />
    );

    // Deve haver pelo menos um botão de expansão para o nome longo
    const expandButtons = screen.getAllByRole('button', { name: /expandir nome completo/i });
    expect(expandButtons.length).toBeGreaterThan(0);
  });

  test('deve expandir nome ao clicar no botão', async () => {
    const user = userEvent.setup();
    
    render(
      <ResultsTable 
        data={mockJournalsForTesting}
        searchTerm=""
        onExportCSV={() => {}}
        onExportExcel={() => {}}
      />
    );

    const expandButtons = screen.getAllByRole('button', { name: /expandir nome completo/i });
    
    // Clicar no primeiro botão de expansão
    await user.click(expandButtons[0]);
    
    // Verificar se apareceu botão de recolher
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /recolher nome/i })).toBeInTheDocument();
    });
  });

  test('deve recolher nome expandido', async () => {
    const user = userEvent.setup();
    
    render(
      <ResultsTable 
        data={mockJournalsForTesting}
        searchTerm=""
        onExportCSV={() => {}}
        onExportExcel={() => {}}
      />
    );

    const expandButtons = screen.getAllByRole('button', { name: /expandir nome completo/i });
    
    // Expandir
    await user.click(expandButtons[0]);
    
    // Aguardar botão de recolher aparecer
    const collapseButton = await screen.findByRole('button', { name: /recolher nome/i });
    
    // Recolher
    await user.click(collapseButton);
    
    // Verificar se voltou ao estado inicial
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /expandir nome completo/i }).length).toBeGreaterThan(0);
    });
  });
});

describe('Journal Truncation - Testes de Acessibilidade Básicos', () => {
  test('deve ter ARIA labels nos botões', () => {
    render(
      <ResultsTable 
        data={mockJournalsForTesting}
        searchTerm=""
        onExportCSV={() => {}}
        onExportExcel={() => {}}
      />
    );

    const expandButtons = screen.getAllByRole('button', { name: /expandir nome completo/i });
    
    expandButtons.forEach(button => {
      expect(button).toHaveAttribute('aria-label');
      expect(button).toHaveAttribute('aria-expanded');
    });
  });

  test('deve suportar navegação por teclado', async () => {
    const user = userEvent.setup();
    
    render(
      <ResultsTable 
        data={mockJournalsForTesting}
        searchTerm=""
        onExportCSV={() => {}}
        onExportExcel={() => {}}
      />
    );

    const expandButtons = screen.getAllByRole('button', { name: /expandir nome completo/i });
    const firstButton = expandButtons[0];
    
    // Focar no botão
    firstButton.focus();
    expect(firstButton).toHaveFocus();
    
    // Ativar com Enter
    await user.keyboard('{Enter}');
    
    // Verificar se expandiu
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /recolher nome/i })).toBeInTheDocument();
    });
  });

  test('deve ter tooltips para nomes truncados', () => {
    render(
      <ResultsTable 
        data={mockJournalsForTesting}
        searchTerm=""
        onExportCSV={() => {}}
        onExportExcel={() => {}}
      />
    );

    // Procurar por elementos com title (tooltip)
    const elementsWithTooltip = document.querySelectorAll('[title]');
    const journalTooltips = Array.from(elementsWithTooltip).filter(el => 
      el.getAttribute('title')?.includes('Este é um nome muito longo')
    );
    
    expect(journalTooltips.length).toBeGreaterThan(0);
  });
});

describe('Journal Truncation - Testes de Performance Básicos', () => {
  test('deve renderizar rapidamente com poucos journals', () => {
    const startTime = performance.now();
    
    render(
      <ResultsTable 
        data={mockJournalsForTesting}
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

  test('deve manter performance com dataset médio', () => {
    // Criar dataset de 50 journals
    const mediumDataset = Array.from({ length: 50 }, (_, index) => ({
      journal: `Journal com nome longo número ${index + 1} que precisa ser truncado para teste`,
      abdc: 'A',
      abs: '3',
      sjr: '2.1',
      jcr: '1.8'
    }));

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
    
    // Deve renderizar em tempo razoável (menos de 1s)
    expect(renderTime).toBeLessThan(1000);
  });
});

describe('Journal Truncation - Testes de Responsividade Básicos', () => {
  const setViewportSize = (width, height) => {
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
    
    window.dispatchEvent(new Event('resize'));
  };

  test('deve funcionar em diferentes tamanhos de tela', () => {
    const viewports = [
      { width: 375, height: 667 }, // Mobile
      { width: 768, height: 1024 }, // Tablet
      { width: 1920, height: 1080 } // Desktop
    ];

    viewports.forEach(viewport => {
      setViewportSize(viewport.width, viewport.height);
      
      const { unmount } = render(
        <ResultsTable 
          data={mockJournalsForTesting}
          searchTerm=""
          onExportCSV={() => {}}
          onExportExcel={() => {}}
        />
      );

      // Verificar se tabela renderiza em todos os tamanhos
      expect(screen.getByRole('table')).toBeInTheDocument();
      
      // Verificar se botões estão presentes
      const expandButtons = screen.getAllByRole('button', { name: /expandir nome completo/i });
      expect(expandButtons.length).toBeGreaterThan(0);
      
      unmount();
    });
  });
});

describe('Journal Truncation - Testes de Estado', () => {
  test('deve resetar expansões quando dados mudam', () => {
    const { rerender } = render(
      <ResultsTable 
        data={mockJournalsForTesting}
        searchTerm=""
        onExportCSV={() => {}}
        onExportExcel={() => {}}
      />
    );

    // Verificar estado inicial
    const initialExpandButtons = screen.getAllByRole('button', { name: /expandir nome completo/i });
    expect(initialExpandButtons.length).toBeGreaterThan(0);

    // Mudar dados
    const newData = [
      {
        journal: 'Novo journal com nome muito longo que também precisa ser truncado',
        abdc: 'B',
        abs: '2',
        sjr: '1.5',
        jcr: '1.2'
      }
    ];

    rerender(
      <ResultsTable 
        data={newData}
        searchTerm=""
        onExportCSV={() => {}}
        onExportExcel={() => {}}
      />
    );

    // Verificar se novos botões estão presentes
    const newExpandButtons = screen.getAllByRole('button', { name: /expandir nome completo/i });
    expect(newExpandButtons.length).toBeGreaterThan(0);
  });

  test('deve manter funcionalidade com searchTerm', () => {
    render(
      <ResultsTable 
        data={mockJournalsForTesting}
        searchTerm="muito"
        onExportCSV={() => {}}
        onExportExcel={() => {}}
      />
    );

    // Tabela deve renderizar mesmo com searchTerm
    expect(screen.getByRole('table')).toBeInTheDocument();
    
    // Botões de expansão devem estar presentes
    const expandButtons = screen.getAllByRole('button', { name: /expandir nome completo/i });
    expect(expandButtons.length).toBeGreaterThan(0);
  });
});