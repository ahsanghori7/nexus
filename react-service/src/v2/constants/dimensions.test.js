/**
 * @jest-environment jsdom
 */

const dimensions = require('./dimensions');

describe('dimensions constants', () => {
  // Sanity test - ensure file exports are defined
  test('should export dimensions object', () => {
    expect(dimensions).toBeDefined();
    expect(typeof dimensions).toBe('object');
    expect(dimensions).not.toBeNull();
  });

  // Test Bootstrap breakpoints
  test('should contain Bootstrap breakpoints', () => {
    expect(dimensions.SM_SCREEN).toBe(576);
    expect(dimensions.MD_SCREEN).toBe(768);
    expect(dimensions.LG_SCREEN).toBe(992);
    expect(dimensions.XL_SCREEN).toBe(1200);
    expect(dimensions.XXL_SCREEN).toBe(1400);
  });

  test('should have Bootstrap breakpoints in ascending order', () => {
    expect(dimensions.SM_SCREEN).toBeLessThan(dimensions.MD_SCREEN);
    expect(dimensions.MD_SCREEN).toBeLessThan(dimensions.LG_SCREEN);
    expect(dimensions.LG_SCREEN).toBeLessThan(dimensions.XL_SCREEN);
    expect(dimensions.XL_SCREEN).toBeLessThan(dimensions.XXL_SCREEN);
  });

  // Test MUI breakpoints
  test('should contain MUI breakpoints', () => {
    expect(dimensions.MUI_XS_SCREEN).toBe(0);
    expect(dimensions.MUI_SM_SCREEN).toBe(600);
    expect(dimensions.MUI_MD_SCREEN).toBe(900);
    expect(dimensions.MUI_LG_SCREEN).toBe(1200);
    expect(dimensions.MUI_XL_SCREEN).toBe(1536);
  });

  test('should have MUI breakpoints in ascending order', () => {
    expect(dimensions.MUI_XS_SCREEN).toBeLessThan(dimensions.MUI_SM_SCREEN);
    expect(dimensions.MUI_SM_SCREEN).toBeLessThan(dimensions.MUI_MD_SCREEN);
    expect(dimensions.MUI_MD_SCREEN).toBeLessThan(dimensions.MUI_LG_SCREEN);
    expect(dimensions.MUI_LG_SCREEN).toBeLessThan(dimensions.MUI_XL_SCREEN);
  });

  // Test specific dimensions
  test('should contain sidebar width', () => {
    expect(dimensions.adminsidebarWidth).toBe(285);
    expect(typeof dimensions.adminsidebarWidth).toBe('number');
  });

  test('should contain custom XLH screen breakpoint', () => {
    expect(dimensions.XLH_SCREEN).toBe(1300);
    expect(typeof dimensions.XLH_SCREEN).toBe('number');
  });

  // Edge cases - ensure no unexpected undefined/null values
  test('should not contain undefined or null values', () => {
    const dimensionKeys = Object.keys(dimensions);
    
    dimensionKeys.forEach(key => {
      expect(dimensions[key]).toBeDefined();
      expect(dimensions[key]).not.toBeNull();
      expect(typeof dimensions[key]).toBe('number');
    });
  });

  test('should contain only positive numbers', () => {
    const dimensionKeys = Object.keys(dimensions);
    
    dimensionKeys.forEach(key => {
      expect(dimensions[key]).toBeGreaterThanOrEqual(0);
    });
  });

  test('should contain expected number of dimension properties', () => {
    const dimensionKeys = Object.keys(dimensions);
    expect(dimensionKeys.length).toBe(12); // Based on the file structure
  });

  test('should have consistent naming patterns', () => {
    // Test that screen breakpoints follow naming convention
    expect(dimensions).toHaveProperty('SM_SCREEN');
    expect(dimensions).toHaveProperty('MD_SCREEN');
    expect(dimensions).toHaveProperty('LG_SCREEN');
    expect(dimensions).toHaveProperty('XL_SCREEN');
    expect(dimensions).toHaveProperty('XXL_SCREEN');
    
    // Test MUI naming convention
    expect(dimensions).toHaveProperty('MUI_XS_SCREEN');
    expect(dimensions).toHaveProperty('MUI_SM_SCREEN');
    expect(dimensions).toHaveProperty('MUI_MD_SCREEN');
    expect(dimensions).toHaveProperty('MUI_LG_SCREEN');
    expect(dimensions).toHaveProperty('MUI_XL_SCREEN');
  });
});