import columns from './column';

describe('clink table columns', () => {
  it('should export columns array', () => {
    expect(Array.isArray(columns)).toBe(true);
    expect(columns.length).toBeGreaterThan(0);
  });

  it('should have valid column structure', () => {
    columns.forEach((column) => {
      expect(column).toBeInstanceOf(Object);
      expect(column).toHaveProperty('key');
      expect(typeof column.key).toBe('string');

      if (column.label !== undefined) {
        expect(typeof column.label).toBe('string');
      }

      if (column.width !== undefined) {
        expect(typeof column.width).toBe('number');
        expect(column.width).toBeGreaterThan(0);
      }

      if (column.alignHeader !== undefined) {
        expect(['left', 'center', 'right']).toContain(column.alignHeader);
      }

      if (column.alignColumns !== undefined) {
        expect(['left', 'center', 'right']).toContain(column.alignColumns);
      }

      if (column.sortMethod !== undefined) {
        expect(typeof column.sortMethod).toBe('string');
        expect(['text', 'number', 'date']).toContain(column.sortMethod);
      }
    });
  });

  it('should have name column as first column', () => {
    expect(columns[0]).toEqual({
      alignHeader: 'left',
      alignColumns: 'left',
      key: 'name',
      label: 'Name',
      sortMethod: 'text',
      width: 30,
    });
  });

  it('should have unique keys for all columns', () => {
    const keys = columns.map((column) => column.key);
    const uniqueKeys = [...new Set(keys)];
    expect(keys.length).toBe(uniqueKeys.length);
  });

  it('should have valid sort methods', () => {
    const sortableColumns = columns.filter(
      (col) => col.sortMethod !== undefined,
    );
    const validSortMethods = ['text', 'number', 'date'];

    sortableColumns.forEach((col) => {
      expect(validSortMethods).toContain(col.sortMethod);
    });
  });

  it('should have consistent alignment values', () => {
    const alignedColumns = columns.filter(
      (col) => col.alignHeader || col.alignColumns,
    );
    const validAlignments = ['left', 'center', 'right'];

    alignedColumns.forEach((col) => {
      if (col.alignHeader) {
        expect(validAlignments).toContain(col.alignHeader);
      }
      if (col.alignColumns) {
        expect(validAlignments).toContain(col.alignColumns);
      }
    });
  });

  it('should have width values within reasonable range', () => {
    const columnsWithWidth = columns.filter((col) => col.width !== undefined);

    columnsWithWidth.forEach((col) => {
      expect(typeof col.width).toBe('number');
      expect(col.width).toBeGreaterThan(0);
      expect(col.width).toBeLessThanOrEqual(100); // Assuming percentage widths
    });
  });

  it('should have all required properties for table rendering', () => {
    columns.forEach((col, index) => {
      // Every column should have at least a key
      expect(col.key).toBeDefined();
      expect(col.key.length).toBeGreaterThan(0);

      // Most columns should have labels
      if (col.label === undefined) {
        console.warn(`Column at index ${index} missing label`); // eslint-disable-line no-console
      }
    });
  });
});
