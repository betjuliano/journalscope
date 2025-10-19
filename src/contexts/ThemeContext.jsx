import React, { createContext, useContext, useState, useEffect } from 'react';

// Tipos para o contexto de tema
const ThemeContext = createContext({
  theme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
  isDark: false
});

// Hook personalizado para usar o contexto de tema
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  return context;
};

// Provider do contexto de tema
export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');
  const [isHydrated, setIsHydrated] = useState(false);

  // Carregar tema do localStorage na inicialização
  useEffect(() => {
    const savedTheme = localStorage.getItem('journalscope-theme');
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      setTheme(savedTheme);
    } else {
      // Detectar preferência do sistema
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
    setIsHydrated(true);
  }, []);

  // Aplicar tema ao documento
  useEffect(() => {
    if (isHydrated) {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('journalscope-theme', theme);
    }
  }, [theme, isHydrated]);

  // Função para alternar tema
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  // Função para definir tema específico
  const setThemeValue = (newTheme) => {
    if (newTheme === 'light' || newTheme === 'dark') {
      setTheme(newTheme);
    }
  };

  const value = {
    theme,
    setTheme: setThemeValue,
    toggleTheme,
    isDark: theme === 'dark'
  };

  // Não renderizar até hidratar para evitar flash
  if (!isHydrated) {
    return null;
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
