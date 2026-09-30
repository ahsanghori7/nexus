import columns from './column';

describe('forecast table columns', () => {
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
      }
      
      if (column.alignHeader !== undefined) {
        expect(['left', 'center', 'right']).toContain(column.alignHeader);
      }
      
      if (column.alignColumns !== undefined) {
        expect(['left', 'center', 'right']).toContain(column.alignColumns);
      }
    });
  });

  it('should have package column as first column', () => {
    expect(columns[0]).toEqual({
      alignHeader: 'left',
      alignColumns: 'left',
      key: 'package',
      label: 'Package',
      sortMethod: 'number',
      width: 30,
    });
  });

  it('should have unique keys for all columns', () => {
    const keys = columns.map(column => column.key);
    const uniqueKeys = [...new Set(keys)];
    expect(keys.length).toBe(uniqueKeys.length);
  });

  it('should have consistent property types', () => {
    const numericColumns = columns.filter(col => col.width !== undefined);
    const alignColumns = columns.filter(col => col.alignHeader !== undefined);
    
    numericColumns.forEach(col => {
      expect(typeof col.width).toBe('number');
      expect(col.width).toBeGreaterThan(0);
    });
    
    alignColumns.forEach(col => {
      expect(['left', 'center', 'right']).toContain(col.alignHeader);
    });
  });
});