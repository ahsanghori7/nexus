import columns from './customer_health_score';

describe('admin customer_health_score columns', () => {
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
    expect(accountColumn.label).toBe('Account');
    expect(accountColumn.sortMethod).toBe('text');
    expect(accountColumn.width).toBe(15);
    expect(accountColumn.alignHeader).toBe('left');
    expect(accountColumn.alignColumns).toBe('left');
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

  test('should have width property for some columns', () => {
    const columnsWithWidth = columns.filter(col => col.width !== undefined);
    columnsWithWidth.forEach(column => {
      expect(typeof column.width).toBe('number');
      expect(column.width).toBeGreaterThan(0);
    });
  });

  test('should have labels for columns', () => {
    const columnsWithLabels = columns.filter(col => col.label !== undefined);
    columnsWithLabels.forEach(column => {
      expect(typeof column.label).toBe('string');
      expect(column.label.length).toBeGreaterThan(0);
    });
  });
});