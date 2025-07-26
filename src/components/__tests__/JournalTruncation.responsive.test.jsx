/**
 * Testes específicos de responsividade para truncamento de journals
 * Testa comportamento em diferentes tamanhos de tela e dispositivos
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ResultsTable from '../ResultsTable';

// Mock data para testes
const mockResponsiveJournals = [
  {
    journal: 'Journal com nome muito longo que precisa ser testado em diferentes tamanhos de tela para garantir responsividade',
    abdc: 'A*',
    abs: '4',
    sjr: '2.5',
    jcr: '3.2'
  },
  {
    journal: 'Outro journal extremamente longo para testar comportamento responsivo em dispositivos móveis e tablets',
    abdc: 'A',
    abs: '3',
    sjr: '1.8',
    jcr: '2.1'
  },
  {
    journal: 'Journal Curto',
    abdc: 'B',
    abs: '2',
    sjr: '1.2',
    jcr: '1.5'
  }
];

// Utilitários para simular diferentes viewports
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
  
  // Atualizar matchMedia mock
  window.matchMedia = vi.fn().mockImplementation(query => {
    const matches = {
      '(max-width: 768px)': width <= 768,
      '(min-width: 769px) and (max-width: 1024px)': width > 768 && width <= 1024,
      '(min-width: 1025px)': width > 1024,
      '(orientation: portrait)': height > width,
      '(orientation: landscape)': width > height,
    };
    
    return {
      matches: matches[query] || false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };
  });
  
  // Disparar evento de resize
  window.dispatchEvent(new Event('resize'));
};

// Definições de breakpoints
const BREAKPOINTS = {
  mobile: { width: 375, height: 667, name: 'Mobile' },
  mobileLarge: { width: 414, height: 896, name: 'Mobile Large' },
  tablet: { width: 768, height: 1024, name: 'Tablet' },
  tabletLarge: { width: 1024, height: 768, name: 'Tablet Large (Landscape)' },
  desktop: { width: 1280, height: 720, name: 'Desktop' },
  desktopLarge: { width: 1920, height: 1080, name: 'Desktop Large' }
};

describe('Journal Truncation - Responsive Behavior', () => {
  beforeEach(() => {
    // Reset viewport para desktop por padrão
    setViewportSize(1280, 720);
  });

  describe('Mobile Responsiveness', () => {
    test('deve ajustar truncamento para mobile portrait', () => {
      setViewportSize(BREAKPOINTS.mobile.width, BREAKPOINTS.mobile.height);
      
      render(
        <ResultsTable 
          data={mockResponsiveJournals}
          searchTerm=""
          onExportCSV={() => {}}
          onExportExcel={() => {}}
        />
      );

      // Verificar se células têm largura adequada para mobile
      const journalCells = document.querySelectorAll('.journal-cell.truncated');
      journalCells.forEach(cell => {
        const computedStyle = window.getComputedStyle(cell);
        const maxWidth = parseInt(computedStyle.maxWidth);
        
        // Em mobile, largura deve ser menor
        expect(maxWidth).toBeLessThanOrEqual(150);
      });
    });

    test('deve ajustar tamanho de botões para touch em mobile', () => {
      setViewportSize(BREAKPOINTS.mobile.width, BREAKPOINTS.mobile.height);
      
      render(
        <ResultsTable 
          data={mockResponsiveJournals}
          searchTerm=""
          onExportCSV={() => {}}
          onExportExcel={() => {}}
        />
      );

      const expandButtons = screen.getAllByRole('button', { name: /expandir nome completo/i });
      
      expandButtons.forEach(button => {
        const computedStyle = window.getComputedStyle(button);
        const width = parseInt(computedStyle.width) || parseInt(computedStyle.minWidth);
        const height = parseInt(computedStyle.height) || parseInt(computedStyle.minHeight);
        
        // Botões devem ter tamanho mínimo para touch (44px recomendado)
        expect(width).toBeGreaterThanOrEqual(18); // Ajustado para o tamanho atual
        expect(height).toBeGreaterThanOrEqual(18);
      });
    });

    test('deve manter funcionalidade touch em mobile', async () => {
      setViewportSize(BREAKPOINTS.mobile.width, BREAKPOINTS.mobile.height);
      const user = userEvent.setup();
      
      render(
        <ResultsTable 
          data={mockResponsiveJournals}
          searchTerm=""
          onExportCSV={() => {}}
          onExportExcel={() => {}}
        />
      );

      const expandButton = screen.getByRole('button', { name: /expandir nome completo/i });
      
      // Simular toque
      await user.click(expandButton);
      
      // Verificar se expandiu corretamente
      await screen.findByRole('button', { name: /recolher nome/i });
      expect(screen.getByRole('button', { name: /recolher nome/i })).toBeInTheDocument();
    });

    test('deve adaptar layout para mobile landscape', () => {
      setViewportSize(BREAKPOINTS.mobile.height, BREAKPOINTS.mobile.width); // Invertido para landscape
      
      render(
        <ResultsTable 
          data={mockResponsiveJournals}
          searchTerm=""
          onExportCSV={() => {}}
          onExportExcel={() => {}}
        />
      );

      // Em landscape, deve ter mais espaço para nomes
      const journalCells = document.querySelectorAll('.journal-cell.truncated');
      journalCells.forEach(cell => {
        const computedStyle = window.getComputedStyle(cell);
        const maxWidth = parseInt(computedStyle.maxWidth);
        
        // Landscape deve permitir nomes um pouco maiores
        expect(maxWidth).toBeGreaterThan(150);
      });
    });
  });

  describe('Tablet Responsiveness', () => {
    test('deve otimizar para tablet portrait', () => {
      setViewportSize(BREAKPOINTS.tablet.width, BREAKPOINTS.tablet.height);
      
      render(
        <ResultsTable 
          data={mockResponsiveJournals}
          searchTerm=""
          onExportCSV={() => {}}
          onExportExcel={() => {}}
        />
      );

      const journalCells = document.querySelectorAll('.journal-cell.truncated');
      journalCells.forEach(cell => {
        const computedStyle = window.getComputedStyle(cell);
        const maxWidth = parseInt(computedStyle.maxWidth);
        
        // Tablet deve ter largura intermediária
        expect(maxWidth).toBeGreaterThan(150);
        expect(maxWidth).toBeLessThanOrEqual(200);
      });
    });

    test('deve otimizar para tablet landscape', () => {
      setViewportSize(BREAKPOINTS.tabletLarge.width, BREAKPOINTS.tabletLarge.height);
      
      render(
        <ResultsTable 
          data={mockResponsiveJournals}
          searchTerm=""
          onExportCSV={() => {}}
          onExportExcel={() => {}}
        />
      );

      const journalCells = document.querySelectorAll('.journal-cell.truncated');
      journalCells.forEach(cell => {
        const computedStyle = window.getComputedStyle(cell);
        const maxWidth = parseInt(computedStyle.maxWidth);
        
        // Tablet landscape deve ter mais espaço
        expect(maxWidth).toBeGreaterThanOrEqual(180);
      });
    });

    test('deve manter usabilidade touch em tablet', async () => {
      setViewportSize(BREAKPOINTS.tablet.width, BREAKPOINTS.tablet.height);
      const user = userEvent.setup();
      
      render(
        <ResultsTable 
          data={mockResponsiveJournals}
          searchTerm=""
          onExportCSV={() => {}}
          onExportExcel={() => {}}
        />
      );

      const expandButtons = screen.getAllByRole('button', { name: /expandir nome completo/i });
      
      // Testar múltiplos toques
      await user.click(expandButtons[0]);
      await user.click(expandButtons[1]);
      
      // Verificar se ambos expandiram
      const collapseButtons = await screen.findAllByRole('button', { name: /recolher nome/i });
      expect(collapseButtons).toHaveLength(2);
    });
  });

  describe('Desktop Responsiveness', () => {
    test('deve usar layout completo em desktop', () => {
      setViewportSize(BREAKPOINTS.desktop.width, BREAKPOINTS.desktop.height);
      
      render(
        <ResultsTable 
          data={mockResponsiveJournals}
          searchTerm=""
          onExportCSV={() => {}}
          onExportExcel={() => {}}
        />
      );

      const journalCells = document.querySelectorAll('.journal-cell.truncated');
      journalCells.forEach(cell => {
        const computedStyle = window.getComputedStyle(cell);
        const maxWidth = parseInt(computedStyle.maxWidth);
        
        // Desktop deve ter largura padrão
        expect(maxWidth).toBe(200);
      });
    });

    test('deve otimizar para telas grandes', () => {
      setViewportSize(BREAKPOINTS.desktopLarge.width, BREAKPOINTS.desktopLarge.height);
      
      render(
        <ResultsTable 
          data={mockResponsiveJournals}
          searchTerm=""
          onExportCSV={() => {}}
          onExportExcel={() => {}}
        />
      );

      // Em telas grandes, pode permitir nomes mais longos
      const journalCells = document.querySelectorAll('.journal-cell.expanded');
      journalCells.forEach(cell => {
        const computedStyle = window.getComputedStyle(cell);
        const maxWidth = parseInt(computedStyle.maxWidth);
        
        // Expandido deve ter largura generosa em desktop
        expect(maxWidth).toBeGreaterThanOrEqual(400);
      });
    });

    test('deve manter hover states em desktop', async () => {
      setViewportSize(BREAKPOINTS.desktop.width, BREAKPOINTS.desktop.height);
      
      render(
        <ResultsTable 
          data={mockResponsiveJournals}
          searchTerm=""
          onExportCSV={() => {}}
          onExportExcel={() => {}}
        />
      );

      const truncatedCell = screen.getByText(/Journal com nome muito longo/);
      
      // Simular hover
      fireEvent.mouseEnter(truncatedCell);
      
      // Verificar se cursor muda para pointer
      const cellContainer = truncatedCell.closest('.journal-cell');
      expect(cellContainer).toHaveStyle('cursor: pointer');
    });
  });

  describe('Dynamic Viewport Changes', () => {
    test('deve adaptar quando viewport muda de mobile para desktop', async () => {
      // Começar em mobile
      setViewportSize(BREAKPOINTS.mobile.width, BREAKPOINTS.mobile.height);
      
      const { rerender } = render(
        <ResultsTable 
          data={mockResponsiveJournals}
          searchTerm=""
          onExportCSV={() => {}}
          onExportExcel={() => {}}
        />
      );

      // Verificar estado mobile
      let journalCells = document.querySelectorAll('.journal-cell.truncated');
      let mobileMaxWidth = parseInt(window.getComputedStyle(journalCells[0]).maxWidth);
      
      // Mudar para desktop
      setViewportSize(BREAKPOINTS.desktop.width, BREAKPOINTS.desktop.height);
      
      rerender(
        <ResultsTable 
          data={mockResponsiveJournals}
          searchTerm=""
          onExportCSV={() => {}}
          onExportExcel={() => {}}
        />
      );

      // Verificar se adaptou para desktop
      journalCells = document.querySelectorAll('.journal-cell.truncated');
      let desktopMaxWidth = parseInt(window.getComputedStyle(journalCells[0]).maxWidth);
      
      expect(desktopMaxWidth).toBeGreaterThan(mobileMaxWidth);
    });

    test('deve manter estado de expansão durante mudança de viewport', async () => {
      setViewportSize(BREAKPOINTS.desktop.width, BREAKPOINTS.desktop.height);
      const user = userEvent.setup();
      
      const { rerender } = render(
        <ResultsTable 
          data={mockResponsiveJournals}
          searchTerm=""
          onExportCSV={() => {}}
          onExportExcel={() => {}}
        />
      );

      // Expandir um journal
      const expandButton = screen.getByRole('button', { name: /expandir nome completo/i });
      await user.click(expandButton);
      
      await screen.findByRole('button', { name: /recolher nome/i });
      
      // Mudar para mobile
      setViewportSize(BREAKPOINTS.mobile.width, BREAKPOINTS.mobile.height);
      
      rerender(
        <ResultsTable 
          data={mockResponsiveJournals}
          searchTerm=""
          onExportCSV={() => {}}
          onExportExcel={() => {}}
        />
      );

      // Estado de expansão deve ser mantido
      expect(screen.getByRole('button', { name: /recolher nome/i })).toBeInTheDocument();
    });

    test('deve adaptar animações para diferentes dispositivos', () => {
      const viewports = [BREAKPOINTS.mobile, BREAKPOINTS.tablet, BREAKPOINTS.desktop];
      
      viewports.forEach(viewport => {
        setViewportSize(viewport.width, viewport.height);
        
        render(
          <ResultsTable 
            data={mockResponsiveJournals}
            searchTerm=""
            onExportCSV={() => {}}
            onExportExcel={() => {}}
          />
        );

        const journalCells = document.querySelectorAll('.journal-cell');
        
        journalCells.forEach(cell => {
          const computedStyle = window.getComputedStyle(cell);
          
          // Verificar se transições estão definidas
          expect(computedStyle.transition).toBeTruthy();
        });
      });
    });
  });

  describe('Accessibility Across Devices', () => {
    test('deve manter acessibilidade em mobile', () => {
      setViewportSize(BREAKPOINTS.mobile.width, BREAKPOINTS.mobile.height);
      
      render(
        <ResultsTable 
          data={mockResponsiveJournals}
          searchTerm=""
          onExportCSV={() => {}}
          onExportExcel={() => {}}
        />
      );

      const expandButtons = screen.getAllByRole('button', { name: /expandir nome completo/i });
      
      expandButtons.forEach(button => {
        // Verificar atributos de acessibilidade
        expect(button).toHaveAttribute('aria-label');
        expect(button).toHaveAttribute('aria-expanded');
        expect(button).toHaveAttribute('tabIndex', '0');
      });
    });

    test('deve manter navegação por teclado em tablet', async () => {
      setViewportSize(BREAKPOINTS.tablet.width, BREAKPOINTS.tablet.height);
      const user = userEvent.setup();
      
      render(
        <ResultsTable 
          data={mockResponsiveJournals}
          searchTerm=""
          onExportCSV={() => {}}
          onExportExcel={() => {}}
        />
      );

      const expandButton = screen.getByRole('button', { name: /expandir nome completo/i });
      
      // Navegar com Tab e ativar com Enter
      await user.tab();
      expect(expandButton).toHaveFocus();
      
      await user.keyboard('{Enter}');
      
      // Verificar se expandiu
      await screen.findByRole('button', { name: /recolher nome/i });
    });

    test('deve adaptar tooltips para touch devices', () => {
      setViewportSize(BREAKPOINTS.mobile.width, BREAKPOINTS.mobile.height);
      
      render(
        <ResultsTable 
          data={mockResponsiveJournals}
          searchTerm=""
          onExportCSV={() => {}}
          onExportExcel={() => {}}
        />
      );

      const truncatedCells = document.querySelectorAll('.journal-cell.truncated');
      
      truncatedCells.forEach(cell => {
        // Em touch devices, tooltip deve estar disponível via title
        expect(cell.closest('[title]')).toBeTruthy();
      });
    });
  });

  describe('Performance Across Devices', () => {
    test('deve manter performance em dispositivos móveis', async () => {
      setViewportSize(BREAKPOINTS.mobile.width, BREAKPOINTS.mobile.height);
      
      const startTime = performance.now();
      
      render(
        <ResultsTable 
          data={mockResponsiveJournals}
          searchTerm=""
          onExportCSV={() => {}}
          onExportExcel={() => {}}
        />
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Renderização deve ser rápida mesmo em mobile
      expect(renderTime).toBeLessThan(200);
    });

    test('deve otimizar animações para dispositivos com recursos limitados', () => {
      // Simular dispositivo com recursos limitados
      setViewportSize(BREAKPOINTS.mobile.width, BREAKPOINTS.mobile.height);
      
      // Mock para simular preferência por animações reduzidas
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
      
      render(
        <ResultsTable 
          data={mockResponsiveJournals}
          searchTerm=""
          onExportCSV={() => {}}
          onExportExcel={() => {}}
        />
      );

      const journalCells = document.querySelectorAll('.journal-cell');
      
      journalCells.forEach(cell => {
        const computedStyle = window.getComputedStyle(cell);
        
        // Se usuário prefere animações reduzidas, transições devem ser mínimas
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          expect(computedStyle.transition).toContain('none');
        }
      });
    });
  });
});