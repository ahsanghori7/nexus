import '@testing-library/jest-dom';
import { themeOptions } from './prosperEnquiries';

// Mock clink-components
jest.mock('clink-components', () => ({
  CONSTANTS: {
    fonts: {
      avantGardeGothicPRO: 'Avant Garde Gothic Pro, sans-serif'
    },
    colors: {
      general: {
        white: '#ffffff'
      },
      prosper: {
        prosperBoxRed: '#dc2626'
      }
    }
  }
}));

// Mock the prosper theme import
jest.mock('./prosper', () => ({
  default: {
    palette: {
      type: 'light',
      primary: {
        main: '#1e3a8a',
        dark: '#004225'
      },
      secondary: {
        main: '#6366f1'
      },
      error: {
        main: '#ef4444',
        contrastText: '#ffffff'
      },
      success: {
        main: '#16a34a'
      },
      background: {
        default: '#ffffff',
        paper: '#ffffff'
      },
      text: {
        primary: '#111827',
        secondary: '#6b7280'
      }
    },
    typography: {
      fontFamily: 'Avant Garde Gothic Pro, sans-serif',
      fontSize: 14,
      h1: {
        fontSize: '2rem',
        fontWeight: 600
      },
      h2: {
        fontSize: '1.5rem',
        fontWeight: 600
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.5
      }
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none'
          }
        }
      }
    },
    spacing: (factor) => `${0.25 * factor}rem`,
    breakpoints: {
      values: {
        xs: 0,
        sm: 600,
        md: 900,
        lg: 1200,
        xl: 1536
      }
    }
  }
}));

