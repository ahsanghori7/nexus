import useMuiTheme from './index';

// Mock dependencies
jest.mock('@mui/material/styles', () => ({
  createTheme: jest.fn((config) => ({
    ...config,
    typography: {
      ...config?.typography,
    },
    breakpoints: {
      down: jest.fn((size) => `@media (max-width: ${size === 'md' ? '960px' : '600px'})`),
    },
  })),
}));

jest.mock('clink-components', () => ({
  CONSTANTS: {
    fonts: {
      avantGardeGothicPRO: 'AvantGardeGothicPRO'
    }
  }
}));

// Mock the themes module
jest.mock('./themes', () => {
  return jest.fn((context) => {
    const themes = {
      prosper: {
        typography: {
          fontFamily: 'Prosper Font',
        },
        palette: {
          primary: {
            main: '#e74c3c',
          },
        },
      },
      clink: {
        typography: {
          fontFamily: 'Clink Font',
        },
        palette: {
          primary: {
            main: '#3498db',
          },
        },
      },
      default: {
        typography: {
          fontFamily: 'Default Font',
        },
        palette: {
          primary: {
            main: '#000000',
          },
        },
      },
    };
    return themes[context] || themes.default;
  });
});

describe('useMuiTheme', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return theme for prosper context', () => {
    const theme = useMuiTheme('prosper');
    
    expect(theme).toBeDefined();
    expect(theme.typography).toBeDefined();
    expect(theme.typography.widget1).toBeDefined();
    expect(theme.typography.widget2).toBeDefined();
  });

  test('should create widget1 typography for prosper', () => {
    const theme = useMuiTheme('prosper');
    
    const widget1 = theme.typography.widget1;
    expect(widget1.fontSize).toBe('28pt');
    expect(widget1.fontWeight).toBe(600);
    expect(widget1.fontFamily).toBe('AvantGardeGothicPRO');
    expect(widget1['@media (max-width: 960px)']).toEqual({ fontSize: '18pt' });
  });

  test('should create widget2 typography for prosper', () => {
    const theme = useMuiTheme('prosper');
    
    const widget2 = theme.typography.widget2;
    expect(widget2.fontSize).toBe('32pt');
    expect(widget2.fontWeight).toBe(600);
    expect(widget2.fontFamily).toBe('AvantGardeGothicPRO');
    expect(widget2['@media (max-width: 960px)']).toEqual({ fontSize: '25pt' });
  });

  test('should return theme for clink context without widget typography', () => {
    const theme = useMuiTheme('clink');
    
    expect(theme).toBeDefined();
    expect(theme.typography).toBeDefined();
    expect(theme.typography.widget1).toBeUndefined();
    expect(theme.typography.widget2).toBeUndefined();
  });

  test('should return theme for unknown context without widget typography', () => {
    const theme = useMuiTheme('unknown');
    
    expect(theme).toBeDefined();
    expect(theme.typography).toBeDefined();
    expect(theme.typography.widget1).toBeUndefined();
    expect(theme.typography.widget2).toBeUndefined();
  });

  test('should return theme for no context without widget typography', () => {
    const theme = useMuiTheme();
    
    expect(theme).toBeDefined();
    expect(theme.typography).toBeDefined();
    expect(theme.typography.widget1).toBeUndefined();
    expect(theme.typography.widget2).toBeUndefined();
  });

  test('should preserve original theme properties', () => {
    const theme = useMuiTheme('clink');
    
    expect(theme.typography.fontFamily).toBe('Clink Font');
    expect(theme.palette.primary.main).toBe('#3498db');
  });

  test('should call createTheme with theme context', () => {
    const { createTheme } = require('@mui/material/styles');
    
    useMuiTheme('prosper');
    
    expect(createTheme).toHaveBeenCalledWith(
      expect.objectContaining({
        typography: expect.objectContaining({
          fontFamily: 'Prosper Font',
        }),
        palette: expect.objectContaining({
          primary: { main: '#e74c3c' },
        }),
      })
    );
  });

  test('should use default theme when context not recognized', () => {
    const theme = useMuiTheme('nonexistent');
    
    expect(theme.typography.fontFamily).toBe('Default Font');
    expect(theme.palette.primary.main).toBe('#000000');
  });
});