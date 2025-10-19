import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle = ({ position = 'header' }) => {
  const { theme, toggleTheme } = useTheme();

  const buttonClasses = {
    header: "inline-flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium",
    hero: "inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg transition-colors text-sm font-medium shadow-sm border border-gray-200"
  };

  return (
    <button
      onClick={toggleTheme}
      className={buttonClasses[position] || buttonClasses.header}
      aria-label={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
      title={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
    >
      {theme === 'light' ? (
        <>
          <Moon className="h-4 w-4" />
          <span className="hidden sm:inline">Modo Escuro</span>
        </>
      ) : (
        <>
          <Sun className="h-4 w-4" />
          <span className="hidden sm:inline">Modo Claro</span>
        </>
      )}
    </button>
  );
};

export default ThemeToggle;