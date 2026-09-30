import columns from './column';

describe('instructions variations table columns', () => {
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
      
      if (column.type !== undefined) {
        expect(typeof column.type).toBe('string');
      }
    });
  });

  it('should have instruction column as first column', () => {
    expect(columns[0]).toEqual({
      alignHeader: 'left',
      alignColumns: 'left',
      key: 'instruction',
      label: 'Instruction NR  ',
      width: 10,
    });
  });

  it('should have unique keys for all columns', () => {
    const keys = columns.map(column => column.key);
    const uniqueKeys = [...new Set(keys)];
    expect(keys.length).toBe(uniqueKeys.length);
  });

  it('should have date type columns', () => {
    const dateColumns = columns.filter(col => col.type === 'date');
    expect(dateColumns.length).toBeGreaterThan(0);
    
    dateColumns.forEach(col => {
      expect(col.type).toBe('date');
    });
  });

  it('should have proper alignment values', () => {
    const alignedColumns = columns.filter(col => col.alignHeader || col.alignColumns);
    
    alignedColumns.forEach(col => {
      if (col.alignHeader) {
        expect(['left', 'center', 'right']).toContain(col.alignHeader);
      }
      if (col.alignColumns) {
        expect(['left', 'center', 'right']).toContain(col.alignColumns);
      }
    });
  });

  it('should have width values as positive numbers', () => {
    const columnsWithWidth = columns.filter(col => col.width !== undefined);
    
    columnsWithWidth.forEach(col => {
      expect(typeof col.width).toBe('number');
      expect(col.width).toBeGreaterThan(0);
    });
  });
});