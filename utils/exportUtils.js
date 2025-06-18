import { EXPORT_CONFIG } from './constants';

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
export const exportAsCSV = (data, filename = 'journalscope_export.csv', headers = EXPORT_CONFIG.csv.headers) => {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Nenhum dado para exportar');
  }

  const { delimiter, quote, encoding } = EXPORT_CONFIG.csv;
  const csvRows = [];
  csvRows.push(headers.join(delimiter));

  data.forEach((item) => {
    const values = [
      item.journal,
      item.abdc || '',
      item.abs || '',
      item.wileySubject || '',
      item.wileyAPC || '',
      item.wileyAPCGBP || '',
      item.wileyAPCEUR || ''
    ];

    const row = values
      .map((v) => `${quote}${String(v).replace(/"/g, '""')}${quote}`)
      .join(delimiter);
    csvRows.push(row);
  });

  const csvContent = csvRows.join('\n');
  const blob = new Blob([`\ufeff${csvContent}`], { type: `text/csv;charset=${encoding}` });
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

  const space = EXPORT_CONFIG.json.pretty ? EXPORT_CONFIG.json.indent : undefined;
  const jsonContent = JSON.stringify({ metadata: meta, journals: data }, null, space);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  triggerDownload(blob, filename);
  return true;
};

/**
 * Export data as an Excel file using sheetjs-style.
 *
 * @param {Array<Object>} data
 * @param {string} [filename]
 * @param {Object} [options]
 */
export const exportAsExcel = async (data, filename = 'journalscope_export.xlsx', options = {}) => {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Nenhum dado para exportar');
  }

  const XLSX = await import('sheetjs-style');
  const sheetName = options.sheetName || EXPORT_CONFIG.excel.sheetName;

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  triggerDownload(blob, filename);
  return true;
};

export default {
  exportAsCSV,
  exportAsJSON,
  exportAsExcel
};
