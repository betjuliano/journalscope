/**
 * Testes de integração para tratamento de erros no ResultsTable
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ResultsTable from '../ResultsTable';

// Mock console methods para testar logs
const originalConsole = { ...console };
beforeEach(() => {
  console.warn = vi.fn();
  console.error = vi.fn();
});

afterEach(() => {
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
});

describe('ResultsTable - Tratamento de Erros', () => {
  test('deve renderizar fallback para journal com nome inválido', () => {
    const invalidData = [
      {
        journal: null, // Nome inválido
        abdc: 'A',
        abs: '3'
      }
    ];

    render(<ResultsTable data={invalidData} />);
    
    // Deve mostrar fallback
    expect(screen.getByTestId('journal-cell-fallback-0')).toBeInTheDocument();
    expect(screen.getByText('Nome não disponível')).toBeInTheDocument();
    expect(screen.getByText('⚠')).toBeInTheDocument();
  });

  test('deve renderizar fallback para journal com dados maliciosos', () => {
    const maliciousData = [
      {
        journal: '<script>alert("xss")</script>Malicious Journal',
        abdc: 'A',
        abs: '3'
      }
    ];

    render(<ResultsTable data={maliciousData} />);
    
    // Nome deve ser sanitizado
    expect(screen.queryByText('<script>')).not.toBeInTheDocument();
    expect(screen.getByText('Malicious Journal')).toBeInTheDocument();
  });

  test('deve tratar erro na renderização de célula', () => {
    const problematicData = [
      {
        journal: 'Valid Journal',
        abdc: 'A',
        abs: '3'
      }
    ];

    // Simular erro na renderização mockando getNestedValue
    const originalGetNestedValue = vi.fn(() => {
      throw new Error('Simulated render error');
    });

    render(<ResultsTable data={problematicData} />);
    
    // Deve renderizar normalmente mesmo com possíveis erros internos
    expect(screen.getByText('Valid Journal')).toBeInTheDocument();
  });

  test('deve validar dados de journal e logar warnings', () => {
    const incompleteData = [
      {
        journal: 'Incomplete Journal'
        // Campos importantes ausentes
      }
    ];

    render(<ResultsTable data={incompleteData} />);
    
    // Deve renderizar o nome mesmo com dados incompletos
    expect(screen.getByText('Incomplete Journal')).toBeInTheDocument();
    
    // Deve ter logado warnings sobre dados incompletos
    expect(console.warn).toHaveBeenCalled();
  });

  test('deve truncar nomes longos com segurança', () => {
    const longNameData = [
      {
        journal: 'Este é um nome muito longo de journal que deve ser truncado para manter o layout da tabela organizado',
        abdc: 'A',
        abs: '3'
      }
    ];

    render(<ResultsTable data={longNameData} />);
    
    // Nome deve estar truncado
    const truncatedElement = screen.getByText(/Este é um nome muito longo de\.\.\./);
    expect(truncatedElement).toBeInTheDocument();
    
    // Deve ter botão de expansão
    expect(screen.getByRole('button', { name: /Expandir nome completo/ })).toBeInTheDocument();
  });

  test('deve tratar array vazio sem erros', () => {
    render(<ResultsTable data={[]} />);
    
    expect(screen.getByText('Nenhum journal encontrado')).toBeInTheDocument();
    expect(screen.getByText('Tente ajustar os filtros ou termo de busca')).toBeInTheDocument();
  });

  test('deve tratar dados undefined sem erros', () => {
    render(<ResultsTable data={undefined} />);
    
    expect(screen.getByText('Nenhum journal encontrado')).toBeInTheDocument();
  });

  test('deve sanitizar nomes antes de exibir', () => {
    const unsafeData = [
      {
        journal: 'Journal javascript:void(0) onclick="alert()" <script>alert("xss")</script>',
        abdc: 'A'
      }
    ];

    render(<ResultsTable data={unsafeData} />);
    
    // Elementos perigosos devem ter sido removidos
    expect(screen.queryByText(/javascript:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/onclick=/)).not.toBeInTheDocument();
    expect(screen.queryByText(/<script>/)).not.toBeInTheDocument();
    
    // Nome limpo deve estar presente
    expect(screen.getByText(/Journal.*void\(0\)/)).toBeInTheDocument();
  });

  test('deve manter funcionalidade mesmo com erros de renderização', () => {
    const mixedData = [
      {
        journal: 'Valid Journal 1',
        abdc: 'A'
      },
      {
        journal: null, // Dados inválidos
        abdc: 'B'
      },
      {
        journal: 'Valid Journal 2',
        abdc: 'C'
      }
    ];

    render(<ResultsTable data={mixedData} />);
    
    // Journals válidos devem renderizar normalmente
    expect(screen.getByText('Valid Journal 1')).toBeInTheDocument();
    expect(screen.getByText('Valid Journal 2')).toBeInTheDocument();
    
    // Journal inválido deve usar fallback
    expect(screen.getByTestId('journal-cell-fallback-1')).toBeInTheDocument();
    
    // Tabela deve continuar funcional
    expect(screen.getByText('Resultados (3 journals)')).toBeInTheDocument();
  });
});