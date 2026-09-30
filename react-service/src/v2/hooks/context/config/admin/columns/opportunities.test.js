import columns from './opportunities';

// Mock i18next
jest.mock('v2/helpers/i18n', () => ({
  t: jest.fn((key) => `mocked-${key}`)
}));

describe('admin opportunities columns', () => {
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

  test('should have project_package column', () => {
    const projectPackageColumn = columns.find(col => col.key === 'project_package');
    expect(projectPackageColumn).toBeDefined();
    expect(projectPackageColumn.alignHeader).toBe('left');
    expect(projectPackageColumn.alignColumns).toBe('left');
  });

  test('should use i18next for label translations', () => {
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

  test('columns with sortMethod should have valid sort methods', () => {
    const validSortMethods = ['text', 'number', 'date'];
    columns.forEach(column => {
      if (column.sortMethod) {
        expect(validSortMethods).toContain(column.sortMethod);
      }
    });
  });

  test('should have width property for some columns', () => {
    const columnsWithWidth = columns.filter(col => col.width !== undefined);
    columnsWithWidth.forEach(column => {
      expect(typeof column.width).toBe('number');
      expect(column.width).toBeGreaterThan(0);
    });
  });

  test('date columns should have format property', () => {
    const dateColumns = columns.filter(col => col.type === 'date');
    dateColumns.forEach(column => {
      expect(column.format).toBeDefined();
      expect(typeof column.format).toBe('string');
    });
  });
});