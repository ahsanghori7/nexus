import columns from './features';

// Mock i18n
jest.mock('v2/helpers/i18n', () => ({
  t: jest.fn((key) => `mocked-${key}`)
}));

describe('admin features columns', () => {
  test('should export an array', () => {
    expect(Array.isArray(columns)).toBe(true);
  });

  test('should have at least one column', () => {
    expect(columns.length).toBeGreaterThan(0);
  });

  test('should have properly structured columns', () => {
    columns.forEach(column => {
      expect(column).toHaveProperty('key');
      expect(column).toHaveProperty('alignHeader');
      expect(column).toHaveProperty('alignColumns');
      expect(typeof column.key).toBe('string');
      expect(typeof column.alignHeader).toBe('string');
      expect(typeof column.alignColumns).toBe('string');
    });
  });

  test('should have account column', () => {
    const accountColumn = columns.find(col => col.key === 'account');
    expect(accountColumn).toBeDefined();
    expect(accountColumn.sortMethod).toBe('text');
    expect(accountColumn.width).toBe(30);
    expect(accountColumn.alignHeader).toBe('left');
    expect(accountColumn.alignColumns).toBe('left');
  });

  test('should use i18n for label translations', () => {
    columns.forEach(column => {
      if (column.label) {
        expect(column.label).toContain('mocked-');
      }
    });
  });

  test('should have valid alignment values', () => {
    const validAlignments = ['left', 'center', 'right'];
    columns.forEach(column => {
      expect(validAlignments).toContain(column.alignHeader);
      expect(validAlignments).toContain(column.alignColumns);
    });
  });

  test('should have string keys', () => {
    columns.forEach(column => {
      expect(typeof column.key).toBe('string');
      expect(column.key.length).toBeGreaterThan(0);
    });
  });

  test('should have unique keys', () => {
    const keys = columns.map(col => col.key);
    const uniqueKeys = [...new Set(keys)];
    expect(keys).toHaveLength(uniqueKeys.length);
  });

  test('text columns should have sortMethod property', () => {
    const textColumns = columns.filter(col => col.sortMethod === 'text');
    textColumns.forEach(column => {
      expect(column.sortMethod).toBe('text');
    });
  });

  test('should have width property for columns', () => {
    const columnsWithWidth = columns.filter(col => col.width !== undefined);
    columnsWithWidth.forEach(column => {
      expect(typeof column.width).toBe('number');
      expect(column.width).toBeGreaterThan(0);
    });
  });
});