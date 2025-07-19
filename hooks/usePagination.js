import { useState, useMemo } from 'react';

const usePagination = (data = [], itemsPerPage = 50) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(itemsPerPage);

  // Calcular dados paginados
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return data.slice(startIndex, endIndex);
  }, [data, currentPage, pageSize]);

  // Calcular informações de paginação
  const paginationInfo = useMemo(() => {
    const totalItems = data.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (currentPage - 1) * pageSize + 1;
    const endIndex = Math.min(currentPage * pageSize, totalItems);

    return {
      totalItems,
      totalPages,
      currentPage,
      pageSize,
      startIndex,
      endIndex,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1
    };
  }, [data.length, currentPage, pageSize]);

  // Função para ir para uma página específica
  const goToPage = (page) => {
    const totalPages = Math.ceil(data.length / pageSize);
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Função para ir para próxima página
  const nextPage = () => {
    if (paginationInfo.hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  };

  // Função para ir para página anterior
  const previousPage = () => {
    if (paginationInfo.hasPreviousPage) {
      setCurrentPage(prev => prev - 1);
    }
  };

  // Função para ir para primeira página
  const firstPage = () => {
    setCurrentPage(1);
  };

  // Função para ir para última página
  const lastPage = () => {
    const totalPages = Math.ceil(data.length / pageSize);
    setCurrentPage(totalPages);
  };

  // Função para alterar tamanho da página
  const changePageSize = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(1); // Reset para primeira página
  };

  // Gerar array de números de páginas para navegação
  const getPageNumbers = (maxVisible = 5) => {
    const totalPages = paginationInfo.totalPages;
    const current = currentPage;
    
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const half = Math.floor(maxVisible / 2);
    let start = Math.max(1, current - half);
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  // Reset pagination quando dados mudam
  const resetPagination = () => {
    setCurrentPage(1);
  };

  return {
    paginatedData,
    paginationInfo,
    goToPage,
    nextPage,
    previousPage,
    firstPage,
    lastPage,
    changePageSize,
    getPageNumbers,
    resetPagination
  };
};

export default usePagination;