const XLSX = require('xlsx');

export const SPREADSHEET_EXTENSIONS = ['xlsx', 'xls'];

export const isSpreadsheetExtension = (ext) =>
  SPREADSHEET_EXTENSIONS.includes(String(ext).toLowerCase());

/**
 * Reads sheet (tab) names from an Excel file, client-side, without an upload round-trip.
 * @param {File} file
 * @returns {Promise<string[]>}
 */
export const readWorkbookSheetNames = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  return workbook.SheetNames || [];
};
