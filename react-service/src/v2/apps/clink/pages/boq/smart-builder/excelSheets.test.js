import { isSpreadsheetExtension, readWorkbookSheetNames } from './excelSheets';

jest.mock('xlsx', () => ({
  read: jest.fn(),
}));

// eslint-disable-next-line global-require
const XLSX = require('xlsx');

describe('smart-builder/excelSheets', () => {
  describe('isSpreadsheetExtension', () => {
    it('is true for xlsx/xls (any case)', () => {
      expect(isSpreadsheetExtension('xlsx')).toBe(true);
      expect(isSpreadsheetExtension('XLS')).toBe(true);
    });

    it('is false for non-spreadsheet extensions', () => {
      expect(isSpreadsheetExtension('csv')).toBe(false);
      expect(isSpreadsheetExtension('pdf')).toBe(false);
      expect(isSpreadsheetExtension('txt')).toBe(false);
    });
  });

  describe('readWorkbookSheetNames', () => {
    afterEach(() => {
      XLSX.read.mockReset();
    });

    it('resolves with the workbook sheet names', async () => {
      XLSX.read.mockReturnValue({ SheetNames: ['Bill 1', 'Bill 2'] });

      const names = await readWorkbookSheetNames(new File(['x'], 'f.xlsx'));
      expect(XLSX.read).toHaveBeenCalledWith(expect.any(ArrayBuffer), { type: 'array' });
      expect(names).toEqual(['Bill 1', 'Bill 2']);
    });

    it('resolves with an empty array when the workbook has no SheetNames', async () => {
      XLSX.read.mockReturnValue({});

      const names = await readWorkbookSheetNames(new File(['x'], 'f.xlsx'));
      expect(names).toEqual([]);
    });

    it('rejects when XLSX.read throws (corrupt file)', async () => {
      XLSX.read.mockImplementation(() => {
        throw new Error('corrupt');
      });

      await expect(
        readWorkbookSheetNames(new File(['x'], 'f.xlsx'))
      ).rejects.toThrow('corrupt');
    });

    it('rejects when the file cannot be read', async () => {
      const file = new File(['x'], 'f.xlsx');
      jest.spyOn(file, 'arrayBuffer').mockRejectedValue(new Error('read failed'));

      await expect(readWorkbookSheetNames(file)).rejects.toThrow('read failed');
    });
  });
});
