import actionColumn from './actions';

describe('prosper actions column', () => {
  test('should export an object', () => {
    expect(typeof actionColumn).toBe('object');
    expect(actionColumn).not.toBeNull();
    expect(Array.isArray(actionColumn)).toBe(false);
  });

  test('should have required properties', () => {
    expect(actionColumn).toHaveProperty('alignHeader');
    expect(actionColumn).toHaveProperty('alignColumns');
    expect(actionColumn).toHaveProperty('key');
    expect(actionColumn).toHaveProperty('type');
  });

  test('should have correct property types', () => {
    expect(typeof actionColumn.alignHeader).toBe('string');
    expect(typeof actionColumn.alignColumns).toBe('string');
    expect(typeof actionColumn.key).toBe('string');
    expect(typeof actionColumn.type).toBe('string');
  });

  test('should have center alignment', () => {
    expect(actionColumn.alignHeader).toBe('center');
    expect(actionColumn.alignColumns).toBe('center');
  });

  test('should have actions key and type', () => {
    expect(actionColumn.key).toBe('actions');
    expect(actionColumn.type).toBe('actions');
  });

  test('should have valid alignment values', () => {
    const validAlignments = ['left', 'center', 'right'];
    expect(validAlignments).toContain(actionColumn.alignHeader);
    expect(validAlignments).toContain(actionColumn.alignColumns);
  });

  test('should have non-empty string values', () => {
    expect(actionColumn.alignHeader.length).toBeGreaterThan(0);
    expect(actionColumn.alignColumns.length).toBeGreaterThan(0);
    expect(actionColumn.key.length).toBeGreaterThan(0);
    expect(actionColumn.type.length).toBeGreaterThan(0);
  });
});