/**
 * @jest-environment jsdom
 */

const colors = require('./colors');

describe('colors constants', () => {
  // Sanity test - ensure file exports are defined
  test('should export colors object', () => {
    expect(colors).toBeDefined();
    expect(typeof colors).toBe('object');
    expect(colors).not.toBeNull();
  });

  // Test critical color constants
  test('should contain primary brand colors', () => {
    expect(colors.clinkGreen).toBe('#4cc0ad'); // eslint-disable-line no-hex-colors/no-hex-colors
    expect(colors.clinkGreenDark).toBe('#4aac9c'); // eslint-disable-line no-hex-colors/no-hex-colors
    expect(colors.clinkGreenHover).toBe('#4cc0a1'); // eslint-disable-line no-hex-colors/no-hex-colors
    expect(colors.clinkRed).toBe('#ed1164'); // eslint-disable-line no-hex-colors/no-hex-colors
    expect(colors.clinkOrange).toBe('#ff9300'); // eslint-disable-line no-hex-colors/no-hex-colors
  });

  test('should contain basic colors', () => {
    expect(colors.black).toBe('#000000'); // eslint-disable-line no-hex-colors/no-hex-colors
    expect(colors.white).toBe('#ffffff'); // eslint-disable-line no-hex-colors/no-hex-colors
    expect(colors.red).toBe('#ff0000'); // eslint-disable-line no-hex-colors/no-hex-colors
    expect(colors.yellow).toBe('#ffff00'); // eslint-disable-line no-hex-colors/no-hex-colors
  });

  test('should contain gray variations', () => {
    expect(colors.clinkGray).toBe('#959595'); // eslint-disable-line no-hex-colors/no-hex-colors
    expect(colors.clinkGrayV2).toBe('#969ca0'); // eslint-disable-line no-hex-colors/no-hex-colors
    expect(colors.brightGray).toBe('#EDEDED'); // eslint-disable-line no-hex-colors/no-hex-colors
    expect(colors.clinkLightGray).toBe('#eaeaea'); // eslint-disable-line no-hex-colors/no-hex-colors
    expect(colors.clinkDarkGray).toBe('#273339'); // eslint-disable-line no-hex-colors/no-hex-colors
  });

  test('should contain purple variations', () => {
    expect(colors.clinkPurple).toBe('#8e8dbe'); // eslint-disable-line no-hex-colors/no-hex-colors
    expect(colors.clinkLightPurple).toBe('#e2e2ee'); // eslint-disable-line no-hex-colors/no-hex-colors
    expect(colors.clinkBackgroundPurple).toBe('#f3f3f8'); // eslint-disable-line no-hex-colors/no-hex-colors
  });

  test('should contain button colors', () => {
    expect(colors.redButton).toBe('#dd1900'); // eslint-disable-line no-hex-colors/no-hex-colors
    expect(colors.greenButton).toBe('#158b00'); // eslint-disable-line no-hex-colors/no-hex-colors
  });

  test('should contain teal variations', () => {
    expect(colors.teal).toBe('#4bc0ac'); // eslint-disable-line no-hex-colors/no-hex-colors
    expect(colors.teal2).toBe('#008080'); // eslint-disable-line no-hex-colors/no-hex-colors
    expect(colors.tealShade).toBe('#009688'); // eslint-disable-line no-hex-colors/no-hex-colors
  });

  test('should contain BoQ schedule UI colors', () => {
    expect(colors.boqAccent).toBe('#14A38B'); // eslint-disable-line no-hex-colors/no-hex-colors
    expect(colors.boqAccentHover).toBe('#128A75'); // eslint-disable-line no-hex-colors/no-hex-colors
    expect(colors.boqSectionBg).toBe('#F9FAFB'); // eslint-disable-line no-hex-colors/no-hex-colors
  });

  // Edge cases - ensure no unexpected undefined/null values
  test('should not contain undefined or null values', () => {
    const colorKeys = Object.keys(colors);
    
    colorKeys.forEach(key => {
      expect(colors[key]).toBeDefined();
      expect(colors[key]).not.toBeNull();
      expect(typeof colors[key]).toBe('string');
    });
  });

  test('should contain valid hex color format', () => {
    const colorKeys = Object.keys(colors);
    const hexColorRegex = /^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/;
    
    colorKeys.forEach(key => {
      expect(colors[key]).toMatch(hexColorRegex);
    });
  });

  test('should have expected number of color properties', () => {
    const colorKeys = Object.keys(colors);
    expect(colorKeys.length).toBeGreaterThan(50); // Should have many color constants
  });

  test('should contain specific named colors for testing regressions', () => {
    // Test a few specific colors that are likely to be used frequently
    expect(colors.eerieBlack).toBe('#1a1b1f'); // eslint-disable-line no-hex-colors/no-hex-colors
    expect(colors.clinkBlack).toBe('#212529'); // eslint-disable-line no-hex-colors/no-hex-colors
    expect(colors.lightGreen).toBe('#4EC5B6'); // eslint-disable-line no-hex-colors/no-hex-colors
    expect(colors.borderbox).toBe('#F3F4F6'); // eslint-disable-line no-hex-colors/no-hex-colors
  });
});