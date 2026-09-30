import '@testing-library/jest-dom';

// Mock MUI createTheme and alpha functions first
jest.mock('@mui/material/styles', () => ({
  createTheme: jest.fn(() => ({
    palette: {
      augmentColor: jest.fn((config) => ({
        main: config.color.main,
        contrastText: config.color.contrastText,
        dark: config.color.main,
        light: config.color.main
      }))
    }
  })),
  alpha: jest.fn((color, opacity) => `rgba(${color}, ${opacity})`)
}));

// Mock MUI TablePagination
jest.mock('@mui/material/TablePagination', () => ({
  tablePaginationClasses: {
    selectLabel: 'MuiTablePagination-selectLabel',
    displayedRows: 'MuiTablePagination-displayedRows'
  }
}));

// Mock MUI Tooltip classes
jest.mock('@mui/material/Tooltip', () => ({
  tooltipClasses: {
    arrow: 'MuiTooltip-arrow',
    tooltip: 'MuiTooltip-tooltip'
  }
}));

// Mock the CONSTANTS from clink-components
jest.mock('clink-components', () => ({
  CONSTANTS: {
    fonts: {
      proxima: 'Proxima Nova, sans-serif'
    },
    colors: {
      general: {
        white: '#FFFFFF',
        eerieBlack: '#1B1B1B',
        highlightGray: '#F5F5F5',
        darkCharcoal: '#36454F',
        clinkPurple: '#6B46C1',
        clinkGreen: '#059669',
        clinkGreenDark: '#047857',
        clinkRed: '#DC2626',
        clinkLightPurple: '#DDD6FE',
        clinkBackgroundPurple: '#F3F4F6',
        lightBlue: '#3B82F6',
        black: '#000000',
        prim: '#8B5CF6',
        ruby: '#E11D48',
        razzmatazz: '#EF4444',
        ghostWhite: '#F9FAFB',
        lightPeriwinkle: '#E5E7EB',
        grayDark: '#4B5563',
        teal: '#14B8A6'
      }
    }
  }
}));

// Import after mocks are set up
import { themeOptions } from './clink';

