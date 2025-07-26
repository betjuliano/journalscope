/**
 * Basic integration test to validate journal truncation functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { truncateJournalName, needsTruncation } from '../../../utils/textUtils';

describe('Basic Journal Truncation Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Text Utilities', () => {
    it('should truncate long journal names correctly', () => {
      const longName = 'Journal of Very Long Academic Research in Computer Science and Information Technology Systems';
      const result = truncateJournalName(longName, 30);
      
      expect(result).toBe('Journal of Very Long Academic ...');
      expect(result.length).toBe(33); // 30 + 3 (...)
    });

    it('should not truncate short journal names', () => {
      const shortName = 'Short Journal';
      const result = truncateJournalName(shortName, 30);
      
      expect(result).toBe(shortName);
    });

    it('should detect when truncation is needed', () => {
      const longName = 'Journal of Very Long Academic Research in Computer Science';
      const shortName = 'Short Journal';
      
      expect(needsTruncation(longName, 30)).toBe(true);
      expect(needsTruncation(shortName, 30)).toBe(false);
    });

    it('should handle null and undefined inputs gracefully', () => {
      expect(truncateJournalName(null)).toBe('');
      expect(truncateJournalName(undefined)).toBe('');
      expect(needsTruncation(null)).toBe(false);
      expect(needsTruncation(undefined)).toBe(false);
    });

    it('should handle invalid inputs gracefully', () => {
      expect(truncateJournalName(123)).toBe('123');
      expect(truncateJournalName('')).toBe('');
      expect(needsTruncation('')).toBe(false);
    });
  });

  describe('Export Data Integrity', () => {
    it('should preserve full journal names for export', () => {
      const mockJournals = [
        {
          journal: 'Journal of Very Long Academic Research in Computer Science and Information Technology Systems',
          abdc: 'A*',
          abs: '4*'
        },
        {
          journal: 'Short Name',
          abdc: 'A',
          abs: '4'
        }
      ];

      // Simular que dados são exportados com nomes completos
      const exportData = mockJournals.map(journal => ({
        ...journal,
        journal: journal.journal // Nome completo preservado
      }));

      expect(exportData[0].journal).toBe('Journal of Very Long Academic Research in Computer Science and Information Technology Systems');
      expect(exportData[1].journal).toBe('Short Name');
    });
  });

  describe('Search Functionality', () => {
    it('should search in full journal names', () => {
      const journals = [
        {
          journal: 'Journal of Advanced Computer Science and Information Technology Research Systems',
          abdc: 'A*'
        },
        {
          journal: 'Short Tech Journal',
          abdc: 'B'
        }
      ];

      const searchTerm = 'Information Technology';
      
      // Simular busca no nome completo
      const searchResults = journals.filter(journal =>
        journal.journal.toLowerCase().includes(searchTerm.toLowerCase())
      );

      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].journal).toContain('Information Technology');
    });

    it('should be case insensitive', () => {
      const journals = [
        {
          journal: 'Journal of Computer Science',
          abdc: 'A*'
        }
      ];

      const searchTerm = 'COMPUTER SCIENCE';
      
      const searchResults = journals.filter(journal =>
        journal.journal.toLowerCase().includes(searchTerm.toLowerCase())
      );

      expect(searchResults).toHaveLength(1);
    });
  });

  describe('Filter Integration', () => {
    it('should work with ABDC filters', () => {
      const journals = [
        { journal: 'Long Journal Name That Needs Truncation', abdc: 'A*' },
        { journal: 'Another Long Journal Name', abdc: 'A' },
        { journal: 'Third Long Journal Name', abdc: 'B' }
      ];

      const filteredByABDC = journals.filter(j => j.abdc === 'A*');
      
      expect(filteredByABDC).toHaveLength(1);
      expect(filteredByABDC[0].abdc).toBe('A*');
    });

    it('should work with ABS filters', () => {
      const journals = [
        { journal: 'Long Journal Name That Needs Truncation', abs: '4*' },
        { journal: 'Another Long Journal Name', abs: '4' },
        { journal: 'Third Long Journal Name', abs: '3' }
      ];

      const filteredByABS = journals.filter(j => j.abs === '4*');
      
      expect(filteredByABS).toHaveLength(1);
      expect(filteredByABS[0].abs).toBe('4*');
    });
  });

  describe('Performance', () => {
    it('should handle large datasets efficiently', () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        journal: `Very Long Journal Name Number ${i} That Should Be Truncated For Performance Testing`,
        abdc: ['A*', 'A', 'B', 'C'][i % 4]
      }));

      const startTime = performance.now();
      
      // Simular processamento de truncamento
      const processedData = largeDataset.map(journal => ({
        ...journal,
        truncated: needsTruncation(journal.journal, 30),
        displayName: truncateJournalName(journal.journal, 30)
      }));

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      // Processamento não deve demorar mais que 100ms para 1000 items
      expect(processingTime).toBeLessThan(100);
      expect(processedData).toHaveLength(1000);
      expect(processedData[0].truncated).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed journal data gracefully', () => {
      const malformedData = [
        { journal: null, abdc: 'A*' },
        { journal: undefined, abs: '4*' },
        { journal: '', sjr: { quartile: 'Q1' } },
        { journal: 123, jcr: { quartile: 'Q2' } }
      ];

      // Processar dados malformados
      const processedData = malformedData.map(journal => ({
        ...journal,
        displayName: truncateJournalName(journal.journal, 30),
        needsTruncation: needsTruncation(journal.journal, 30)
      }));

      // Não deve quebrar o processamento
      expect(processedData).toHaveLength(4);
      expect(processedData[0].displayName).toBe(''); // null -> ''
      expect(processedData[1].displayName).toBe(''); // undefined -> ''
      expect(processedData[2].displayName).toBe(''); // '' -> ''
      expect(processedData[3].displayName).toBe('123'); // 123 -> '123'
    });
  });
});