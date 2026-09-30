/**
 * @jest-environment jsdom
 */

const colorsProsper = require('./colors-prosper');

describe('colors-prosper constants', () => {
  // Sanity test - ensure file exports are defined
  test('should export prosper colors object', () => {
    expect(colorsProsper).toBeDefined();
    expect(typeof colorsProsper).toBe('object');
    expect(colorsProsper).not.toBeNull();
  });

  // Test Prosper-specific brand colors
  test('should contain Prosper box shadow colors', () => {
    expect(colorsProsper.prosperBoxShadow).toBe('#0000000a');
    expect(colorsProsper.prosperBoxShadow2).toBe('#0000002E');
  });

  test('should contain Prosper status colors', () => {
    expect(colorsProsper.prosperBoxGreen).toBe('#71BB6F'); // eslint-disable-line no-hex-colors/no-hex-colors
    expect(colorsProsper.prosperBorderGreen).toBe('#55A752'); // eslint-disable-line no-hex-colors/no-hex-colors
    expect(colorsProsper.prosperBoxRed).toBe('#D1347D'); // eslint-disable-line no-hex-colors/no-hex-colors
    expect(colorsProsper.prosperBoxRedStatus).toBe('#D50000'); // eslint-disable-line no-hex-colors/no-hex-colors
  });

  test('should contain Prosper cursor and interaction colors', () => {
    expect(colorsProsper.prosperCursorGrayDark).toBe('#b8c2c7'); // eslint-disable-line no-hex-colors/no-hex-colors
    expect(colorsProsper.prosperCursorGray).toBe('#e7ecef'); // eslint-disable-line no-hex-colors/no-hex-colors
    expect(colorsProsper.prosperGrayDisabled).toBe('#caced1'); // eslint-disable-line no-hex-colors/no-hex-colors
    expect(colorsProsper.prosperDisabledBg).toBe('#C9CCD0'); // eslint-disable-line no-hex-colors/no-hex-colors
  });

  test('should contain Prosper background colors', () => {
    expect(colorsProsper.prosperInboxBg).toBe('#F5F7F8'); // eslint-disable-line no-hex-colors/no-hex-colors
    expect(colorsProsper.prosperGreenBg).toBe('#D4EAD3'); // eslint-disable-line no-hex-colors/no-hex-colors
    expect(colorsProsper.prosperProBg).toBe('#4C4B73'); // eslint-disable-line no-hex-colors/no-hex-colors
  });

  test('should contain Prosper orange variations', () => {
    expect(colorsProsper.prosperOrange).toBe('#EE7219'); // eslint-disable-line no-hex-colors/no-hex-colors
    expect(colorsProsper.prosperOrange2).toBe('#e26206'); // eslint-disable-line no-hex-colors/no-hex-colors
    expect(colorsProsper.vividTangelo).toBe('#F36B21'); // eslint-disable-line no-hex-colors/no-hex-colors
  });

  test('should contain Prosper purple colors', () => {
    expect(colorsProsper.prosperPurple).toBe('#59368c'); // eslint-disable-line no-hex-colors/no-hex-colors
    expect(colorsProsper.prosperProBgGrayIcon).toBe('#7A7997'); // eslint-disable-line no-hex-colors/no-hex-colors
  });

  test('should contain specific named colors', () => {
    expect(colorsProsper.policeBlue).toBe('#3D4D5C'); // eslint-disable-line no-hex-colors/no-hex-colors
    expect(colorsProsper.pewterBlue).toBe('#95A9BC'); // eslint-disable-line no-hex-colors/no-hex-colors
    expect(colorsProsper.shadowBlue).toBe('#7990A5'); // eslint-disable-line no-hex-colors/no-hex-colors
    expect(colorsProsper.blackCoral).toBe('#596571'); // eslint-disable-line no-hex-colors/no-hex-colors
  });

  test('should contain gray variations', () => {
    expect(colorsProsper.lightGray).toBe('#e7edf0'); // eslint-disable-line no-hex-colors/no-hex-colors
    expect(colorsProsper.gray).toBe('#959CA3'); // eslint-disable-line no-hex-colors/no-hex-colors
    expect(colorsProsper.coolGrey).toBe('#8796A0'); // eslint-disable-line no-hex-colors/no-hex-colors
    expect(colorsProsper.quickSilver).toBe('#A5A5A5'); // eslint-disable-line no-hex-colors/no-hex-colors
  });

  test('should contain material design inspired colors', () => {
    expect(colorsProsper.roseMadder).toBe('#E53935'); // eslint-disable-line no-hex-colors/no-hex-colors
    expect(colorsProsper.kryptoniteGreen).toBe('#43A047'); // eslint-disable-line no-hex-colors/no-hex-colors
    expect(colorsProsper.sunCrete).toBe('#FB8C00'); // eslint-disable-line no-hex-colors/no-hex-colors
  });

  // Edge cases - ensure no unexpected undefined/null values
  test('should not contain undefined or null values', () => {
    const colorKeys = Object.keys(colorsProsper);
    
    colorKeys.forEach(key => {
      expect(colorsProsper[key]).toBeDefined();
      expect(colorsProsper[key]).not.toBeNull();
      expect(typeof colorsProsper[key]).toBe('string');
    });
  });

  test('should contain valid hex color format', () => {
    const colorKeys = Object.keys(colorsProsper);
    const hexColorRegex = /^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/;
    
    colorKeys.forEach(key => {
      expect(colorsProsper[key]).toMatch(hexColorRegex);
    });
  });

  test('should have expected number of color properties', () => {
    const colorKeys = Object.keys(colorsProsper);
    expect(colorKeys.length).toBeGreaterThan(60); // Should have many color constants
  });

  test('should contain border colors', () => {
    expect(colorsProsper.prosperGrayBorder).toBe('#dddbdb'); // eslint-disable-line no-hex-colors/no-hex-colors
    expect(colorsProsper.prosperRedBorder).toBe('#c3075e'); // eslint-disable-line no-hex-colors/no-hex-colors
    expect(colorsProsper.prosperGreenBorder).toBe('#60af5e'); // eslint-disable-line no-hex-colors/no-hex-colors
    expect(colorsProsper.prosperGrayBorder2).toBe('#AAAAAA'); // eslint-disable-line no-hex-colors/no-hex-colors
  });

  test('should contain transparency and shadow colors', () => {
    expect(colorsProsper.jetBlack).toBe('#00000010'); // eslint-disable-line no-hex-colors/no-hex-colors
    expect(colorsProsper.transparentYellow).toBe('#FCCD0E80'); // eslint-disable-line no-hex-colors/no-hex-colors
  });

  test('should contain specific texture colors for testing regressions', () => {
    expect(colorsProsper.bubbles).toBe('#e5f4fa'); // eslint-disable-line no-hex-colors/no-hex-colors
    expect(colorsProsper.teaGreen).toBe('#c2eac1'); // eslint-disable-line no-hex-colors/no-hex-colors
    expect(colorsProsper.mauve).toBe('#D6BBFC'); // eslint-disable-line no-hex-colors/no-hex-colors
    expect(colorsProsper.fog).toBe('#D9D2E5'); // eslint-disable-line no-hex-colors/no-hex-colors
  });
});