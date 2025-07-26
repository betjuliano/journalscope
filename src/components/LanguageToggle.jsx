import React from 'react';
import { useI18n } from '../contexts/I18nContext';

/**
 * Language Toggle Component
 * Provides a button to switch between Portuguese and English
 */
const LanguageToggle = ({ position = 'hero', className = '' }) => {
  const { language, setLanguage, isLoading } = useI18n();

  const handleLanguageChange = () => {
    const newLanguage = language === 'pt' ? 'en' : 'pt';
    setLanguage(newLanguage);
  };

  const getAriaLabel = () => {
    return language === 'pt' 
      ? 'Switch language to English' 
      : 'Alternar idioma para português';
  };

  const getButtonText = () => {
    return language === 'pt' ? 'EN' : 'PT';
  };

  const baseClasses = `
    inline-flex items-center justify-center
    px-3 py-2 
    text-sm font-medium
    border border-gray-300
    rounded-lg
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const positionClasses = {
    hero: `
      bg-white/90 backdrop-blur-sm
      text-gray-700
      hover:bg-white hover:shadow-md
      shadow-sm
    `,
    header: `
      bg-indigo-600
      text-white
      hover:bg-indigo-700
    `
  };

  return (
    <button
      onClick={handleLanguageChange}
      disabled={isLoading}
      className={`${baseClasses} ${positionClasses[position]} ${className}`}
      aria-label={getAriaLabel()}
      aria-pressed={language === 'en'}
      role="switch"
      title={getAriaLabel()}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></div>
          <span className="sr-only">Loading...</span>
        </div>
      ) : (
        <span className="font-bold">{getButtonText()}</span>
      )}
    </button>
  );
};

export default LanguageToggle;