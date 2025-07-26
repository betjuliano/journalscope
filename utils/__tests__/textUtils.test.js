/**
 * Testes para as funções de tratamento de erros e validações em textUtils
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  truncateJournalName,
  sanitizeJournalName,
  validateTruncationLength,
  isValidJournalName,
  needsTruncation,
  getFullJournalName,
  getSafeJournalNameForRendering,
  createJournalCellFallback,
  validateJournalData
} from '../textUtils';

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

describe('validateTruncationLength', () => {
  test('deve retornar valor válido dentro dos limites', () => {
    expect(validateTruncationLength(30)).toBe(30);
    expect(validateTruncationLength(50)).toBe(50);
  });

  test('deve retornar valor padrão para entrada inválida', () => {
    expect(validateTruncationLength('invalid')).toBe(30);
    expect(validateTruncationLength(null)).toBe(30);
    expect(validateTruncationLength(undefined)).toBe(30);
    expect(validateTruncationLength(NaN)).toBe(30);
  });

  test('deve ajustar valores fora dos limites', () => {
    expect(validateTruncationLength(3)).toBe(5); // Menor que mínimo
    expect(validateTruncationLength(300)).toBe(200); // Maior que máximo
  });

  test('deve logar warnings para valores inválidos', () => {
    validateTruncationLength('invalid');
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('[textUtils] Comprimento de truncamento inválido')
    );

    validateTruncationLength(3);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('[textUtils] Comprimento de truncamento muito pequeno')
    );

    validateTruncationLength(300);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('[textUtils] Comprimento de truncamento muito grande')
    );
  });
});

describe('sanitizeJournalName', () => {
  test('deve sanitizar nomes válidos corretamente', () => {
    expect(sanitizeJournalName('Journal of Science')).toBe('Journal of Science');
    expect(sanitizeJournalName('  Journal with spaces  ')).toBe('Journal with spaces');
  });

  test('deve remover caracteres perigosos', () => {
    expect(sanitizeJournalName('<script>alert("xss")</script>Journal')).toBe('Journal');
    expect(sanitizeJournalName('Journal javascript:void(0)')).toBe('Journal void(0)');
    expect(sanitizeJournalName('Journal onclick="alert()"')).toBe('Journal "alert()"');
    expect(sanitizeJournalName('Journal<>Test')).toBe('JournalTest');
  });

  test('deve tratar entradas inválidas', () => {
    expect(sanitizeJournalName(null)).toBe('');
    expect(sanitizeJournalName(undefined)).toBe('');
    expect(sanitizeJournalName(123)).toBe('123');
    expect(sanitizeJournalName({})).toBe('[object Object]');
  });

  test('deve truncar nomes muito longos', () => {
    const longName = 'a'.repeat(600);
    const result = sanitizeJournalName(longName);
    expect(result.length).toBe(500);
  });

  test('deve logar warnings para dados inválidos', () => {
    sanitizeJournalName(null);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('[textUtils] Nome de journal nulo ou indefinido')
    );

    sanitizeJournalName(123);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('[textUtils] Nome de journal não é string')
    );

    const longName = 'a'.repeat(600);
    sanitizeJournalName(longName);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('[textUtils] Nome de journal muito longo')
    );
  });
});

describe('truncateJournalName', () => {
  test('deve truncar nomes longos corretamente', () => {
    const longName = 'Journal of Very Long Academic Research';
    expect(truncateJournalName(longName, 20)).toBe('Journal of Very Long...');
  });

  test('não deve truncar nomes curtos', () => {
    expect(truncateJournalName('Short Journal', 30)).toBe('Short Journal');
  });

  test('deve tratar entradas inválidas com fallback', () => {
    expect(truncateJournalName(null)).toBe('');
    expect(truncateJournalName(undefined)).toBe('');
    expect(truncateJournalName('')).toBe('');
  });

  test('deve usar sanitização antes do truncamento', () => {
    const maliciousName = '<script>alert("xss")</script>Very Long Journal Name';
    const result = truncateJournalName(maliciousName, 20);
    expect(result).toBe('Very Long Journal Na...');
    expect(result).not.toContain('<script>');
  });

  test('deve usar fallback em caso de erro crítico', () => {
    // Para este teste, vamos simular um erro interno na função
    // Vamos testar com uma entrada que pode causar erro interno
    const result = truncateJournalName('Test Journal');
    expect(result).toBe('Test Journal'); // Deve funcionar normalmente
    
    // Teste com entrada que pode causar problemas internos
    const problematicInput = { toString: () => { throw new Error('Test error'); } };
    const fallbackResult = truncateJournalName(problematicInput);
    expect(fallbackResult).toBe(''); // Deve usar fallback
  });
});

describe('isValidJournalName', () => {
  test('deve validar nomes válidos', () => {
    expect(isValidJournalName('Valid Journal')).toBe(true);
    expect(isValidJournalName('J')).toBe(true);
  });

  test('deve rejeitar entradas inválidas', () => {
    expect(isValidJournalName(null)).toBe(false);
    expect(isValidJournalName(undefined)).toBe(false);
    expect(isValidJournalName('')).toBe(false);
    expect(isValidJournalName('   ')).toBe(false);
    expect(isValidJournalName(123)).toBe(false);
  });

  test('deve rejeitar nomes muito longos', () => {
    const longName = 'a'.repeat(600);
    expect(isValidJournalName(longName)).toBe(false);
  });

  test('deve logar warnings para entradas inválidas', () => {
    isValidJournalName(null);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('[textUtils] Nome de journal nulo ou indefinido')
    );

    isValidJournalName(123);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('[textUtils] Nome de journal não é string')
    );

    isValidJournalName('');
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('[textUtils] Nome de journal está vazio após trim')
    );
  });
});

describe('needsTruncation', () => {
  test('deve identificar corretamente quando truncamento é necessário', () => {
    expect(needsTruncation('Very long journal name', 10)).toBe(true);
    expect(needsTruncation('Short', 10)).toBe(false);
  });

  test('deve tratar entradas inválidas', () => {
    expect(needsTruncation(null, 30)).toBe(false);
    expect(needsTruncation(undefined, 30)).toBe(false);
    expect(needsTruncation(123, 30)).toBe(false);
  });

  test('deve validar comprimento máximo', () => {
    expect(needsTruncation('Test', 'invalid')).toBe(false);
    expect(needsTruncation('Test', 300)).toBe(false); // Ajustado para limite máximo
  });
});

describe('getFullJournalName', () => {
  test('deve priorizar nome original', () => {
    expect(getFullJournalName('Display...', 'Original Full Name')).toBe('Original Full Name');
  });

  test('deve usar nome exibido como fallback', () => {
    expect(getFullJournalName('Display Name', null)).toBe('Display Name');
    expect(getFullJournalName('Display Name', '')).toBe('Display Name');
  });

  test('deve retornar string vazia para entradas inválidas', () => {
    expect(getFullJournalName(null, null)).toBe('');
    expect(getFullJournalName(undefined, undefined)).toBe('');
  });

  test('deve sanitizar nomes antes de retornar', () => {
    const maliciousName = '<script>alert("xss")</script>Journal';
    expect(getFullJournalName('Display', maliciousName)).toBe('Journal');
  });
});

describe('getSafeJournalNameForRendering', () => {
  test('deve extrair nome de diferentes campos', () => {
    expect(getSafeJournalNameForRendering({ journal: 'Test Journal' })).toBe('Test Journal');
    expect(getSafeJournalNameForRendering({ name: 'Test Journal' })).toBe('Test Journal');
    expect(getSafeJournalNameForRendering({ title: 'Test Journal' })).toBe('Test Journal');
    expect(getSafeJournalNameForRendering({ journalName: 'Test Journal' })).toBe('Test Journal');
  });

  test('deve usar fallback para objetos inválidos', () => {
    expect(getSafeJournalNameForRendering({})).toBe('Nome não disponível');
    expect(getSafeJournalNameForRendering(null)).toBe('Nome não disponível');
    expect(getSafeJournalNameForRendering({ journal: null })).toBe('Nome não disponível');
  });

  test('deve usar fallback customizado', () => {
    expect(getSafeJournalNameForRendering({}, 'Custom Fallback')).toBe('Custom Fallback');
  });

  test('deve sanitizar nomes extraídos', () => {
    const maliciousJournal = { journal: '<script>alert("xss")</script>Journal' };
    expect(getSafeJournalNameForRendering(maliciousJournal)).toBe('Journal');
  });
});

describe('createJournalCellFallback', () => {
  test('deve criar elemento de fallback válido', () => {
    const journal = { journal: 'Test Journal' };
    const fallback = createJournalCellFallback(journal, 0);
    
    expect(fallback.type).toBe('div');
    expect(fallback.props.className).toBe('journal-cell-fallback');
    expect(fallback.props['data-testid']).toBe('journal-cell-fallback-0');
  });

  test('deve tratar erros críticos com fallback do fallback', () => {
    // Simular erro crítico
    const invalidJournal = null;
    const fallback = createJournalCellFallback(invalidJournal, 0);
    
    expect(fallback.type).toBe('div');
    expect(fallback.props.className).toContain('journal-cell');
  });
});

describe('validateJournalData', () => {
  test('deve validar journal válido', () => {
    const validJournal = {
      journal: 'Test Journal',
      abdc: 'A',
      abs: '3',
      sjr: { quartile: 'Q1' },
      jcr: { quartile: 'Q2' }
    };
    
    const result = validateJournalData(validJournal);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('deve identificar problemas em journal inválido', () => {
    const invalidJournal = {
      journal: '',
      // Campos importantes ausentes
    };
    
    const result = validateJournalData(invalidJournal);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings).toContain('Nome do journal inválido ou ausente');
  });

  test('deve rejeitar entrada não-objeto', () => {
    const result = validateJournalData(null);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain('Journal deve ser um objeto');
  });

  test('deve logar warnings para campos ausentes', () => {
    const incompleteJournal = { journal: 'Test' };
    validateJournalData(incompleteJournal);
    
    expect(console.warn).toHaveBeenCalledWith(
      '[textUtils] Warnings na validação do journal:',
      expect.any(Array),
      expect.any(Object)
    );
  });

  test('deve tratar erros durante validação', () => {
    // Simular erro durante validação
    const problematicJournal = {};
    Object.defineProperty(problematicJournal, 'journal', {
      get() { throw new Error('Test error'); }
    });
    
    const result = validateJournalData(problematicJournal);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Erro interno durante validação');
    expect(console.error).toHaveBeenCalled();
  });
});

describe('Integração - Fluxo completo de tratamento de erros', () => {
  test('deve processar journal com dados maliciosos de forma segura', () => {
    const maliciousJournal = {
      journal: '<script>alert("xss")</script>Malicious Journal Name That Is Very Long'
    };
    
    // Validar dados
    const validation = validateJournalData(maliciousJournal);
    expect(validation.isValid).toBe(true);
    
    // Obter nome seguro
    const safeName = getSafeJournalNameForRendering(maliciousJournal);
    expect(safeName).not.toContain('<script>');
    expect(safeName).toBe('Malicious Journal Name That Is Very Long');
    
    // Truncar com segurança
    const truncated = truncateJournalName(safeName, 30);
    expect(truncated).toBe('Malicious Journal Name That Is...');
    expect(truncated).not.toContain('<script>');
  });

  test('deve criar fallback para journal completamente inválido', () => {
    const invalidJournal = null;
    
    // Validação deve falhar
    const validation = validateJournalData(invalidJournal);
    expect(validation.isValid).toBe(false);
    
    // Nome seguro deve usar fallback
    const safeName = getSafeJournalNameForRendering(invalidJournal);
    expect(safeName).toBe('Nome não disponível');
    
    // Fallback de renderização deve funcionar
    const fallback = createJournalCellFallback(invalidJournal, 0);
    expect(fallback.type).toBe('div');
  });
});