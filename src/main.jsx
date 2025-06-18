import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './components/index.css';

// Configurações globais para JournalScope
window.JOURNALSCOPE_CONFIG = {
  version: '1.0.0',
  buildDate: new Date().toISOString(),
  environment: import.meta.env.MODE || 'development',
  features: {
    analytics: false,
    serviceWorker: true,
    darkMode: true,
    fileAccess: typeof window.fs !== 'undefined'
  }
};

// Detecção de recursos do navegador
window.BROWSER_SUPPORT = {
  fileReader: typeof FileReader !== 'undefined',
  localStorage: typeof Storage !== 'undefined',
  serviceWorker: 'serviceWorker' in navigator,
  clipboard: navigator.clipboard !== undefined,
  webShare: navigator.share !== undefined,
  webAssembly: typeof WebAssembly !== 'undefined'
};

// Log de informações (apenas em desenvolvimento)
if (import.meta.env.DEV) {
  console.log('🔬 JournalScope v1.0.0 - Starting...');
  console.log('Browser Support:', window.BROWSER_SUPPORT);
  console.log('Config:', window.JOURNALSCOPE_CONFIG);
}

// Função para simular window.fs se não estiver disponível
if (typeof window.fs === 'undefined') {
  console.warn('window.fs not available, using fallback');
  window.fs = {
    readFile: async (path, options = {}) => {
      try {
        const response = await fetch(path);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${path}: ${response.status}`);
        }
        
        if (options.encoding === 'utf8') {
          return await response.text();
        }
        
        const buffer = await response.arrayBuffer();
        return new Uint8Array(buffer);
      } catch (error) {
        throw new Error(`File read error: ${error.message}`);
      }
    }
  };
}

// Criar root do React
const root = ReactDOM.createRoot(document.getElementById('root'));

// Renderizar aplicação
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Registrar Service Worker (apenas em produção)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
        
        // Verificar por atualizações
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Nova versão disponível
              if (window.confirm('Nova versão disponível! Recarregar para atualizar?')) {
                window.location.reload();
              }
            }
          });
        });
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Tratamento de erros globais
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  
  // Em desenvolvimento, mostrar erro na tela
  if (import.meta.env.DEV) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #fee;
      border: 1px solid #fcc;
      padding: 10px;
      border-radius: 5px;
      z-index: 9999;
      max-width: 300px;
      font-family: monospace;
      font-size: 12px;
    `;
    errorDiv.innerHTML = `
      <strong>Error:</strong><br>
      ${event.error?.message || 'Unknown error'}<br>
      <small>${event.filename}:${event.lineno}</small>
    `;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
      document.body.removeChild(errorDiv);
    }, 10000);
  }
});

// Tratamento de promises rejeitadas
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  
  // Prevenir que o erro apareça no console como "Uncaught"
  event.preventDefault();
});

// Informações de performance (desenvolvimento)
if (import.meta.env.DEV) {
  window.addEventListener('load', () => {
    setTimeout(() => {
      const perfData = performance.getEntriesByType('navigation')[0];
      console.log('🚀 Performance Metrics:');
      console.log('- DOM Content Loaded:', Math.round(perfData.domContentLoadedEventEnd), 'ms');
      console.log('- Load Complete:', Math.round(perfData.loadEventEnd), 'ms');
      console.log('- DOM Interactive:', Math.round(perfData.domInteractive), 'ms');
    }, 1000);
  });
}
