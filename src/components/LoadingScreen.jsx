import React from 'react';
import { Database, CheckCircle, Zap } from 'lucide-react';

const LoadingScreen = ({ 
  processingStatus = 'Carregando dados...', 
  dataSource = {
    abdc: { count: 0, loaded: false },
    abs: { count: 0, loaded: false },
    wiley: { count: 0, loaded: false },
    jcr: { count: 0, loaded: false },
    sjr: { count: 0, loaded: false },
    citeScore: { count: 0, loaded: false },
    predatory: { count: 0, loaded: false }
  } 
}) => {
  // Calcular progresso
  const totalSources = 7;
  const loadedSources = Object.values(dataSource).filter(source => source.loaded).length;
  const progressPercentage = (loadedSources / totalSources) * 100;
  
  // Verificar se está usando cache
  const isUsingCache = processingStatus.includes('cache');
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Database className="h-12 w-12 text-indigo-600" />
            {isUsingCache && <Zap className="h-6 w-6 text-yellow-500" />}
          </div>
          
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            {isUsingCache ? 'JournalScope ⚡' : 'Carregando JournalScope'}
          </h2>
          
          {isUsingCache && (
            <p className="text-sm text-yellow-600 mb-4 font-medium">
              Carregamento rápido ativado!
            </p>
          )}
          
          {/* Barra de progresso */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          
          <p className="text-gray-600 mb-6">{processingStatus}</p>
          
          {/* Status de carregamento dos arquivos */}
          <div className="space-y-2 text-sm max-h-80 overflow-y-auto">
            <div className={`flex justify-between items-center p-3 rounded transition-all duration-300 ${
              dataSource.abdc.loaded ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-600'
            }`}>
              <span className="flex items-center gap-2">
                {dataSource.abdc.loaded ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent"></div>
                )}
                ABDC Database
              </span>
              <span className="font-medium">
                {dataSource.abdc.loaded ? `${dataSource.abdc.count} journals ✓` : 'Carregando...'}
              </span>
            </div>
            
            <div className={`flex justify-between items-center p-3 rounded transition-all duration-300 ${
              dataSource.abs.loaded ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-600'
            }`}>
              <span className="flex items-center gap-2">
                {dataSource.abs.loaded ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent"></div>
                )}
                ABS Database
              </span>
              <span className="font-medium">
                {dataSource.abs.loaded ? `${dataSource.abs.count} journals ✓` : 'Carregando...'}
              </span>
            </div>
            
            <div className={`flex justify-between items-center p-3 rounded transition-all duration-300 ${
              dataSource.jcr.loaded ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-600'
            }`}>
              <span className="flex items-center gap-2">
                {dataSource.jcr.loaded ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent"></div>
                )}
                JCR Database
              </span>
              <span className="font-medium">
                {dataSource.jcr.loaded ? `${dataSource.jcr.count} journals ✓` : 'Carregando...'}
              </span>
            </div>
            
            <div className={`flex justify-between items-center p-3 rounded transition-all duration-300 ${
              dataSource.sjr.loaded ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-600'
            }`}>
              <span className="flex items-center gap-2">
                {dataSource.sjr.loaded ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent"></div>
                )}
                SJR Database
              </span>
              <span className="font-medium">
                {dataSource.sjr.loaded ? `${dataSource.sjr.count} journals ✓` : 'Carregando...'}
              </span>
            </div>
            
            <div className={`flex justify-between items-center p-3 rounded transition-all duration-300 ${
              dataSource.citeScore.loaded ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-600'
            }`}>
              <span className="flex items-center gap-2">
                {dataSource.citeScore.loaded ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent"></div>
                )}
                CiteScore Database
              </span>
              <span className="font-medium">
                {dataSource.citeScore.loaded ? `${dataSource.citeScore.count} journals ✓` : 'Carregando...'}
              </span>
            </div>
            
            <div className={`flex justify-between items-center p-3 rounded transition-all duration-300 ${
              dataSource.wiley.loaded ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-600'
            }`}>
              <span className="flex items-center gap-2">
                {dataSource.wiley.loaded ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent"></div>
                )}
                Wiley Database
              </span>
              <span className="font-medium">
                {dataSource.wiley.loaded ? `${dataSource.wiley.count} journals ✓` : 'Carregando...'}
              </span>
            </div>
            
            <div className={`flex justify-between items-center p-3 rounded transition-all duration-300 ${
              dataSource.predatory.loaded ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-600'
            }`}>
              <span className="flex items-center gap-2">
                {dataSource.predatory.loaded ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent"></div>
                )}
                Predatory Journals
              </span>
              <span className="font-medium">
                {dataSource.predatory.loaded ? `${dataSource.predatory.count} journals ✓` : 'Carregando...'}
              </span>
            </div>
          </div>
          
          {/* Dicas de performance */}
          {!isUsingCache && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
              💡 <strong>Dica:</strong> Após o primeiro carregamento, os dados ficam em cache para acesso mais rápido!
            </div>
          )}
          
          <div className="mt-6 text-xs text-gray-500">
            Sistema de Consulta de Journals Acadêmicos
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
