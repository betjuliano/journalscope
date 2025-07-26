import { useState, useEffect } from 'react';

/**
 * Hook para carregamento lazy dos dados de journals
 * Carrega os dados apenas quando necessário para otimizar o bundle inicial
 */
export const useLazyJournalData = () => {
  const [journalsData, setJournalsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadJournalData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Dynamic import para carregar os dados apenas quando necessário
        const { default: embeddedJournals } = await import('../data/embeddedJournals.js');
        
        if (isMounted) {
          setJournalsData(embeddedJournals);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error loading journal data:', err);
        if (isMounted) {
          setError(err);
          setIsLoading(false);
        }
      }
    };

    loadJournalData();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    journalsData,
    isLoading,
    error
  };
};

export default useLazyJournalData;