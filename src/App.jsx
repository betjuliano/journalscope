import React from 'react';
import { useJournalData } from '../hooks';
import JournalSearchApp from './components/JournalSearchApp';
import LoadingScreen from './components/LoadingScreen';
import ErrorScreen from './components/ErrorScreen';
import './components/index.css';

function App() {
  const {
    isLoading,
    error,
    processingStatus,
    dataSource,
    reloadData
  } = useJournalData();

  if (isLoading) {
    return (
      <LoadingScreen 
        processingStatus={processingStatus}
        dataSource={dataSource}
      />
    );
  }

  if (error) {
    return <ErrorScreen error={error} onRetry={reloadData} />;
  }

  return (
    <div className="App">
      <JournalSearchApp />
    </div>
  );
}

export default App;
