import columns from './enquiries';

describe('prosper enquiries columns configuration', () => {
  it('should export an array of column configurations', () => {
    expect(columns).toBeDefined();
    expect(Array.isArray(columns)).toBe(true);
    expect(columns.length).toBe(3);
  });

  it('should have contractor column configuration', () => {
    const contractorColumn = columns[0];
    expect(contractorColumn.alignHeader).toBe('left');
    expect(contractorColumn.alignColumns).toBe('left');
    expect(contractorColumn.key).toBe('contractor');
    expect(contractorColumn.sortMethod).toBe('text');
    expect(contractorColumn.width).toBe(40);
  });

  it('should have project column configuration', () => {
    const projectColumn = columns[1];
    expect(projectColumn.alignHeader).toBe('left');
    expect(projectColumn.alignColumns).toBe('left');
    expect(projectColumn.key).toBe('project');
    expect(projectColumn.sortMethod).toBe('text');
    expect(projectColumn.width).toBe(40);
  });

  it('should have status column configuration', () => {
    const statusColumn = columns[2];
    expect(statusColumn.alignHeader).toBe('left');
    expect(statusColumn.alignColumns).toBe('left');
    expect(statusColumn.key).toBe('status');
    expect(statusColumn.sortMethod).toBe('text');
    expect(statusColumn.width).toBe(15);
  });

  it('should have all columns with required properties', () => {
    columns.forEach(column => {
      expect(column).toHaveProperty('alignHeader');
      expect(column).toHaveProperty('alignColumns');
      expect(column).toHaveProperty('key');
      expect(column).toHaveProperty('sortMethod');
      expect(column).toHaveProperty('width');
    });
  });

  it('should have proper column keys', () => {
    const expectedKeys = ['contractor', 'project', 'status'];
    const actualKeys = columns.map(col => col.key);
    expect(actualKeys).toEqual(expectedKeys);
  });

  it('should have proper width distribution', () => {
    const expectedWidths = [40, 40, 15];
    const actualWidths = columns.map(col => col.width);
    expect(actualWidths).toEqual(expectedWidths);
    
    // Total width should be 95
    const totalWidth = actualWidths.reduce((sum, width) => sum + width, 0);
    expect(totalWidth).toBe(95);
  });

  it('should have consistent alignment and sort method', () => {
    columns.forEach(column => {
      expect(column.alignHeader).toBe('left');
      expect(column.alignColumns).toBe('left');
      expect(column.sortMethod).toBe('text');
    });
  });
});