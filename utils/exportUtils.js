// Removed EXPORT_CONFIG import to avoid minification issues

/**
 * Trigger a file download in the browser for the given blob
 * @param {Blob} blob
 * @param {string} filename
 */
const triggerDownload = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

/**
 * Export an array of journal objects as a CSV file
 *
 * @param {Array<Object>} data - Array with journal data
 * @param {string} [filename]
 * @param {Array<string>} [headers]
 */
export const exportAsCSV = (data, filename = 'journalscope_export.csv', headers = null) => {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Nenhum dado para exportar');
  }

  // Define default headers directly to avoid any external dependencies
  const defaultHeaders = [
    'Journal',
    'Classificação ABDC',
    'Classificação ABS',
    'SJR Quartil',
    'SJR Score',
    'H Index',
    'Documentos Citáveis',
    'JCR Impact Factor',
    'JCR Quartil',
    'CiteScore'
  ];

  const csvHeaders = headers || defaultHeaders;
  const csvRows = [];
  
  // Build header row with hardcoded comma separator and quotes
  csvRows.push(csvHeaders.map(h => '"' + String(h).replace(/"/g, '""') + '"').join(','));

  // Process data rows
  data.forEach((item) => {
    const values = [
      item.journal || '',
      item.abdc || '',
      item.abs || '',
      item.wileySubject || '',
      item.wileyAPC || '',
      item.wileyAPCGBP || '',
      item.wileyAPCEUR || ''
    ];

    // Build row with hardcoded comma separator and quotes - no variables
    const csvRow = values.map(function(value) {
      return '"' + String(value).replace(/"/g, '""') + '"';
    }).join(',');
    
    csvRows.push(csvRow);
  });

  // Join all rows with newlines
  const csvContent = csvRows.join('\n');
  
  // Create blob with hardcoded parameters
  const blob = new Blob(['\ufeff' + csvContent], { 
    type: 'text/csv;charset=utf-8' 
  });
  
  triggerDownload(blob, filename);
  return true;
};

/**
 * Export data as a JSON file. Extra metadata can be provided and will
 * be merged with default metadata information.
 *
 * @param {Array<Object>} data
 * @param {string} [filename]
 * @param {Object} [metadata]
 */
export const exportAsJSON = (data, filename = 'journalscope_export.json', metadata = {}) => {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Nenhum dado para exportar');
  }

  const meta = {
    generatedAt: new Date().toISOString(),
    totalRecords: data.length,
    ...metadata
  };

  // Use hardcoded formatting to avoid external config dependencies
  const jsonContent = JSON.stringify({ metadata: meta, journals: data }, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  triggerDownload(blob, filename);
  return true;
};

/**
 * Export data as an Excel file - DISABLED due to XLSX library conflicts
 * Falls back to CSV export to avoid QUOTE reference errors
 *
 * @param {Array<Object>} data
 * @param {string} [filename]
 * @param {Object} [options]
 */
export const exportAsExcel = async (data, filename = 'journalscope_export.xlsx', options = {}) => {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Nenhum dado para exportar');
  }

  // TEMPORARY FALLBACK: Export as CSV instead of Excel to avoid XLSX library issues
  // This prevents the QUOTE reference error in the XLSX library
  console.warn('Excel export temporarily disabled due to library conflicts. Exporting as CSV instead.');
  
  // Change filename extension to CSV
  const csvFilename = filename.replace('.xlsx', '.csv');
  
  // Use our working CSV export function
  return exportAsCSV(data, csvFilename);
};

export default {
  exportAsCSV,
  exportAsJSON,
  exportAsExcel
};
