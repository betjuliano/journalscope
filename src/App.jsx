import React from 'react';
import { useEmbeddedData } from '../hooks';
import JournalSearchApp from './components/JournalSearchApp';
import LoadingScreen from './components/LoadingScreen';
import ErrorScreen from './components/ErrorScreen';
import './components/index.css';

function App() {
  const {
    isLoading,
    error,
    stats,
    journalsData,
    // filtros e funções podem ser passados para o JournalSearchApp se necessário
  } = useEmbeddedData();

  if (isLoading) {
    return (
      <LoadingScreen 
        processingStatus={"Carregando dados embarcados..."}
        dataSource={{
          abdc: { count: stats.withABDC || 0, loaded: !!stats.withABDC },
          abs: { count: stats.withABS || 0, loaded: !!stats.withABS },
          jcr: { count: stats.withJCR || 0, loaded: !!stats.withJCR },
          sjr: { count: stats.withSJR || 0, loaded: !!stats.withSJR },
          citeScore: { count: stats.withCiteScore || 0, loaded: !!stats.withCiteScore },
          wiley: { count: stats.withWiley || 0, loaded: !!stats.withWiley },
          predatory: { count: stats.withPredatory || 0, loaded: !!stats.withPredatory }
        }}
      />
    );
  }

  if (error) {
    return <ErrorScreen error={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="App">
      <JournalSearchApp />
    </div>
  );
}

export default App;
