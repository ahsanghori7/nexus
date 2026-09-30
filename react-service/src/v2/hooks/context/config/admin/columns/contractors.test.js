import columns from './contractors';

describe('admin contractors columns', () => {
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

  test('should have company column', () => {
    const companyColumn = columns.find(col => col.key === 'company');
    expect(companyColumn).toBeDefined();
    expect(companyColumn.sortMethod).toBe('text');
    expect(companyColumn.width).toBe(15);
    expect(companyColumn.alignHeader).toBe('left');
    expect(companyColumn.alignColumns).toBe('left');
  });

  test('should have user column', () => {
    const userColumn = columns.find(col => col.key === 'user');
    expect(userColumn).toBeDefined();
    expect(userColumn.sortMethod).toBe('text');
    expect(userColumn.width).toBe(15);
    expect(userColumn.alignHeader).toBe('left');
    expect(userColumn.alignColumns).toBe('left');
  });

  test('should have registration-date column', () => {
    const registrationDateColumn = columns.find(col => col.key === 'registration-date');
    expect(registrationDateColumn).toBeDefined();
    expect(registrationDateColumn.format).toBe('DD MMMM YYYY');
    expect(registrationDateColumn.alignHeader).toBe('left');
    expect(registrationDateColumn.alignColumns).toBe('left');
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

  test('date columns should have format property', () => {
    const dateColumns = columns.filter(col => col.format && col.format.includes('DD'));
    dateColumns.forEach(column => {
      expect(column.format).toBeDefined();
      expect(typeof column.format).toBe('string');
    });
  });
});