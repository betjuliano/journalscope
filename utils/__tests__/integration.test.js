/**
 * Testes de integração para verificar se a função de truncamento
 * funciona corretamente com dados reais de journals
 */

import { describe, it, expect } from 'vitest';
import { truncateJournalName, needsTruncation } from '../textUtils.js';

describe('Integração com dados reais de journals', () => {
  const realJournalNames = [
    'Journal of Business Research',
    'International Journal of Information Management',
    'European Journal of Operational Research',
    'Journal of the Academy of Marketing Science',
    'MIS Quarterly: Management Information Systems',
    'Information Systems Research',
    'Academy of Management Review',
    'Strategic Management Journal',
    'Journal of Management Information Systems',
    'Decision Support Systems'
  ];

  it('deve truncar corretamente nomes reais de journals', () => {
    realJournalNames.forEach(name => {
      const result = truncateJournalName(name, 30);
      
      if (name.length > 30) {
        expect(result.length).toBe(33); // 30 + 3 (...)
        expect(result.endsWith('...')).toBe(true);
        expect(result.substring(0, 30)).toBe(name.substring(0, 30));
      } else {
        expect(result).toBe(name);
      }
    });
  });

  it('deve identificar corretamente quais nomes precisam truncar', () => {
    const longNames = realJournalNames.filter(name => name.length > 30);
    const shortNames = realJournalNames.filter(name => name.length <= 30);

    longNames.forEach(name => {
      expect(needsTruncation(name, 30)).toBe(true);
    });

    shortNames.forEach(name => {
      expect(needsTruncation(name, 30)).toBe(false);
    });
  });

  it('deve manter consistência entre needsTruncation e truncateJournalName', () => {
    realJournalNames.forEach(name => {
      const needs = needsTruncation(name, 30);
      const result = truncateJournalName(name, 30);
      
      if (needs) {
        expect(result.endsWith('...')).toBe(true);
        expect(result.length).toBe(33);
      } else {
        expect(result).toBe(name);
        expect(result.endsWith('...')).toBe(false);
      }
    });
  });

  it('deve funcionar com diferentes comprimentos de truncamento', () => {
    const testLengths = [10, 20, 25, 35, 50];
    const testName = 'International Journal of Information Management';

    testLengths.forEach(length => {
      const result = truncateJournalName(testName, length);
      
      if (testName.length > length) {
        expect(result.length).toBe(length + 3);
        expect(result.endsWith('...')).toBe(true);
      } else {
        expect(result).toBe(testName);
      }
    });
  });
});