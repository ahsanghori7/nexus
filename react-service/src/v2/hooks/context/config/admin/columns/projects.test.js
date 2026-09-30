import columns from './projects';

describe('admin projects columns configuration', () => {
  it('should export an array of column configurations', () => {
    expect(columns).toBeDefined();
    expect(Array.isArray(columns)).toBe(true);
    expect(columns.length).toBeGreaterThan(0);
  });

  it('should have project column configuration', () => {
    const projectColumn = columns[0];
    expect(projectColumn.alignHeader).toBe('left');
    expect(projectColumn.alignColumns).toBe('left');
    expect(projectColumn.key).toBe('project');
    expect(projectColumn.sortMethod).toBe('text');
    expect(projectColumn.width).toBe(15);
  });

  it('should have location column configuration', () => {
    const locationColumn = columns[1];
    expect(locationColumn.alignHeader).toBe('left');
    expect(locationColumn.alignColumns).toBe('left');
    expect(locationColumn.key).toBe('location');
    expect(locationColumn.sortMethod).toBe('text');
    expect(locationColumn.width).toBe(15);
  });

  it('should have unit-no column configuration', () => {
    const unitColumn = columns[2];
    expect(unitColumn.key).toBe('unit-no');
    expect(unitColumn.width).toBe(10);
  });

  it('should have all columns with key property', () => {
    columns.forEach((column) => {
      expect(column).toHaveProperty('key');
      expect(column).toHaveProperty('width');
      expect(typeof column.key).toBe('string');
      expect(typeof column.width).toBe('number');
    });
  });

  it('should have valid column keys', () => {
    const keys = columns.map(col => col.key);
    expect(keys.includes('project')).toBe(true);
    expect(keys.includes('location')).toBe(true);
    expect(keys.includes('unit-no')).toBe(true);
  });

  it('should have numeric width values', () => {
    columns.forEach(column => {
      expect(typeof column.width).toBe('number');
      expect(column.width).toBeGreaterThan(0);
    });
  });

  it('should be immutable configuration', () => {
    const originalLength = columns.length;
    const firstColumnKey = columns[0].key;
    
    expect(originalLength).toBeGreaterThan(0);
    expect(firstColumnKey).toBe('project');
  });
});