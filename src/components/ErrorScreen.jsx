import React from 'react';
import { AlertCircle, RefreshCw, FileX, Database } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';

const ErrorScreen = ({ error, onRetry }) => {
  const { t } = useI18n();
  
  // Analisar tipo de erro para dar orientações específicas
  const getErrorType = () => {
    if (!error) return 'unknown';
    
    const errorMsg = error.toLowerCase();
    
    if (errorMsg.includes('arquivo') || errorMsg.includes('file')) {
      return 'file';
    }
    if (errorMsg.includes('abdc') || errorMsg.includes('abs') || errorMsg.includes('wiley')) {
      return 'data';
    }
    if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
      return 'network';
    }
    
    return 'general';
  };

  const errorType = getErrorType();

  const getErrorIcon = () => {
    switch (errorType) {
      case 'file':
        return <FileX className="mx-auto h-12 w-12 text-red-600 mb-4" />;
      case 'data':
        return <Database className="mx-auto h-12 w-12 text-red-600 mb-4" />;
      default:
        return <AlertCircle className="mx-auto h-12 w-12 text-red-600 mb-4" />;
    }
  };

  const getErrorTitle = () => {
    switch (errorType) {
      case 'file':
        return t('error.types.file');
      case 'data':
        return t('error.types.data');
      case 'network':
        return t('error.types.network');
      default:
        return t('error.types.general');
    }
  };

  const getErrorSuggestions = () => {
    switch (errorType) {
      case 'file':
        return t('error.suggestions.file');
      case 'data':
        return t('error.suggestions.data');
      case 'network':
        return t('error.suggestions.network');
      default:
        return t('error.suggestions.general');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
        <div className="text-center">
          {getErrorIcon()}
          
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            {getErrorTitle()}
          </h2>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 text-sm break-words">
              {error || t('error.unknownError')}
            </p>
          </div>
          
          {/* Sugestões de solução */}
          <div className="text-left mb-6">
            <h3 className="font-medium text-gray-800 mb-3">{t('error.possibleSolutions')}</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              {getErrorSuggestions().map((suggestion, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Informações técnicas */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h4 className="font-medium text-gray-800 mb-2">{t('error.expectedFiles')}</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <div>📁 data/ABDC2022.xlsx</div>
              <div>📁 data/ABS2024.xlsx</div>
              <div>📁 data/Wiley.xlsx</div>
            </div>
          </div>

          <button
            onClick={onRetry}
            className="btn btn-error w-full flex items-center justify-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            {t('error.retry')}
          </button>

          <div className="mt-6 text-xs text-gray-500">
            {t('loading.systemDescription')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorScreen;
