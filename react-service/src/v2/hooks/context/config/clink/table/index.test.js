import * as indexModule from './index';

// Test the index.js file exports directly
describe('clink table config index', () => {
  it('should export default config object with columns and rowBuilder', () => {
    const config = indexModule.default;
    
    expect(config).toBeInstanceOf(Object);
    expect(config).toHaveProperty('columns');
    expect(config).toHaveProperty('rowBuilder');
  });

  it('should execute module and create proper exports', () => {
    // Import as module to ensure all code paths are executed
    const config = indexModule.default;
    
    expect(config).toBeDefined();
    expect(typeof config).toBe('object');
    expect(Object.keys(config)).toEqual(['columns', 'rowBuilder']);
  });

  it('should export columns array correctly', () => {
    const config = indexModule.default;
    
    expect(Array.isArray(config.columns)).toBe(true);
    expect(config.columns.length).toBeGreaterThan(0);
  });

  it('should export rowBuilder function correctly', () => {
    const config = indexModule.default;
    
    expect(typeof config.rowBuilder).toBe('function');
  });

  it('should have correct object structure and properties', () => {
    const config = indexModule.default;
    
    expect(Object.keys(config)).toEqual(['columns', 'rowBuilder']);
    expect(Object.values(config)).toHaveLength(2);
    expect(Object.values(config).every(value => value !== undefined)).toBe(true);
  });

  it('should export consistent object reference', () => {
    const config1 = indexModule.default;
    const config2 = indexModule.default;
    
    expect(config1).toBe(config2); // Same reference
  });

  it('should import actual dependencies', () => {
    const config = indexModule.default;
    
    // Test that the imported modules are actually used
    expect(config.columns).toBeDefined();
    expect(config.rowBuilder).toBeDefined();
    
    // Test that the structure matches what we expect from the source
    expect(config.columns).toHaveProperty('length');
    expect(typeof config.rowBuilder).toBe('function');
  });
});