import actionColumn from './actions';

describe('common actions configuration', () => {
  it('should export an action column configuration', () => {
    expect(actionColumn).toBeDefined();
    expect(typeof actionColumn).toBe('object');
  });

  it('should have correct alignHeader property', () => {
    expect(actionColumn.alignHeader).toBe('center');
  });

  it('should have correct alignColumns property', () => {
    expect(actionColumn.alignColumns).toBe('center');
  });

  it('should have correct key property', () => {
    expect(actionColumn.key).toBe('actions');
  });

  it('should have correct type property', () => {
    expect(actionColumn.type).toBe('actions');
  });

  it('should have correct width property', () => {
    expect(actionColumn.width).toBe(10);
  });

  it('should have all required properties', () => {
    const requiredProperties = ['alignHeader', 'alignColumns', 'key', 'type', 'width'];
    requiredProperties.forEach(property => {
      expect(actionColumn).toHaveProperty(property);
    });
  });

  it('should be immutable (snapshot test)', () => {
    const expectedConfig = {
      alignHeader: 'center',
      alignColumns: 'center',
      key: 'actions',
      type: 'actions',
      width: 10,
    };
    expect(actionColumn).toEqual(expectedConfig);
  });
});