describe('clink theme', () => {
  it('exports themeOptions object', () => {
    expect(themeOptions).toBeDefined();
    expect(typeof themeOptions).toBe('object');
  });

  it('has correct palette configuration', () => {
    expect(themeOptions.palette).toBeDefined();
    expect(themeOptions.palette.type).toBe('light');
    
    // Test primary color
    expect(themeOptions.palette.primary.main).toBe('#059669');
    expect(themeOptions.palette.primary.contrastText).toBe('#FFFFFF');
    
    // Test secondary color
    expect(themeOptions.palette.secondary.main).toBe('#DC2626');
    expect(themeOptions.palette.secondary.contrastText).toBe('#FFFFFF');
    
    // Test background
    expect(themeOptions.palette.background.default).toBe('#F5F5F5');
  });

  it('has correct typography configuration', () => {
    expect(themeOptions.typography).toBeDefined();
    expect(themeOptions.typography.fontFamily).toBe('Proxima Nova, sans-serif');
    expect(themeOptions.typography.fontSize).toBe(14);
    expect(themeOptions.typography.htmlFontSize).toBe(16);
    
    // Test font weights
    expect(themeOptions.typography.fontWeightLight).toBe(300);
    expect(themeOptions.typography.fontWeightRegular).toBe(400);
    expect(themeOptions.typography.fontWeightMedium).toBe(500);
    expect(themeOptions.typography.fontWeightBold).toBe(700);
  });

  it('has correct typography variants', () => {
    const { typography } = themeOptions;
    
    // Test standard variants
    expect(typography.h1.fontSize).toBe('6rem');
    expect(typography.h2.fontSize).toBe('3.75rem');
    expect(typography.h3.fontSize).toBe('3rem');
    expect(typography.h4.fontSize).toBe('2.125rem');
    expect(typography.h5.fontSize).toBe('1.5rem');
    expect(typography.h6.fontSize).toBe('1.25rem');
    
    // Test custom variants
    expect(typography.title.fontSize).toBe('16px');
    expect(typography.title2.fontSize).toBe('18px');
    expect(typography.title3.fontSize).toBe('36px');
    expect(typography.boldTitle.fontSize).toBe('24px');
    expect(typography.boldTitle.fontWeight).toBe(600);
  });

  it('has correct spacing configuration', () => {
    expect(themeOptions.spacing).toBe(8);
  });

  it('has correct shape configuration', () => {
    expect(themeOptions.shape.borderRadius).toBe(4);
  });

  it('has MUI component overrides', () => {
    expect(themeOptions.components).toBeDefined();
    expect(typeof themeOptions.components).toBe('object');
  });

  it('has MuiButton component configuration', () => {
    const muiButton = themeOptions.components.MuiButton;
    expect(muiButton).toBeDefined();
    expect(muiButton.styleOverrides).toBeDefined();
    expect(muiButton.variants).toBeDefined();
    expect(Array.isArray(muiButton.variants)).toBe(true);
    
    // Test specific button variants
    const scCancelVariant = muiButton.variants.find(v => v.props.variant === 'sc-cancel');
    expect(scCancelVariant).toBeDefined();
    expect(scCancelVariant.style.backgroundColor).toBe('#DC2626');
    
    const scConfirmVariant = muiButton.variants.find(v => v.props.variant === 'sc-confirm');
    expect(scConfirmVariant).toBeDefined();
    expect(scConfirmVariant.style.backgroundColor).toBe('#059669');
  });

  it('has MuiTextField component configuration', () => {
    const muiTextField = themeOptions.components.MuiTextField;
    expect(muiTextField).toBeDefined();
    expect(muiTextField.styleOverrides).toBeDefined();
    expect(typeof muiTextField.styleOverrides.root).toBe('function');
  });

  it('has MuiDataGrid component configuration', () => {
    const muiDataGrid = themeOptions.components.MuiDataGrid;
    expect(muiDataGrid).toBeDefined();
    expect(muiDataGrid.styleOverrides).toBeDefined();
    expect(muiDataGrid.styleOverrides.root).toBeDefined();
  });

  it('has MuiCard component configuration', () => {
    const muiCard = themeOptions.components.MuiCard;
    expect(muiCard).toBeDefined();
    expect(muiCard.styleOverrides.root).toBeDefined();
    expect(muiCard.styleOverrides.root.display).toBe('flex');
    expect(muiCard.styleOverrides.root.flexDirection).toBe('column');
  });

  it('has MuiSelect component configuration', () => {
    const muiSelect = themeOptions.components.MuiSelect;
    expect(muiSelect).toBeDefined();
    expect(muiSelect.defaultProps.size).toBe('small');
    expect(muiSelect.styleOverrides).toBeDefined();
  });

  it('has MuiAutocomplete component configuration', () => {
    const muiAutocomplete = themeOptions.components.MuiAutocomplete;
    expect(muiAutocomplete).toBeDefined();
    expect(muiAutocomplete.styleOverrides).toBeDefined();
    expect(muiAutocomplete.styleOverrides.tag).toBeDefined();
    expect(muiAutocomplete.styleOverrides.option).toBeDefined();
  });

  it('has MuiTableRow component configuration', () => {
    const muiTableRow = themeOptions.components.MuiTableRow;
    expect(muiTableRow).toBeDefined();
    expect(muiTableRow.styleOverrides.root).toBeDefined();
    expect(muiTableRow.styleOverrides.root.backgroundColor).toBe('#F5F5F5');
  });

  it('has MuiDialog component configuration', () => {
    const muiDialog = themeOptions.components.MuiDialog;
    expect(muiDialog).toBeDefined();
    expect(muiDialog.styleOverrides.backdrop).toBeDefined();
    expect(muiDialog.styleOverrides.backdrop.backgroundColor).toBe('rgba(0, 0, 0, 0.5)');
  });

  it('has MuiTabs and MuiTab component configuration', () => {
    const muiTabs = themeOptions.components.MuiTabs;
    const muiTab = themeOptions.components.MuiTab;
    
    expect(muiTabs).toBeDefined();
    expect(muiTabs.styleOverrides.root.position).toBe('relative');
    
    expect(muiTab).toBeDefined();
    expect(muiTab.styleOverrides.root.minHeight).toBe(48);
    expect(muiTab.styleOverrides.root.textTransform).toBe('none');
  });

  it('has MuiIconButton component configuration with variants', () => {
    const muiIconButton = themeOptions.components.MuiIconButton;
    expect(muiIconButton).toBeDefined();
    expect(muiIconButton.variants).toBeDefined();
    expect(Array.isArray(muiIconButton.variants)).toBe(true);
    
    const loginCloseVariant = muiIconButton.variants.find(v => v.props.variant === 'loginClose');
    expect(loginCloseVariant).toBeDefined();
    expect(loginCloseVariant.style.position).toBe('absolute');
    
    const archiveDropdownVariant = muiIconButton.variants.find(v => v.props.variant === 'archiveDropdown');
    expect(archiveDropdownVariant).toBeDefined();
    expect(archiveDropdownVariant.style.position).toBe('absolute');
  });

  it('has MuiMenu and MuiMenuItem component configuration', () => {
    const muiMenu = themeOptions.components.MuiMenu;
    const muiMenuItem = themeOptions.components.MuiMenuItem;
    
    expect(muiMenu).toBeDefined();
    expect(muiMenu.styleOverrides.root).toBeDefined();
    
    expect(muiMenuItem).toBeDefined();
    expect(muiMenuItem.styleOverrides.root).toBeDefined();
  });

  it('has MuiSnackbar component configuration', () => {
    const muiSnackbar = themeOptions.components.MuiSnackbar;
    expect(muiSnackbar).toBeDefined();
    expect(muiSnackbar.styleOverrides.root).toBeDefined();
  });

  it('has MuiFormControl component configuration', () => {
    const muiFormControl = themeOptions.components.MuiFormControl;
    expect(muiFormControl).toBeDefined();
    expect(muiFormControl.styleOverrides.root.width).toBe('100%');
    expect(muiFormControl.styleOverrides.root.margin).toBe(0);
  });

  it('has MuiStepLabel component configuration', () => {
    const muiStepLabel = themeOptions.components.MuiStepLabel;
    expect(muiStepLabel).toBeDefined();
    expect(muiStepLabel.styleOverrides.root).toBeDefined();
  });

  it('has MuiTypography component configuration', () => {
    const muiTypography = themeOptions.components.MuiTypography;
    expect(muiTypography).toBeDefined();
    expect(muiTypography.defaultProps).toBeDefined();
    expect(muiTypography.defaultProps.variantMapping).toBeDefined();
    expect(muiTypography.defaultProps.variantMapping.small).toBe('span');
    expect(muiTypography.defaultProps.variantMapping.title).toBe('h6');
  });

  it('has proper color palette structure', () => {
    const { palette } = themeOptions;
    
    // Test custom color definitions
    expect(palette.black.main).toBe('#1B1B1B');
    expect(palette.black.contrastText).toBe('#FFFFFF');
    
    expect(palette.white.main).toBe('#FFFFFF');
    expect(palette.white.contrastText).toBe('#059669');
    
    expect(palette.error.main).toBe('#DC2626');
    expect(palette.error.contrastText).toBe('#FFFFFF');
    
    expect(palette.success.main).toBe('#059669');
    expect(palette.success.contrastText).toBe('#FFFFFF');
    
    expect(palette.info.main).toBe('#3B82F6');
    expect(palette.info.contrastText).toBe('#FFFFFF');
  });

  it('exports themeOptions as default export', () => {
    // Import the default export
    const clinkTheme = require('./clink').default;
    expect(clinkTheme).toBe(themeOptions);
  });

  it('has all required MUI component configurations for clink theme', () => {
    const componentKeys = Object.keys(themeOptions.components);
    const expectedComponents = [
      'MuiIconButton',
      'MuiMenu',
      'MuiMenuItem',
      'MuiCard',
      'MuiCardMedia',
      'MuiCardActions',
      'MuiCardHeader',
      'MuiSnackbar',
      'MuiTypography',
      'MuiSelect',
      'MuiInputLabel',
      'MuiAutocomplete',
      'MuiTableRow',
      'MuiDataGrid',
      'MuiDialog',
      'MuiTablePagination',
      'MuiTabs',
      'MuiTab',
      'MuiTabScrollButton',
      'MuiButton',
      'MuiDialogActions',
      'MuiFormControl',
      'MuiStepLabel',
      'MuiTextField'
    ];
    
    expectedComponents.forEach(component => {
      expect(componentKeys).toContain(component);
    });
  });

  it('has specific login-related typography styles', () => {
    const { typography } = themeOptions;
    
    expect(typography.loginTitle).toBeDefined();
    expect(typography.loginTitle.fontSize).toBe('42px');
    expect(typography.loginTitle.fontWeight).toBe('bold');
    
    expect(typography.loginLabel).toBeDefined();
    expect(typography.loginLabel.fontSize).toBe('18px');
    expect(typography.loginLabel.fontWeight).toBe('600');
    
    expect(typography.loginError).toBeDefined();
    expect(typography.loginError.fontSize).toBe('24px');
    expect(typography.loginError.color).toBe('#DC2626');
    
    expect(typography.forgotPassword).toBeDefined();
    expect(typography.forgotPassword.fontWeight).toBe('bold');
    expect(typography.forgotPassword.fontSize).toBe('20px');
  });

  it('has proper data grid styling with BOQ-specific classes', () => {
    const dataGridStyles = themeOptions.components.MuiDataGrid.styleOverrides.root;
    
    // Check that BOQ section styling exists
    expect(dataGridStyles['& .MuiDataGrid-row']['&.boq--section']).toBeDefined();
    expect(dataGridStyles['& .MuiDataGrid-row']['&.boq--section'].backgroundColor).toBe('#8B5CF6');
    expect(dataGridStyles['& .MuiDataGrid-row']['&.boq--section'].fontWeight).toBe(700);
    
    // Check that BOQ item styling exists
    expect(dataGridStyles['& .MuiDataGrid-row']['&.boq--item']).toBeDefined();
    expect(dataGridStyles['& .MuiDataGrid-row']['&.boq--item'].backgroundColor).toBe('#FFFFFF');
    
    // Check that BOQ grouped heading styling exists
    expect(dataGridStyles['& .MuiDataGrid-row']['&.boq--grouped_heading']).toBeDefined();
    expect(dataGridStyles['& .MuiDataGrid-row']['&.boq--grouped_heading'].fontWeight).toBe(700);
    expect(dataGridStyles['& .MuiDataGrid-row']['&.boq--grouped_heading'].textDecoration).toBe('underline');
  });

  describe('MuiInputLabel styleOverrides function', () => {
    const inputLabelOverrides = themeOptions.components.MuiInputLabel.styleOverrides.root;

    it('returns correct top position when focused', () => {
      const ownerState = { focused: true };
      const result = inputLabelOverrides({ ownerState });
      
      expect(result).toHaveProperty('top', 0);
    });

    it('returns correct top position when not focused', () => {
      const ownerState = { focused: false };
      const result = inputLabelOverrides({ ownerState });
      
      expect(result).toHaveProperty('top', '-8px');
    });

    it('returns correct top position when focused is undefined', () => {
      const ownerState = {};
      const result = inputLabelOverrides({ ownerState });
      
      expect(result).toHaveProperty('top', '-8px');
    });
  });

  describe('MuiButton styleOverrides function', () => {
    const buttonOverrides = themeOptions.components.MuiButton.styleOverrides.root;

    it('returns correct styles for small button', () => {
      const ownerState = { size: 'small' };
      const localTheme = { palette: {} };
      const result = buttonOverrides({ ownerState, theme: localTheme });
      
      expect(result).toHaveProperty('height', '32px');
      expect(result).toHaveProperty('fontSize', '13px');
      expect(result).toHaveProperty('borderRadius', '24px');
      expect(result).toHaveProperty('fontWeight', 'bold');
      expect(result).toHaveProperty('textTransform', 'none');
    });

    it('returns correct styles for large button', () => {
      const ownerState = { size: 'large' };
      const localTheme = { palette: {} };
      const result = buttonOverrides({ ownerState, theme: localTheme });
      
      expect(result).toHaveProperty('height', '48px');
      expect(result).toHaveProperty('fontSize', '18px');
      expect(result).toHaveProperty('borderRadius', '24px');
      expect(result).toHaveProperty('fontWeight', 'bold');
      expect(result).toHaveProperty('textTransform', 'none');
    });

    it('returns correct default styles for medium button', () => {
      const ownerState = {};
      const localTheme = { palette: {} };
      const result = buttonOverrides({ ownerState, theme: localTheme });
      
      expect(result).toHaveProperty('height', '40px');
      expect(result).toHaveProperty('fontSize', '16px');
      expect(result).toHaveProperty('borderRadius', '24px');
      expect(result).toHaveProperty('fontWeight', 'bold');
      expect(result).toHaveProperty('textTransform', 'none');
    });

    it('adds hover styles when href is provided', () => {
      const ownerState = { href: 'https://example.com', color: 'primary' };
      const localTheme = { 
        palette: { 
          primary: { 
            contrastText: '#FFFFFF' 
          } 
        } 
      };
      const result = buttonOverrides({ ownerState, theme: localTheme });
      
      expect(result).toHaveProperty('&:hover');
      expect(result['&:hover']).toHaveProperty('color', '#FFFFFF');
    });

    it('adds hover styles when to is provided', () => {
      const ownerState = { to: '/dashboard', color: 'secondary' };
      const localTheme = { 
        palette: { 
          secondary: { 
            contrastText: '#000000' 
          } 
        } 
      };
      const result = buttonOverrides({ ownerState, theme: localTheme });
      
      expect(result).toHaveProperty('&:hover');
      expect(result['&:hover']).toHaveProperty('color', '#000000');
    });

    it('does not add hover styles when neither href nor to is provided', () => {
      const ownerState = { color: 'primary' };
      const localTheme = { 
        palette: { 
          primary: { 
            contrastText: '#FFFFFF' 
          } 
        } 
      };
      const result = buttonOverrides({ ownerState, theme: localTheme });
      
      expect(result).not.toHaveProperty('&:hover');
    });

    it('handles missing contrast text gracefully', () => {
      const ownerState = { href: 'https://example.com', color: 'unknown' };
      const localTheme = { palette: {} };
      const result = buttonOverrides({ ownerState, theme: localTheme });
      
      expect(result).not.toHaveProperty('&:hover');
    });
  });

  describe('MuiTextField styleOverrides function', () => {
    const textFieldOverrides = themeOptions.components.MuiTextField.styleOverrides.root;

    it('returns correct height for non-multiline text field', () => {
      const ownerState = { multiline: false };
      const result = textFieldOverrides({ ownerState });
      
      expect(result).toHaveProperty('height', '40px');
    });

    it('returns auto height for multiline text field', () => {
      const ownerState = { multiline: true };
      const result = textFieldOverrides({ ownerState });
      
      expect(result).toHaveProperty('height', 'auto');
    });

    it('returns correct marginTop for multiline text field', () => {
      const ownerState = { multiline: true };
      const result = textFieldOverrides({ ownerState });
      
      expect(result['& .MuiInputBase-root']['& .MuiInputBase-input']).toHaveProperty('marginTop', '16px');
    });

    it('returns correct marginTop for non-multiline text field', () => {
      const ownerState = { multiline: false };
      const result = textFieldOverrides({ ownerState });
      
      expect(result['& .MuiInputBase-root']['& .MuiInputBase-input']).toHaveProperty('marginTop', 0);
    });

    it('handles select field styling', () => {
      const ownerState = { select: true };
      const result = textFieldOverrides({ ownerState });
      
      expect(result['& .MuiInputBase-root']['& .MuiInputBase-input']).toHaveProperty('padding', '9px 16px');
    });

    it('handles non-select field styling', () => {
      const ownerState = { select: false };
      const result = textFieldOverrides({ ownerState });
      
      expect(result['& .MuiInputBase-root']['& .MuiInputBase-input']).toHaveProperty('padding', '0px 16px');
    });

    it('handles error state styling', () => {
      const ownerState = { error: true };
      const result = textFieldOverrides({ ownerState });
      
      expect(result['& .MuiInputBase-root']['& .MuiOutlinedInput-notchedOutline']).toHaveProperty('border', '1px solid #DC2626');
    });

    it('handles normal state styling', () => {
      const ownerState = { error: false };
      const result = textFieldOverrides({ ownerState });
      
      expect(result['& .MuiInputBase-root']['& .MuiOutlinedInput-notchedOutline']).toHaveProperty('border', '1px solid #DDD6FE');
    });

    it('handles calendar adornment styling', () => {
      const ownerState = { 
        yearsPerRow: 4, 
        InputProps: { 
          endAdornment: true 
        }
      };
      const result = textFieldOverrides({ ownerState });
      
      expect(result['& .MuiInputAdornment-root']).toBeDefined();
      expect(result['& .MuiInputAdornment-root']).toHaveProperty('width', '40px');
    });

    it('does not add calendar adornment when not needed', () => {
      const ownerState = {};
      const result = textFieldOverrides({ ownerState });
      
      expect(result).not.toHaveProperty('& .MuiInputAdornment-root');
    });
  });
});