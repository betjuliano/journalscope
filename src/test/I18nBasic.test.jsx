import { describe, it, expect } from 'vitest';
import ptTranslations from '../translations/pt.js';
import enTranslations from '../translations/en.js';

describe('Translation Files', () => {
  it('should load Portuguese translations correctly', () => {
    expect(ptTranslations).toBeDefined();
    expect(ptTranslations.hero).toBeDefined();
    expect(ptTranslations.hero.title).toBe('JournalScope');
    expect(ptTranslations.hero.subtitle).toBe('Sistema Integrado de Consulta de Journals Acadêmicos');
    expect(ptTranslations.table.actions).toBe('AÇÕES');
  });

  it('should load English translations correctly', () => {
    expect(enTranslations).toBeDefined();
    expect(enTranslations.hero).toBeDefined();
    expect(enTranslations.hero.title).toBe('JournalScope');
    expect(enTranslations.hero.subtitle).toBe('Integrated Academic Journal Query System');
    expect(enTranslations.table.actions).toBe('Actions');
  });

  it('should have consistent structure between languages', () => {
    const ptKeys = Object.keys(ptTranslations);
    const enKeys = Object.keys(enTranslations);
    
    expect(ptKeys.sort()).toEqual(enKeys.sort());
    
    // Check hero section structure
    expect(Object.keys(ptTranslations.hero).sort()).toEqual(Object.keys(enTranslations.hero).sort());
    
    // Check table section structure
    expect(Object.keys(ptTranslations.table).sort()).toEqual(Object.keys(enTranslations.table).sort());
  });
});