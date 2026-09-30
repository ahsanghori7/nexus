import columns from './accounts';

describe('admin accounts columns configuration', () => {
  it('should export an array of column configurations', () => {
    expect(columns).toBeDefined();
    expect(Array.isArray(columns)).toBe(true);
    expect(columns.length).toBe(5);
  });

  it('should have company column configuration', () => {
    const companyColumn = columns[0];
    expect(companyColumn.alignHeader).toBe('left');
    expect(companyColumn.alignColumns).toBe('left');
    expect(companyColumn.key).toBe('company');
    expect(companyColumn.sortMethod).toBe('text');
    expect(companyColumn.width).toBe(30);
  });

  it('should have subscription column configuration', () => {
    const subscriptionColumn = columns[1];
    expect(subscriptionColumn.alignHeader).toBe('left');
    expect(subscriptionColumn.alignColumns).toBe('left');
    expect(subscriptionColumn.key).toBe('subscription');
    expect(subscriptionColumn.sortMethod).toBe('text');
    expect(subscriptionColumn.width).toBe(20);
  });

  it('should have first_pqq_sent column configuration', () => {
    const firstPqqColumn = columns[2];
    expect(firstPqqColumn.alignHeader).toBe('left');
    expect(firstPqqColumn.alignColumns).toBe('left');
    expect(firstPqqColumn.key).toBe('first_pqq_sent');
    expect(firstPqqColumn.type).toBe('text');
    expect(firstPqqColumn.sortMethod).toBe('text');
    expect(firstPqqColumn.width).toBe(15);
  });

  it('should have registration-date column configuration', () => {
    const dateColumn = columns[3];
    expect(dateColumn.alignHeader).toBe('left');
    expect(dateColumn.alignColumns).toBe('left');
    expect(dateColumn.format).toBe('DD MMMM YYYY');
    expect(dateColumn.key).toBe('registration-date');
    expect(dateColumn.type).toBe('date');
    expect(dateColumn.sortMethod).toBe('date');
    expect(dateColumn.width).toBe(20);
  });

  it('should have status column configuration', () => {
    const statusColumn = columns[4];
    expect(statusColumn.alignHeader).toBe('left');
    expect(statusColumn.alignColumns).toBe('left');
    expect(statusColumn.sortMethod).toBe('text');
    expect(statusColumn.key).toBe('status');
    expect(statusColumn.type).toBe('text');
    expect(statusColumn.width).toBe(20);
  });

  it('should have all columns with required properties', () => {
    columns.forEach((column) => {
      expect(column).toHaveProperty('alignHeader');
      expect(column).toHaveProperty('alignColumns');
      expect(column).toHaveProperty('key');
      expect(column).toHaveProperty('sortMethod');
      expect(column).toHaveProperty('width');
      expect(typeof column.key).toBe('string');
      expect(typeof column.width).toBe('number');
    });
  });

  it('should have proper column keys', () => {
    const expectedKeys = ['company', 'subscription', 'first_pqq_sent', 'registration-date', 'status'];
    const actualKeys = columns.map(col => col.key);
    expect(actualKeys).toEqual(expectedKeys);
  });

  it('should have proper width distribution', () => {
    const expectedWidths = [30, 20, 15, 20, 20];
    const actualWidths = columns.map(col => col.width);
    expect(actualWidths).toEqual(expectedWidths);
    
    // Total width should be 105
    const totalWidth = actualWidths.reduce((sum, width) => sum + width, 0);
    expect(totalWidth).toBe(105);
  });

  it('should have consistent alignment for all columns', () => {
    columns.forEach(column => {
      expect(column.alignHeader).toBe('left');
      expect(column.alignColumns).toBe('left');
    });
  });

  it('should have proper type definitions where specified', () => {
    // Check text type columns
    expect(columns[2].type).toBe('text');
    expect(columns[3].type).toBe('date');
    expect(columns[4].type).toBe('text');
    
    // Check date column has format
    expect(columns[3].format).toBe('DD MMMM YYYY');
  });
});