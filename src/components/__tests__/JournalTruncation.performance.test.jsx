/**
 * Testes específicos de performance para funcionalidade de truncamento
 * Foca em cenários de stress e otimizações
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import ResultsTable from '../ResultsTable';

// Utilitários para testes de performance
const measureRenderTime = async (renderFn) => {
  const startTime = performance.now();
  await act(async () => {
    renderFn();
  });
  const endTime = performance.now();
  return endTime - startTime;
};

const createStressTestDataset = (size, nameLength = 100) => {
  return Array.from({ length: size }, (_, index) => ({
    journal: `Journal de teste com nome muito longo número ${index + 1} ${'a'.repeat(nameLength)}`,
    abdc: `A${index % 4 === 0 ? '*' : ''}`,
    abs: String((index % 4) + 1),
    sjr: (Math.random() * 5).toFixed(1),
    jcr: (Math.random() * 10).toFixed(1),
    citescore: (Math.random() * 15).toFixed(1)
  }));
};

// Mock para performance.memory se não estiver disponível
if (!performance.memory) {
  performance.memory = {
    usedJSHeapSize: 0,
    totalJSHeapSize: 0,
    jsHeapSizeLimit: 0
  };
}

describe('Journal Truncation - Performance Stress Tests', () => {
  beforeEach(() => {
    // Limpar console para testes limpos
    vi.clearAllMocks();
  });

  test('deve renderizar 1000 journals em menos de 2 segundos', async () => {
    const largeDataset = createStressTestDataset(1000);
    
    const renderTime = await measureRenderTime(() => {
      render(
        <ResultsTable 
          data={largeDataset}
          searchTerm=""
          onExportCSV={() => {}}
          onExportExcel={() => {}}
        />
      );
    });

    expect(renderTime).toBeLessThan(2000);
    
    // Verificar se todos os elementos foram renderizados
    const journalCells = document.querySelectorAll('.journal-cell');
    expect(journalCells.length).toBeGreaterThan(0);
  });

  test('deve manter performance durante expansão em massa', async () => {
    const dataset = createStressTestDataset(100);
    
    render(
      <ResultsTable 
        data={dataset}
        searchTerm=""
        onExportCSV={() => {}}
        onExportExcel={() => {}}
      />
    );

    const expandButtons = screen.getAllByRole('button', { name: /expandir nome completo/i });
    
    const startTime = performance.now();
    
    // Expandir 20 journals rapidamente
    await act(async () => {
      for (let i = 0; i < Math.min(20, expandButtons.length); i++) {
        fireEvent.click(expandButtons[i]);
      }
    });
    
    const endTime = performance.now();
    const expansionTime = endTime - startTime;
    
    // Expansão em massa deve ser rápida
    expect(expansionTime).toBeLessThan(500);
  });

  test('deve otimizar re-renders com React.memo', async () => {
    const dataset = createStressTestDataset(50);
    let renderCount = 0;
    
    // Interceptar renders
    const originalRender = React.createElement;
    React.createElement = (...args) => {
      if (args[0] && args[0].name === 'JournalCell') {
        renderCount++;
      }
      return originalRender(...args);
    };

    render(
      <ResultsTable 
        data={dataset}
        searchTerm=""
        onExportCSV={() => {}}
        onExportExcel={() => {}}
      />
    );

    const initialRenderCount = renderCount;
    
    // Expandir um journal
    const expandButton = screen.getAllByRole('button', { name: /expandir nome completo/i })[0];
    await act(async () => {
      fireEvent.click(expandButton);
    });

    const finalRenderCount = renderCount;
    
    // Apenas o journal clicado deve re-renderizar
    expect(finalRenderCount - initialRenderCount).toBeLessThan(5);
    
    // Restaurar React.createElement
    React.createElement = originalRender;
  });

  test('deve gerenciar memória eficientemente com datasets grandes', async () => {
    const initialMemory = performance.memory.usedJSHeapSize;
    
    // Renderizar dataset grande
    const largeDataset = createStressTestDataset(500);
    const { unmount } = render(
      <ResultsTable 
        data={largeDataset}
        searchTerm=""
        onExportCSV={() => {}}
        onExportExcel={() => {}}
      />
    );

    // Expandir alguns journals
    const expandButtons = screen.getAllByRole('button', { name: /expandir nome completo/i });
    await act(async () => {
      for (let i = 0; i < Math.min(10, expandButtons.length); i++) {
        fireEvent.click(expandButtons[i]);
      }
    });

    const peakMemory = performance.memory.usedJSHeapSize;
    
    // Desmontar componente
    unmount();
    
    // Forçar garbage collection se disponível
    if (global.gc) {
      global.gc();
    }
    
    // Aguardar um pouco para GC
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const finalMemory = performance.memory.usedJSHeapSize;
    
    // Memória deve ser liberada adequadamente
    const memoryIncrease = finalMemory - initialMemory;
    const peakIncrease = peakMemory - initialMemory;
    
    // Aumento final deve ser menor que 50% do pico
    expect(memoryIncrease).toBeLessThan(peakIncrease * 0.5);
  });

  test('deve manter performance durante busca em tempo real', async () => {
    const dataset = createStressTestDataset(200);
    
    render(
      <ResultsTable 
        data={dataset}
        searchTerm=""
        onExportCSV={() => {}}
        onExportExcel={() => {}}
      />
    );

    const searchInput = screen.getByPlaceholderText(/pesquisar/i);
    const searchTerms = ['Journal', 'teste', 'nome', 'muito', 'longo'];
    
    const startTime = performance.now();
    
    // Simular digitação rápida
    for (const term of searchTerms) {
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: term } });
      });
      
      // Pequena pausa para simular digitação
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    const endTime = performance.now();
    const searchTime = endTime - startTime;
    
    // Busca em tempo real deve ser responsiva
    expect(searchTime).toBeLessThan(1000);
  });

  test('deve otimizar scroll virtual com muitos journals', async () => {
    const hugeDataset = createStressTestDataset(2000);
    
    const renderTime = await measureRenderTime(() => {
      render(
        <ResultsTable 
          data={hugeDataset}
          searchTerm=""
          onExportCSV={() => {}}
          onExportExcel={() => {}}
        />
      );
    });

    // Mesmo com dataset muito grande, deve renderizar rapidamente
    // (assumindo que há virtualização ou paginação)
    expect(renderTime).toBeLessThan(3000);
    
    // Verificar se nem todos os elementos estão no DOM
    // (indicando virtualização eficiente)
    const journalCells = document.querySelectorAll('.journal-cell');
    expect(journalCells.length).toBeLessThan(hugeDataset.length);
  });

  test('deve manter performance com nomes extremamente longos', async () => {
    const extremeDataset = createStressTestDataset(50, 500); // Nomes de 500 caracteres
    
    const renderTime = await measureRenderTime(() => {
      render(
        <ResultsTable 
          data={extremeDataset}
          searchTerm=""
          onExportCSV={() => {}}
          onExportExcel={() => {}}
        />
      );
    });

    expect(renderTime).toBeLessThan(1000);
    
    // Verificar se truncamento funciona com nomes extremos
    const truncatedTexts = screen.getAllByText(/\.\.\.$/);
    expect(truncatedTexts.length).toBeGreaterThan(0);
  });

  test('deve otimizar atualizações de estado de expansão', async () => {
    const dataset = createStressTestDataset(100);
    
    render(
      <ResultsTable 
        data={dataset}
        searchTerm=""
        onExportCSV={() => {}}
        onExportExcel={() => {}}
      />
    );

    const expandButtons = screen.getAllByRole('button', { name: /expandir nome completo/i });
    
    // Medir tempo para múltiplas expansões/recolhimentos
    const startTime = performance.now();
    
    await act(async () => {
      // Expandir e recolher rapidamente
      for (let i = 0; i < Math.min(10, expandButtons.length); i++) {
        fireEvent.click(expandButtons[i]); // Expandir
        fireEvent.click(expandButtons[i]); // Recolher
      }
    });
    
    const endTime = performance.now();
    const toggleTime = endTime - startTime;
    
    // Múltiplas operações de toggle devem ser rápidas
    expect(toggleTime).toBeLessThan(300);
  });
});

describe('Journal Truncation - Performance Monitoring', () => {
  test('deve monitorar performance de renderização inicial', async () => {
    const sizes = [10, 50, 100, 200, 500];
    const results = [];
    
    for (const size of sizes) {
      const dataset = createStressTestDataset(size);
      
      const renderTime = await measureRenderTime(() => {
        const { unmount } = render(
          <ResultsTable 
            data={dataset}
            searchTerm=""
            onExportCSV={() => {}}
            onExportExcel={() => {}}
          />
        );
        
        // Limpar para próximo teste
        setTimeout(() => unmount(), 0);
      });
      
      results.push({ size, renderTime });
    }
    
    // Performance deve escalar de forma razoável
    // Não deve ser exponencial
    for (let i = 1; i < results.length; i++) {
      const prev = results[i - 1];
      const curr = results[i];
      
      // Tempo não deve crescer mais que 3x quando dataset dobra
      const growthFactor = curr.renderTime / prev.renderTime;
      const sizeFactor = curr.size / prev.size;
      
      expect(growthFactor).toBeLessThan(sizeFactor * 3);
    }
  });

  test('deve manter performance consistente em múltiplas renderizações', async () => {
    const dataset = createStressTestDataset(100);
    const renderTimes = [];
    
    // Renderizar múltiplas vezes
    for (let i = 0; i < 5; i++) {
      const renderTime = await measureRenderTime(() => {
        const { unmount } = render(
          <ResultsTable 
            data={dataset}
            searchTerm=""
            onExportCSV={() => {}}
            onExportExcel={() => {}}
          />
        );
        
        setTimeout(() => unmount(), 0);
      });
      
      renderTimes.push(renderTime);
    }
    
    // Calcular variação
    const avgTime = renderTimes.reduce((a, b) => a + b) / renderTimes.length;
    const maxVariation = Math.max(...renderTimes.map(time => Math.abs(time - avgTime)));
    
    // Variação não deve ser maior que 50% da média
    expect(maxVariation).toBeLessThan(avgTime * 0.5);
  });
});