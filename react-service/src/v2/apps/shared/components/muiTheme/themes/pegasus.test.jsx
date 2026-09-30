import '@testing-library/jest-dom';
import { themeOptions } from './pegasus';

// Mock clink-components
jest.mock('clink-components', () => ({
  CONSTANTS: {
    fonts: {
      ptSans: 'PT Sans, sans-serif'
    },
    colors: {
      general: {
        clinkGreen: '#10b981',
        clinkRed: '#ef4444',
        aliceBlue: '#f0f8ff',
        casal: '#326859',
        elephant: '#243746',
        clinkOrange: '#fb923c',
        white: '#ffffff',
        ghostWhite: '#f8fafc',
        lightPeriwinkle: '#c5d2ea'
      }
    }
  }
}));

describe('Pegasus Theme', () => {
  it('exports a valid theme options object', () => {
    expect(themeOptions).toBeDefined();
    expect(typeof themeOptions).toBe('object');
  });

  it('has palette configuration', () => {
    expect(themeOptions).toHaveProperty('palette');
    expect(typeof themeOptions.palette).toBe('object');
  });

  it('configures light theme type', () => {
    expect(themeOptions.palette).toHaveProperty('type', 'light');
  });

  it('configures primary color', () => {
    expect(themeOptions.palette).toHaveProperty('primary');
    expect(themeOptions.palette.primary).toHaveProperty('main', '#326859');
  });

  it('has valid structure for MUI theme', () => {
    expect(themeOptions.palette).toHaveProperty('type');
    expect(themeOptions.palette).toHaveProperty('primary');
  });

  it('uses correct color constants', () => {
    // Test that the theme uses the expected color from constants
    expect(themeOptions.palette.primary.main).toBe('#326859'); // casal color
  });
});