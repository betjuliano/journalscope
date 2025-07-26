// Non-critical Portuguese translations for progressive loading
export default {
  filters: {
    quickFilters: {
      topTier: '🏆 Top Tier (A* + 4*)',
      highQuality: '⭐ Alta Qualidade (A + 4)',
      qualisMB: '🥇 Qualis MB',
      qualisB: '🥈 Qualis B',
      wileyOnly: '📚 Apenas Wiley',
      excludePredatory: '🚫 Excluir Predatórios',
      clearFilters: '🔄 Limpar Filtros'
    },
    
    search: {
      history: 'HISTÓRICO DE BUSCAS'
    },
    
    abdc: {
      label: 'Classificação ABDC',
      all: 'Todas'
    },
    
    abs: {
      label: 'Classificação ABS',
      all: 'Todas'
    },
    
    sjr: {
      label: 'SJR Quartil',
      all: 'Todos'
    },
    
    wiley: {
      label: 'Apenas Wiley'
    },
    
    stats: {
      label: 'Stats'
    }
  },
  
  table: {
    columnSettings: {
      title: 'Colunas',
      optionalColumns: 'Colunas Opcionais',
      close: 'Fechar',
      configure: 'Configurar colunas'
    },
    
    sorting: {
      sortedBy: 'Ordenado por:',
      ascending: '(crescente)',
      descending: '(descendente)',
      currentlySorted: 'Atualmente ordenado',
      clickToReverse: 'Clique para inverter ordem',
      clickToSort: 'Clique para ordenar por esta coluna',
      sorted: 'Ordenado',
      notSorted: 'Não ordenado'
    },
    
    filteredFrom: 'filtrados de {total} total',
    loadMore: 'Carregar mais resultados',
    
    actionButtons: {
      expand: 'Expandir',
      collapse: 'Recolher',
      export: 'Exportar',
      details: 'Detalhes'
    },
    
    journalCell: {
      expandTitle: 'Expandir nome completo do journal',
      collapseTitle: 'Recolher nome do journal',
      expandLabel: 'Expandir nome completo do journal {name}',
      collapseLabel: 'Recolher nome completo do journal {name}',
      expandedDescription: 'Journal expandido mostrando nome completo: {name}. Clique no botão menos ou pressione Enter para recolher.',
      truncatedDescription: 'Journal truncado mostrando apenas parte do nome. Nome completo: {name}. Clique no botão mais ou pressione Enter para expandir.',
      expandedAriaLabel: 'Journal: {name}. Expandido, pressione Enter ou espaço para recolher',
      truncatedAriaLabel: 'Journal: {name}. Truncado, pressione Enter ou espaço para ver nome completo',
      fullNameVisible: 'Nome completo do journal visível: {name}',
      truncatedHelp: 'Nome do journal truncado. Para ver o nome completo "{name}", use o botão de expansão.'
    },
    
    description: 'Tabela de journals acadêmicos com classificações ABDC, ABS, SJR, JCR e Qualis. Use as setas do teclado para navegar e Enter para interagir com elementos.',
    selectedJournals: '{count} journals selecionados.',
    actionsColumnLabel: 'Ações disponíveis para cada journal',
    actionsLabel: 'Ações disponíveis para este journal',
    actionsGroupLabel: 'Ações para journal {name}'
  },
  
  statsPanel: {
    title: 'Estatísticas do Banco de Dados',
    general: {
      total: 'Total de Journals',
      withABDC: 'Com ABDC',
      withABS: 'Com ABS',
      withJCR: 'Com JCR',
      withSJR: 'Com SJR',
      withCiteScore: 'Com CiteScore',
      withWiley: 'Wiley',
      withPredatory: 'Predatórios',
      completeBase: 'Base completa',
      ofTotal: 'do total',
      journals: 'journals'
    },
    
    distributions: {
      abdc: 'Distribuição ABDC',
      abs: 'Distribuição ABS',
      sjr: '🎯 Distribuição SJR',
      quality: '⭐ Qualidade dos Journals',
      coverage: '📋 Cobertura por Base',
      qualis: '🏆 Resumo Qualis'
    },
    
    quality: {
      high: 'Alta',
      medium: 'Média',
      low: 'Baixa',
      explanation: 'Como é calculada:',
      highDesc: 'Alta: 3+ fontes de dados',
      mediumDesc: 'Média: 2 fontes de dados',
      lowDesc: 'Baixa: 1 fonte de dados',
      sources: 'Fontes: ABDC, ABS, JCR, SJR, CiteScore, Wiley, Predatory'
    },
    
    dataSourcesStatus: 'Status das Fontes de Dados',
    loaded: 'Carregado',
    notLoaded: 'Não carregado',
    classificationsComparison: 'Comparação de Classificações',
    bothClassifications: 'Journals com ambas classificações',
    singleClassification: 'Apenas uma classificação',
    abdcPlusAbs: 'ABDC + ABS',
    onlyAbdcOrAbs: 'Somente ABDC ou ABS',
    distributionABDC: 'Distribuição ABDC',
    distributionABS: 'Distribuição ABS',
    export: 'Exportar',
    overview: 'Visão Geral',
    classifications: 'Classificações',
    lastUpdate: 'Última atualização',
    totalWiley: 'Total Wiley',
    journalsInWiley: 'Journals na Wiley',
    withAPC: 'Com APC',
    thematicAreas: 'Áreas temáticas',
    coverage: 'Cobertura',
    topThematicAreas: 'Top Áreas Temáticas (Wiley)',
    tabs: {
      overview: 'Visão Geral',
      classifications: 'Classificações',
      wiley: 'Wiley'
    }
  },
  
  labels: {
    abdcClassification: 'Classificação ABDC',
    absClassification: 'Classificação ABS',
    sjrQuartile: 'SJR Quartil',
    wileyOnly: 'Apenas Wiley',
    all: 'Todas',
    allQuartiles: 'Todos',
    classification: 'Classificação'
  },
  
  categories: {
    selectedCategories: 'Categorias Selecionadas:',
    loadMore: 'Carregar mais 100 journals'
  },
  
  dataSources: {
    title: 'Fontes de Dados e Atualizações',
    updated: 'Atualização',
    updatedOn: 'Atualizado em',
    abdc: 'Atualização 2022 - 2025 previsto Outubro 2025',
    wiley: 'Termo convênio Capes 2025',
    jcr: 'JCR',
    sjr: 'SJR - 2024',
    citeScore: 'CiteScore - Scopus',
    abs: 'ABS - 2024'
  },
  
  search: {
    term: 'termo'
  },
  
  footer: {
    developedBy: 'Desenvolvido por',
    contact: 'Contato',
    email: 'juliano.alves@ufsm.br',
    lastUpdate: 'Última atualização:',
    version: 'JournalScope v1.0.0',
    predatory: 'Predatório'
  },
  
  loading: {
    databases: {
      abdc: 'ABDC Database',
      abs: 'ABS Database', 
      jcr: 'JCR Database',
      sjr: 'SJR Database',
      citeScore: 'CiteScore Database',
      wiley: 'Wiley Database',
      predatory: 'Predatory Journals'
    }
  },
  
  error: {
    types: {
      file: 'Arquivos não Encontrados',
      data: 'Erro nos Dados',
      network: 'Erro de Conexão',
      general: 'Erro no Carregamento'
    },
    suggestions: {
      file: [
        'Verifique se os arquivos Excel estão na pasta "data/"',
        'Confirme os nomes: ABDC2022.xlsx, ABS2024.xlsx, Wiley.xlsx',
        'Certifique-se de que os arquivos não estão corrompidos'
      ],
      data: [
        'Verifique se as planilhas têm as abas corretas',
        'Confirme se os dados estão no formato esperado',
        'Tente recarregar os dados'
      ],
      network: [
        'Verifique sua conexão com a internet',
        'Tente recarregar a página',
        'Aguarde um momento e tente novamente'
      ],
      general: [
        'Tente recarregar a aplicação',
        'Verifique o console do navegador (F12)',
        'Contacte o suporte se o problema persistir'
      ]
    },
    possibleSolutions: 'Possíveis soluções:',
    expectedFiles: 'Arquivos Esperados:'
  },
  
  export: {
    csv: 'Exportar CSV',
    excel: 'Exportar Excel',
    success: 'Dados exportados com sucesso!',
    error: 'Erro na exportação: {message}'
  },
  
  accessibility: {
    languageToggle: 'Alternar idioma para inglês',
    searchInput: 'Campo de busca de journals',
    filterSelect: 'Filtro de seleção',
    tableSort: 'Ordenar tabela por {column}',
    expandJournal: 'Expandir informações do journal',
    collapseJournal: 'Recolher informações do journal'
  }
};