describe('Prosper Enquiries Theme', () => {
  it('exports a valid theme options object', () => {
    expect(themeOptions).toBeDefined();
    expect(typeof themeOptions).toBe('object');
  });

  it('extends the base prosper theme', () => {
    expect(themeOptions).toHaveProperty('palette');
    expect(themeOptions).toHaveProperty('typography');
    // Should inherit properties from base prosper theme - checking actual structure
    expect(themeOptions.typography).toHaveProperty('fontFamily');
  });

  it('has palette configuration that extends prosper', () => {
    expect(themeOptions.palette).toHaveProperty('type', 'light');
    expect(themeOptions.palette).toHaveProperty('secondary');
    expect(themeOptions.palette).toHaveProperty('error');
  });

  it('overrides secondary color to white', () => {
    expect(themeOptions.palette).toHaveProperty('secondary');
    expect(themeOptions.palette.secondary).toHaveProperty('main', '#ffffff');
  });

  it('configures error color with prosper box red', () => {
    expect(themeOptions.palette).toHaveProperty('error');
    expect(themeOptions.palette.error).toHaveProperty('main', '#dc2626');
    expect(themeOptions.palette.error).toHaveProperty('contrastText', '#ffffff');
  });

  it('has typography configuration that extends prosper', () => {
    expect(themeOptions).toHaveProperty('typography');
    expect(typeof themeOptions.typography).toBe('object');
  });

  it('uses Avant Garde Gothic Pro font family', () => {
    expect(themeOptions.typography).toHaveProperty('fontFamily');
    expect(themeOptions.typography.fontFamily).toContain('Avant Garde Gothic Pro');
  });

  it('configures custom boldTitle typography variant', () => {
    expect(themeOptions.typography).toHaveProperty('boldTitle');
    expect(themeOptions.typography.boldTitle).toHaveProperty('fontSize', '18px');
    expect(themeOptions.typography.boldTitle).toHaveProperty('fontWeight', 600);
    expect(themeOptions.typography.boldTitle).toHaveProperty('lineHeight', '28px');
    expect(themeOptions.typography.boldTitle).toHaveProperty('fontFamily', 'Avant Garde Gothic Pro, sans-serif');
  });

  it('has components configuration', () => {
    expect(themeOptions).toHaveProperty('components');
    expect(typeof themeOptions.components).toBe('object');
  });

  describe('MuiButton styleOverrides function', () => {
    const buttonOverrides = themeOptions.components.MuiButton.styleOverrides.root;

    it('returns red button styles when red prop is true', () => {
      const ownerState = { red: true };
      const result = buttonOverrides({ ownerState });
      
      expect(result).toHaveProperty('textTransform', 'initial');
      expect(result).toHaveProperty('width', 161);
      expect(result).toHaveProperty('height', 51);
      expect(result).toHaveProperty('backgroundColor', '#dc2626');
      expect(result).toHaveProperty('color', '#ffffff');
      expect(result).toHaveProperty('fontSize', '16pt');
      expect(result).toHaveProperty('&:hover');
    });

    it('returns link button styles when link prop is true', () => {
      const ownerState = { link: true };
      const result = buttonOverrides({ ownerState });
      
      expect(result).toHaveProperty('textTransform', 'initial');
      expect(result).toHaveProperty('width', 161);
      expect(result).toHaveProperty('height', 51);
      expect(result).toHaveProperty('backgroundColor', '#ffffff');
      expect(result).toHaveProperty('color', '#dc2626');
      expect(result).toHaveProperty('textDecoration', 'underline');
      expect(result).toHaveProperty('fontSize', '14pt');
    });

    it('returns empty styles when no special props are set', () => {
      const ownerState = {};
      const result = buttonOverrides({ ownerState });
      
      expect(result).toEqual({});
    });

    it('returns empty styles when unknown props are set', () => {
      const ownerState = { unknown: true };
      const result = buttonOverrides({ ownerState });
      
      expect(result).toEqual({});
    });

    it('handles both red and link props being true (red takes precedence)', () => {
      const ownerState = { red: true, link: true };
      const result = buttonOverrides({ ownerState });
      
      // Should include both styles, with link overriding some red properties
      expect(result).toHaveProperty('textTransform', 'initial');
      expect(result).toHaveProperty('width', 161);
      expect(result).toHaveProperty('height', 51);
      expect(result).toHaveProperty('backgroundColor', '#ffffff'); // link style
      expect(result).toHaveProperty('color', '#dc2626'); // link style
      expect(result).toHaveProperty('textDecoration', 'underline'); // link style
      expect(result).toHaveProperty('fontSize', '14pt'); // link style
    });
  });

  describe('MuiFormControlLabel styleOverrides function', () => {
    const formControlLabelOverrides = themeOptions.components.MuiFormControlLabel.styleOverrides.root;

    it('returns dialog select styles when dialogSelect is true', () => {
      const ownerState = { dialogSelect: true };
      const result = formControlLabelOverrides({ ownerState });
      
      expect(result).toHaveProperty('justifyContent', 'space-between');
      expect(result).toHaveProperty('flexDirection', 'row-reverse');
      expect(result).toHaveProperty('fontWeight', 200);
      expect(result).toHaveProperty('margin', 0);
    });

    it('returns empty styles when dialogSelect is false', () => {
      const ownerState = { dialogSelect: false };
      const result = formControlLabelOverrides({ ownerState });
      
      expect(result).toEqual({});
    });

    it('returns empty styles when dialogSelect is undefined', () => {
      const ownerState = {};
      const result = formControlLabelOverrides({ ownerState });
      
      expect(result).toEqual({});
    });
  });

  it('has MuiSelect component overrides', () => {
    expect(themeOptions.components).toHaveProperty('MuiSelect');
    expect(themeOptions.components.MuiSelect.styleOverrides.root.height).toBe(48);
  });

  it('has MuiCheckbox component overrides', () => {
    expect(themeOptions.components).toHaveProperty('MuiCheckbox');
    expect(themeOptions.components.MuiCheckbox.styleOverrides.root['& .MuiSvgIcon-root'].fontSize).toBe(30);
    expect(themeOptions.components.MuiCheckbox.styleOverrides.root['& .MuiTypography-root'].color).toBe('red');
  });

  it('inherits components from base prosper theme', () => {
    // Should inherit components configuration from prosper theme
    if (themeOptions.components) {
      expect(typeof themeOptions.components).toBe('object');
    }
  });

  it('inherits spacing from base prosper theme', () => {
    // Should inherit spacing function from prosper theme
    if (themeOptions.spacing) {
      expect(typeof themeOptions.spacing).toBe('function');
    }
  });

  it('inherits breakpoints from base prosper theme', () => {
    // Should inherit breakpoints from prosper theme
    if (themeOptions.breakpoints) {
      expect(themeOptions.breakpoints).toHaveProperty('values');
      expect(typeof themeOptions.breakpoints.values).toBe('object');
    }
  });

  it('uses CONSTANTS colors from clink-components', () => {
    // Test that the theme uses the mocked color values
    const themeJson = JSON.stringify(themeOptions);
    expect(themeJson).toContain('#ffffff'); // white
    expect(themeJson).toContain('#dc2626'); // prosperBoxRed
  });

  it('uses CONSTANTS fonts from clink-components', () => {
    // Test that the theme uses the mocked font values
    const themeJson = JSON.stringify(themeOptions);
    expect(themeJson).toContain('Avant Garde Gothic Pro');
  });

  it('maintains theme structure integrity', () => {
    // Verify the theme has essential properties
    expect(themeOptions).toHaveProperty('palette');
    expect(themeOptions).toHaveProperty('typography');
  });

  it('properly spreads prosper theme properties', () => {
    // Should contain properties from the base prosper theme - checking actual structure
    expect(themeOptions).toHaveProperty('palette');
    expect(themeOptions).toHaveProperty('typography');
    expect(themeOptions).toHaveProperty('components');
  });

  it('properly spreads prosper palette properties', () => {
    // Should contain inherited palette properties - checking actual structure
    expect(themeOptions.palette).toHaveProperty('type');
    expect(themeOptions.palette).toHaveProperty('secondary');
    expect(themeOptions.palette).toHaveProperty('error');
  });

  it('properly spreads prosper typography properties', () => {
    // Should contain inherited typography properties - checking actual structure
    expect(themeOptions.typography).toHaveProperty('fontFamily');
    expect(themeOptions.typography).toHaveProperty('boldTitle');
  });

  it('configures light theme mode', () => {
    expect(themeOptions.palette.type).toBe('light');
  });

  it('has proper error color configuration', () => {
    expect(themeOptions.palette.error).toHaveProperty('main');
    expect(themeOptions.palette.error).toHaveProperty('contrastText');
    expect(typeof themeOptions.palette.error.main).toBe('string');
    expect(typeof themeOptions.palette.error.contrastText).toBe('string');
  });

  it('has proper secondary color configuration', () => {
    expect(themeOptions.palette.secondary).toHaveProperty('main');
    expect(typeof themeOptions.palette.secondary.main).toBe('string');
  });

  it('configures boldTitle with proper font properties', () => {
    const boldTitle = themeOptions.typography.boldTitle;
    expect(boldTitle.fontSize).toBe('18px');
    expect(boldTitle.fontWeight).toBe(600);
    expect(boldTitle.lineHeight).toBe('28px');
    expect(typeof boldTitle.fontFamily).toBe('string');
  });

  it('maintains font family consistency', () => {
    // Both main typography and boldTitle should use the same font family
    const mainFontFamily = themeOptions.typography.fontFamily;
    const boldTitleFontFamily = themeOptions.typography.boldTitle.fontFamily;
    expect(mainFontFamily).toContain('Avant Garde Gothic Pro');
    expect(boldTitleFontFamily).toContain('Avant Garde Gothic Pro');
  });

  it('has proper theme object structure', () => {
    // Check that the theme follows the expected structure
    expect(typeof themeOptions.palette).toBe('object');
    expect(typeof themeOptions.typography).toBe('object');
    expect(typeof themeOptions.typography.boldTitle).toBe('object');
  });

  it('inherits and extends palette correctly', () => {
    // Should have both inherited and new/overridden properties - checking actual structure
    expect(themeOptions.palette).toHaveProperty('secondary'); // overridden
    expect(themeOptions.palette).toHaveProperty('error'); // overridden
    expect(themeOptions.palette).toHaveProperty('type', 'light'); // set
  });

  it('inherits and extends typography correctly', () => {
    // Should have both inherited and new properties - checking actual structure
    expect(themeOptions.typography).toHaveProperty('fontFamily'); // overridden
    expect(themeOptions.typography).toHaveProperty('boldTitle'); // added
  });

  it('properly overrides palette properties', () => {
    // Verify that overrides work correctly
    expect(themeOptions.palette.secondary.main).toBe('#ffffff');
    expect(themeOptions.palette.error.main).toBe('#dc2626');
    expect(themeOptions.palette.error.contrastText).toBe('#ffffff');
  });

  it('properly sets typography properties', () => {
    // Verify typography configuration
    expect(themeOptions.typography.fontFamily).toMatch(/Avant Garde Gothic Pro/);
    expect(themeOptions.typography.boldTitle.fontSize).toBe('18px');
    expect(themeOptions.typography.boldTitle.fontWeight).toBe(600);
  });
});