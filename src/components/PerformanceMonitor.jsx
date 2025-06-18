import React, { useState, useEffect } from 'react';
import { Clock, Zap, Database } from 'lucide-react';

const PerformanceMonitor = ({ isVisible = false }) => {
  const [metrics, setMetrics] = useState({
    loadTime: 0,
    cacheHit: false,
    dataSize: 0,
    renderTime: 0
  });

  useEffect(() => {
    // Monitorar performance da aplicação
    const startTime = performance.now();
    
    // Verificar se dados vieram do cache
    const cacheHit = localStorage.getItem('journalscope_processed_data') !== null;
    
    // Calcular tamanho dos dados em cache
    let dataSize = 0;
    try {
      const cachedData = localStorage.getItem('journalscope_processed_data');
      if (cachedData) {
        dataSize = new Blob([cachedData]).size / 1024; // KB
      }
    } catch (e) {
      // Ignorar erro
    }
    
    // Aguardar o próximo frame para calcular tempo de render
    requestAnimationFrame(() => {
      const renderTime = performance.now() - startTime;
      
      setMetrics({
        loadTime: renderTime,
        cacheHit,
        dataSize: Math.round(dataSize),
        renderTime: Math.round(renderTime)
      });
    });
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 border border-gray-200 text-xs max-w-xs">
      <div className="flex items-center gap-2 mb-2 font-medium text-gray-700">
        <Zap className="h-4 w-4" />
        Performance Monitor
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Tempo de carregamento:
          </span>
          <span className={`font-medium ${metrics.renderTime < 1000 ? 'text-green-600' : 'text-yellow-600'}`}>
            {metrics.renderTime}ms
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-1">
            <Database className="h-3 w-3" />
            Cache:
          </span>
          <span className={`font-medium ${metrics.cacheHit ? 'text-green-600' : 'text-gray-600'}`}>
            {metrics.cacheHit ? '✓ Hit' : '✗ Miss'}
          </span>
        </div>
        
        {metrics.dataSize > 0 && (
          <div className="flex justify-between items-center">
            <span>Tamanho dos dados:</span>
            <span className="font-medium text-blue-600">
              {metrics.dataSize}KB
            </span>
          </div>
        )}
        
        <div className="pt-2 border-t border-gray-100 text-center">
          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
            metrics.cacheHit ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
          }`}>
            {metrics.cacheHit ? '⚡ Carregamento rápido' : '🔄 Primeiro carregamento'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMonitor;
