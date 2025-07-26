import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ResultsTable from '../ResultsTable';

// Mock data for testing
const mockJournals = [
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

describe('Journal Name Truncation - Accessibility', () => {
  it('deve implementar ARIA labels apropriados para botões de expansão', () => {
    render(
      <ResultsTable 
        data={mockJournals}
        searchTerm=""
        onExportCSV={() => {}}
        onExportExcel={() => {}}
      />
    );

    // Verificar se o botão de expansão tem aria-label apropriado
    const expandButton = screen.getByRole('button', { 
      name: /expandir nome completo do journal/i 
    });
    expect(expandButton).toBeInTheDocument();
    expect(expandButton).toHaveAttribute('aria-label');
    expect(expandButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('deve adicionar atributo aria-expanded para indicar estado atual', () => {
    render(
      <ResultsTable 
        data={mockJournals}
        searchTerm=""
        onExportCSV={() => {}}
        onExportExcel={() => {}}
      />
    );

    const expandButton = screen.getByRole('button', { 
      name: /expandir nome completo do journal/i 
    });
    
    // Estado inicial deve ser false
    expect(expandButton).toHaveAttribute('aria-expanded', 'false');
    
    // Clicar para expandir
    fireEvent.click(expandButton);
    
    // Estado deve mudar para true
    expect(expandButton).toHaveAttribute('aria-expanded', 'true');
  });

  it('deve implementar aria-label descritivo para células de journal', () => {
    render(
      <ResultsTable 
        data={mockJournals}
        searchTerm=""
        onExportCSV={() => {}}
        onExportExcel={() => {}}
      />
    );

    // Verificar se a célula do journal tem aria-label descritivo
    const journalCell = screen.getByRole('button', { 
      name: /journal:.*truncado.*pressione enter/i 
    });
    expect(journalCell).toBeInTheDocument();
    expect(journalCell).toHaveAttribute('aria-label');
  });

  it('deve adicionar suporte para screen readers com descrições adequadas', () => {
    render(
      <ResultsTable 
        data={mockJournals}
        searchTerm=""
        onExportCSV={() => {}}
        onExportExcel={() => {}}
      />
    );

    // Verificar se existem elementos sr-only para screen readers
    const srOnlyElements = document.querySelectorAll('.sr-only');
    expect(srOnlyElements.length).toBeGreaterThan(0);
    
    // Verificar se há descrições com aria-live
    const liveRegions = document.querySelectorAll('[aria-live="polite"]');
    expect(liveRegions.length).toBeGreaterThan(0);
  });

  it('deve manter acessibilidade após expansão/recolhimento', () => {
    render(
      <ResultsTable 
        data={mockJournals}
        searchTerm=""
        onExportCSV={() => {}}
        onExportExcel={() => {}}
      />
    );

    const expandButton = screen.getByRole('button', { 
      name: /expandir nome completo do journal/i 
    });
    
    // Expandir
    fireEvent.click(expandButton);
    
    // Verificar se o botão ainda tem os atributos de acessibilidade
    expect(expandButton).toHaveAttribute('aria-expanded', 'true');
    expect(expandButton).toHaveAttribute('aria-label');
    
    // Recolher
    fireEvent.click(expandButton);
    
    // Verificar se voltou ao estado inicial
    expect(expandButton).toHaveAttribute('aria-expanded', 'false');
  });
});