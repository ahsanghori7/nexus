import config from './index';
import columns from './column';

// Mock the rowBuilder since it's complex and tested separately
jest.mock('./rowBuilder', () => ({
  default: jest.fn(),
}));

describe('clink forecastTable config', () => {
  it('should export config object with columns and rowBuilder', () => {
    expect(config).toBeInstanceOf(Object);
    expect(config).toHaveProperty('columns');
    expect(config).toHaveProperty('rowBuilder');
  });

  it('should export columns array', () => {
    expect(config.columns).toBe(columns);
    expect(Array.isArray(config.columns)).toBe(true);
  });

  it('should export rowBuilder function', () => {
    expect(config.rowBuilder).toBeDefined();
  });

  it('should have all required properties for table configuration', () => {
    const requiredProperties = ['columns', 'rowBuilder'];
    
    requiredProperties.forEach(prop => {
      expect(config).toHaveProperty(prop);
      expect(config[prop]).toBeDefined();
    });
  });

  it('should maintain object structure', () => {
    expect(Object.keys(config)).toEqual(['columns', 'rowBuilder']);
  });
});