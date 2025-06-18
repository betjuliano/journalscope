import React from 'react';
import { Database, CheckCircle } from 'lucide-react';

const LoadingScreen = ({ 
  processingStatus = 'Carregando dados...', 
  dataSource = {
    abdc: { count: 0, loaded: false },
    abs: { count: 0, loaded: false },
    wiley: { count: 0, loaded: false }
  } 
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <Database className="mx-auto h-12 w-12 text-indigo-600 mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Carregando JournalScope
          </h2>
          
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          
          <p className="text-gray-600 mb-6">{processingStatus}</p>
          
          {/* Status de carregamento dos arquivos */}
          <div className="space-y-2 text-sm">
            <div className={`flex justify-between items-center p-3 rounded ${
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
            
            <div className={`flex justify-between items-center p-3 rounded ${
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
            
            <div className={`flex justify-between items-center p-3 rounded ${
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
          </div>
          
          <div className="mt-6 text-xs text-gray-500">
            Sistema de Consulta de Journals Acadêmicos
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
