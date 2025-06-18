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
          abdc: { count: stats.withABDC, loaded: !!stats.withABDC },
          abs: { count: stats.withABS, loaded: !!stats.withABS },
          wiley: { count: stats.withWiley, loaded: !!stats.withWiley }
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
