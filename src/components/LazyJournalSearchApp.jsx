import React, { Suspense, lazy } from 'react';
import LoadingScreen from './LoadingScreen';
import ErrorScreen from './ErrorScreen';

// Lazy load do componente principal para reduzir bundle inicial
const JournalSearchApp = lazy(() => import('./JournalSearchApp'));

/**
 * Wrapper com lazy loading para o componente principal
 * Reduz o tamanho do bundle inicial carregando apenas quando necessário
 */
const LazyJournalSearchApp = () => {
  return (
    <Suspense 
      fallback={
        <LoadingScreen 
          processingStatus="Carregando aplicação..."
          dataSource={{
            abdc: { count: 0, loaded: false },
            abs: { count: 0, loaded: false },
            jcr: { count: 0, loaded: false },
            sjr: { count: 0, loaded: false },
            citeScore: { count: 0, loaded: false },
            wiley: { count: 0, loaded: false },
            predatory: { count: 0, loaded: false }
          }}
        />
      }
    >
      <JournalSearchApp />
    </Suspense>
  );
};

export default LazyJournalSearchApp;