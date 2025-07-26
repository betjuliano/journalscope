/**
 * Sistema de preload para componentes críticos
 * Carrega componentes em background para melhorar performance
 */

// Preload de componentes críticos
export const preloadCriticalComponents = () => {
  // Preload do componente principal em background
  import('../components/JournalSearchApp').catch(err => {
    console.warn('Failed to preload JournalSearchApp:', err);
  });

  // Preload da tabela otimizada
  import('../components/OptimizedResultsTable').catch(err => {
    console.warn('Failed to preload OptimizedResultsTable:', err);
  });

  // Preload dos utilitários de exportação
  import('../../utils/exportUtils').catch(err => {
    console.warn('Failed to preload exportUtils:', err);
  });
};

// Preload de dados não críticos
export const preloadNonCriticalData = () => {
  // Preload de traduções não críticas
  import('../translations/pt-noncritical').catch(err => {
    console.warn('Failed to preload pt-noncritical:', err);
  });

  import('../translations/en-noncritical').catch(err => {
    console.warn('Failed to preload en-noncritical:', err);
  });
};

// Preload baseado em interação do usuário
export const preloadOnUserInteraction = () => {
  // Preload quando usuário interage com a página
  const preloadOnce = () => {
    preloadNonCriticalData();
    document.removeEventListener('click', preloadOnce);
    document.removeEventListener('keydown', preloadOnce);
    document.removeEventListener('scroll', preloadOnce);
  };

  document.addEventListener('click', preloadOnce, { once: true, passive: true });
  document.addEventListener('keydown', preloadOnce, { once: true, passive: true });
  document.addEventListener('scroll', preloadOnce, { once: true, passive: true });
};

// Preload inteligente baseado em connection
export const intelligentPreload = () => {
  if ('connection' in navigator) {
    const connection = navigator.connection;
    
    // Só faz preload em conexões rápidas
    if (connection.effectiveType === '4g' && !connection.saveData) {
      setTimeout(preloadCriticalComponents, 1000);
      setTimeout(preloadNonCriticalData, 3000);
    }
  } else {
    // Fallback para navegadores sem Network Information API
    setTimeout(preloadCriticalComponents, 2000);
  }
};