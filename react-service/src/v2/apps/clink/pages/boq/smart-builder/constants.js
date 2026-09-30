export const PDF_MAX_SIZE_MB = 20;
export const EXCEL_MAX_SIZE_MB = 2;
export const CSV_MAX_SIZE_MB = 0.5;
export const TXT_MAX_SIZE_MB = 0.3;

export const ACCEPTED_EXTENSIONS = ['pdf', 'xlsx', 'xls', 'csv', 'txt'];

export const EXTENSION_TO_MAX_MB = {
  pdf: PDF_MAX_SIZE_MB,
  xlsx: EXCEL_MAX_SIZE_MB,
  xls: EXCEL_MAX_SIZE_MB,
  csv: CSV_MAX_SIZE_MB,
  txt: TXT_MAX_SIZE_MB,
};

export const MAX_FILE_SIZE_BYTES_BY_EXTENSION = Object.fromEntries(
  Object.entries(EXTENSION_TO_MAX_MB).map(([ext, mb]) => [
    ext,
    Math.floor(mb * 1024 * 1024),
  ])
);
