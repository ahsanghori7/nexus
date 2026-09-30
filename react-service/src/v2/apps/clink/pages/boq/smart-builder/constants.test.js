import {
  PDF_MAX_SIZE_MB,
  EXCEL_MAX_SIZE_MB,
  CSV_MAX_SIZE_MB,
  TXT_MAX_SIZE_MB,
  ACCEPTED_EXTENSIONS,
  EXTENSION_TO_MAX_MB,
  MAX_FILE_SIZE_BYTES_BY_EXTENSION,
} from './constants';

describe('smart-builder/constants', () => {
  it('exports expected max size values in MB', () => {
    expect(PDF_MAX_SIZE_MB).toBe(20);
    expect(EXCEL_MAX_SIZE_MB).toBe(2);
    expect(CSV_MAX_SIZE_MB).toBe(0.5);
    expect(TXT_MAX_SIZE_MB).toBe(0.3);
  });

  it('exports accepted extensions in expected order', () => {
    expect(ACCEPTED_EXTENSIONS).toEqual(['pdf', 'xlsx', 'xls', 'csv', 'txt']);
  });

  it('maps each extension to the expected MB limit', () => {
    expect(EXTENSION_TO_MAX_MB).toEqual({
      pdf: 20,
      xlsx: 2,
      xls: 2,
      csv: 0.5,
      txt: 0.3,
    });
  });

  it('converts MB limits into floored byte limits', () => {
    expect(MAX_FILE_SIZE_BYTES_BY_EXTENSION).toEqual({
      pdf: Math.floor(20 * 1024 * 1024),
      xlsx: Math.floor(2 * 1024 * 1024),
      xls: Math.floor(2 * 1024 * 1024),
      csv: Math.floor(0.5 * 1024 * 1024),
      txt: Math.floor(0.3 * 1024 * 1024),
    });
  });
});
