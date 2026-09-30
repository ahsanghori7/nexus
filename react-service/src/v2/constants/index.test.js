/**
 * @jest-environment jsdom
 */

const { constants } = require('./index');
const moduleExports = require('./index');

describe('constants/index', () => {
  // Sanity test - ensure file exports are defined
  test('should export constants object', () => {
    expect(constants).toBeDefined();
    expect(typeof constants).toBe('object');
    expect(constants).not.toBeNull();
  });

  // Test main structure
  test('should contain expected top-level properties', () => {
    expect(constants).toHaveProperty('fonts');
    expect(constants).toHaveProperty('dimensions');
    expect(constants).toHaveProperty('colors');
    expect(constants).toHaveProperty('s3');
  });

  // Test fonts
  test('should contain fonts from fonts.js', () => {
    expect(constants.fonts).toBeDefined();
    expect(typeof constants.fonts).toBe('object');
    expect(constants.fonts.sansSerif).toBe('sans-serif');
    expect(constants.fonts.proxima).toBe('proxima-nova, proxima_nova, sans-serif');
  });

  // Test dimensions
  test('should contain dimensions from dimensions.js', () => {
    expect(constants.dimensions).toBeDefined();
    expect(typeof constants.dimensions).toBe('object');
    expect(constants.dimensions.SM_SCREEN).toBe(576);
    expect(constants.dimensions.MD_SCREEN).toBe(768);
    expect(constants.dimensions.adminsidebarWidth).toBe(285);
  });

  // Test colors structure
  test('should contain colors with general and prosper sub-objects', () => {
    expect(constants.colors).toBeDefined();
    expect(typeof constants.colors).toBe('object');
    expect(constants.colors).toHaveProperty('general');
    expect(constants.colors).toHaveProperty('prosper');
  });

  // Test general colors
  test('should contain general colors from colors.js', () => {
    expect(constants.colors.general).toBeDefined();
    expect(typeof constants.colors.general).toBe('object');
    expect(constants.colors.general.clinkGreen).toBe('#4cc0ad'); // eslint-disable-line no-hex-colors/no-hex-colors
    expect(constants.colors.general.black).toBe('#000000'); // eslint-disable-line no-hex-colors/no-hex-colors
    expect(constants.colors.general.white).toBe('#ffffff'); // eslint-disable-line no-hex-colors/no-hex-colors
  });

  // Test prosper colors
  test('should contain prosper colors from colors-prosper.js', () => {
    expect(constants.colors.prosper).toBeDefined();
    expect(typeof constants.colors.prosper).toBe('object');
    expect(constants.colors.prosper.prosperBoxShadow).toBe('#0000000a'); // eslint-disable-line no-hex-colors/no-hex-colors
    expect(constants.colors.prosper.prosperBoxGreen).toBe('#71BB6F'); // eslint-disable-line no-hex-colors/no-hex-colors
    expect(constants.colors.prosper.policeBlue).toBe('#3D4D5C'); // eslint-disable-line no-hex-colors/no-hex-colors
  });

  // Test s3 imports
  test('should contain s3 from s3/index.js', () => {
    expect(constants.s3).toBeDefined();
    expect(typeof constants.s3).toBe('object');

    // Test that s3 contains URL strings
    const s3Keys = Object.keys(constants.s3);
    expect(s3Keys.length).toBeGreaterThan(0);

    // Check a few specific s3 URLs if they exist
    if (constants.s3.clinkImage) {
      expect(constants.s3.clinkImage).toContain('clink-assets.s3.eu-west-2.amazonaws.com');
    }
  });

  // Test that all sub-modules are properly imported and structured
  test('should not contain undefined or null values at top level', () => {
    expect(constants.fonts).not.toBeNull();
    expect(constants.dimensions).not.toBeNull();
    expect(constants.colors).not.toBeNull();
    expect(constants.s3).not.toBeNull();
  });

  test('should contain consistent structure for colors', () => {
    // Both general and prosper should be objects
    expect(typeof constants.colors.general).toBe('object');
    expect(typeof constants.colors.prosper).toBe('object');

    // Both should contain hex color values
    const generalKeys = Object.keys(constants.colors.general);
    const prosperKeys = Object.keys(constants.colors.prosper);

    expect(generalKeys.length).toBeGreaterThan(0);
    expect(prosperKeys.length).toBeGreaterThan(0);

    // Sample a few values to ensure they're hex colors
    if (generalKeys.length > 0) {
      const firstGeneralColor = constants.colors.general[generalKeys[0]];
      expect(firstGeneralColor).toMatch(/^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/);
    }

    if (prosperKeys.length > 0) {
      const firstProsperColor = constants.colors.prosper[prosperKeys[0]];
      expect(firstProsperColor).toMatch(/^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/);
    }
  });

  test('should maintain separation between general and prosper colors', () => {
    // Ensure they are different objects
    expect(constants.colors.general).not.toBe(constants.colors.prosper);

    // Check that they have different keys (at least mostly)
    const generalKeys = Object.keys(constants.colors.general);
    const prosperKeys = Object.keys(constants.colors.prosper);

    expect(generalKeys).not.toEqual(prosperKeys);
  });

  test('should provide access to all constants through single import', () => {
    // This test ensures that the index file serves as a proper aggregation point

    // Should be able to access font constants
    expect(constants.fonts.avantGardeGothicPRO).toBeDefined();

    // Should be able to access dimension constants
    expect(constants.dimensions.LG_SCREEN).toBeDefined();

    // Should be able to access both color types
    expect(constants.colors.general.clinkGreen).toBeDefined();
    expect(constants.colors.prosper.prosperBoxGreen).toBeDefined();

    // Should be able to access s3 constants
    const s3Keys = Object.keys(constants.s3);
    if (s3Keys.length > 0) {
      expect(constants.s3[s3Keys[0]]).toBeDefined();
    }
  });

  test('should have expected export structure', () => {
    // Test that the export structure is { constants }
    expect(moduleExports).toHaveProperty('constants');
    expect(moduleExports.constants).toBe(constants);
  });
});