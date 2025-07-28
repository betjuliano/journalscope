// English translations for JournalScope
export default {
  hero: {
    title: 'JournalScope',
    subtitle: 'Integrated Academic Journal Query System',
    description: 'Unified platform for querying and analyzing academic journals with consolidated data from multiple international classification databases, including ABDC, ABS, JCR, SJR, CiteScore and Wiley.'
  },
  
  stats: {
    totalJournals: 'Total Journals',
    withABDC: 'ABDC',
    withABS: 'ABS',
    withJCR: 'JCR',
    withSJR: 'SJR',
    withCiteScore: 'CiteScore',
    withWiley: 'Wiley',
    withPredatory: 'Predatory'
  },
  
  filters: {
    quickFilters: {
      topTier: '🏆 Top Tier (A* + 4*)',
      highQuality: '⭐ High Quality (A + 4)',
      qualisMB: '🥇 Qualis MB',
      qualisB: '🥈 Qualis B',
      wileyOnly: '📚 Wiley Only',
      excludePredatory: '🚫 Exclude Predatory',
      clearFilters: '🔄 Clear Filters'
    },
    
    search: {
      label: 'Search Journal',
      placeholder: 'Type journal name...',
      history: 'SEARCH HISTORY'
    },
    
    abdc: {
      label: 'ABDC Classification',
      all: 'All'
    },
    
    abs: {
      label: 'ABS Classification',
      all: 'All'
    },
    
    sjr: {
      label: 'SJR Quartile',
      all: 'All'
    },
    
    wiley: {
      label: 'Wiley Only'
    },
    
    stats: {
      label: 'Stats'
    }
  },
  
  table: {
    actions: 'Actions',
    columns: {
      journal: 'Journal',
      abdc: 'ABDC',
      abs: 'ABS',
      sjrQuartile: 'SJR Quartile',
      jcrQuartile: 'JCR Quartile',
      qualis: 'Qualis',
      sjrHIndex: 'SJR H-Index'
    },
    
    columnSettings: {
      title: 'Columns',
      optionalColumns: 'Optional Columns',
      close: 'Close',
      configure: 'Columns Settings'
    },
    
    sorting: {
      sortedBy: 'Sorted by:',
      ascending: '(ascending)',
      descending: '(descending)',
      currentlySorted: 'Currently sorted',
      clickToReverse: 'Click to reverse order',
      clickToSort: 'Click to sort by this column',
      sorted: 'Sorted',
      notSorted: 'Not sorted'
    },
    
    noResults: 'No journals found with the applied filters.',
    showingResults: 'Showing {count} of {total} journals',
    filteredFrom: 'filtered from {total} total',
    loadMore: 'Load more results',
    results: 'Results ({count} journals)',
    
    actionButtons: {
      expand: 'Expand',
      collapse: 'Collapse',
      export: 'Export',
      details: 'Details'
    },
    
    journalCell: {
      expandTitle: 'Expand full journal name',
      collapseTitle: 'Collapse journal name',
      expandLabel: 'Expand full journal name {name}',
      collapseLabel: 'Collapse full journal name {name}',
      expandedDescription: 'Journal expanded showing full name: {name}. Click the minus button or press Enter to collapse.',
      truncatedDescription: 'Journal truncated showing only part of the name. Full name: {name}. Click the plus button or press Enter to expand.',
      expandedAriaLabel: 'Journal: {name}. Expanded, press Enter or space to collapse',
      truncatedAriaLabel: 'Journal: {name}. Truncated, press Enter or space to see full name',
      fullNameVisible: 'Full journal name visible: {name}',
      truncatedHelp: 'Journal name truncated. To see the full name "{name}", use the expand button.'
    },
    
    description: 'Academic journals table with ABDC, ABS, SJR, JCR and Qualis classifications. Use keyboard arrows to navigate and Enter to interact with elements.',
    selectedJournals: '{count} journals selected.',
    actionsColumnLabel: 'Available actions for each journal',
    actionsLabel: 'Available actions for this journal',
    actionsGroupLabel: 'Actions for journal {name}'
  },
  
  statsPanel: {
    title: 'Database Statistics',
    general: {
      total: 'Total Journals',
      withABDC: 'With ABDC',
      withABS: 'With ABS',
      withJCR: 'With JCR',
      withSJR: 'With SJR',
      withCiteScore: 'With CiteScore',
      withWiley: 'Wiley',
      withPredatory: 'Predatory',
      completeBase: 'Complete database',
      ofTotal: 'of total',
      journals: 'journals'
    },
    
    distributions: {
      abdc: 'ABDC Distribution',
      abs: 'ABS Distribution',
      sjr: '🎯 SJR Distribution',
      quality: '⭐ Journal Quality',
      coverage: '📋 Coverage by Database',
      qualis: '🏆 Qualis Summary'
    },
    
    quality: {
      high: 'High',
      medium: 'Medium',
      low: 'Low',
      explanation: 'How it\'s calculated:',
      highDesc: 'High: 3+ data sources',
      mediumDesc: 'Medium: 2 data sources',
      lowDesc: 'Low: 1 data source',
      sources: 'Sources: ABDC, ABS, JCR, SJR, CiteScore, Wiley, Predatory'
    },
    
    dataSourcesStatus: 'Data Sources Status',
    loaded: 'Loaded',
    notLoaded: 'Not loaded',
    classificationsComparison: 'Classifications Comparison',
    bothClassifications: 'Journals with both classifications',
    singleClassification: 'Single classification only',
    abdcPlusAbs: 'ABDC + ABS',
    onlyAbdcOrAbs: 'ABDC or ABS only',
    distributionABDC: 'ABDC Distribution',
    distributionABS: 'ABS Distribution',
    export: 'Export',
    overview: 'Overview',
    classifications: 'Classifications',
    lastUpdate: 'Last update',
    totalWiley: 'Total Wiley',
    journalsInWiley: 'Journals in Wiley',
    withAPC: 'With APC',
    thematicAreas: 'Thematic areas',
    coverage: 'Coverage',
    topThematicAreas: 'Top Thematic Areas (Wiley)',
    tabs: {
      overview: 'Overview',
      classifications: 'Classifications',
      wiley: 'Wiley'
    },
    title: 'Database Statistics'
  },
  
  labels: {
    abdcClassification: 'ABDC Classification',
    absClassification: 'ABS Classification',
    sjrQuartile: 'SJR Quartile',
    wileyOnly: 'Wiley Only',
    all: 'All',
    allQuartiles: 'All',
    classification: 'Classification'
  },
  
  categories: {
    selectedCategories: 'Selected Categories:',
    loadMore: 'Load 100 more journals'
  },
  
  dataSources: {
    title: 'Data Sources and Updates',
    updated: 'Updated',
    updatedOn: 'Updated',
    abdc: 'Updated 2022 - 2025 expected October 2025',
    wiley: 'Capes agreement term 2025',
    jcr: 'JCR',
    sjr: 'SJR - 2024',
    citeScore: 'CiteScore - Scopus',
    abs: 'ABS - 2024'
  },
  
  search: {
    term: 'term'
  },
  
  footer: {
    developedBy: 'Developed by',
    contact: 'Contact',
    email: 'juliano.alves@ufsm.br',
    lastUpdate: 'Last update:',
    version: 'JournalScope v1.0.0',
    predatory: 'Predatory'
  },
  
  loading: {
    title: 'Loading JournalScope',
    titleFast: 'JournalScope ⚡',
    processingData: 'Loading embedded data...',
    loadingTranslations: 'Loading translations...',
    fastLoadingEnabled: 'Fast loading enabled!',
    loadingStatus: 'Loading...',
    journalsLoaded: 'journals ✓',
    performanceTip: '💡 Tip: After the first load, data is cached for faster access!',
    systemDescription: 'Academic Journal Query System',
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
    title: 'Error loading data',
    retry: 'Try again',
    translationError: 'Error loading translations',
    unknownError: 'Unknown error during loading',
    types: {
      file: 'Files Not Found',
      data: 'Data Error',
      network: 'Connection Error',
      general: 'Loading Error'
    },
    suggestions: {
      file: [
        'Check if Excel files are in the "data/" folder',
        'Confirm the names: ABDC2022.xlsx, ABS2024.xlsx, Wiley.xlsx',
        'Make sure the files are not corrupted'
      ],
      data: [
        'Check if spreadsheets have the correct tabs',
        'Confirm if data is in the expected format',
        'Try reloading the data'
      ],
      network: [
        'Check your internet connection',
        'Try reloading the page',
        'Wait a moment and try again'
      ],
      general: [
        'Try reloading the application',
        'Check the browser console (F12)',
        'Contact support if the problem persists'
      ]
    },
    possibleSolutions: 'Possible solutions:',
    expectedFiles: 'Expected Files:'
  },
  
  export: {
    csv: 'Export CSV',
    excel: 'Export Excel',
    success: 'Data exported successfully!',
    error: 'Export error: {message}'
  },
  
  accessibility: {
    languageToggle: 'Switch language to Portuguese',
    searchInput: 'Journal search field',
    filterSelect: 'Filter selection',
    tableSort: 'Sort table by {column}',
    expandJournal: 'Expand journal information',
    collapseJournal: 'Collapse journal information'
  }
};