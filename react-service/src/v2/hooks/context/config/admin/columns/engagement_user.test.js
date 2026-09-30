import columns from './engagement_user';

// Mock i18next
jest.mock('v2/helpers/i18n', () => ({
  t: jest.fn((key) => `mocked-${key}`)
}));

describe('admin engagement_user columns', () => {
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

  test('should have total column', () => {
    const totalColumn = columns.find(col => col.key === 'total');
    expect(totalColumn).toBeDefined();
    expect(totalColumn.sortMethod).toBe('text');
    expect(totalColumn.width).toBe(30);
    expect(totalColumn.alignHeader).toBe('left');
    expect(totalColumn.alignColumns).toBe('left');
  });

  test('should use i18next for labels', () => {
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

  test('should have unique keys', () => {
    const keys = columns.map(col => col.key);
    const uniqueIds = [...new Set(keys)];
    expect(keys).toHaveLength(uniqueIds.length);
  });

  test('should have width properties', () => {
    const columnsWithWidth = columns.filter(col => col.width !== undefined);
    columnsWithWidth.forEach(column => {
      expect(typeof column.width).toBe('number');
      expect(column.width).toBeGreaterThan(0);
    });
  });
});