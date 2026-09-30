import React from 'react';
import { render, screen } from '@testing-library/react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Button } from '@mui/material';
import themeOptions, { themeOptions as namedExport } from './prosper';

describe('Prosper Theme', () => {
  it('exports theme options as default export', () => {
    expect(themeOptions).toBeDefined();
    expect(typeof themeOptions).toBe('object');
  });

  it('exports theme options as named export', () => {
    expect(namedExport).toBeDefined();
    expect(typeof namedExport).toBe('object');
    expect(namedExport).toEqual(themeOptions);
  });

  it('has required theme structure', () => {
    expect(themeOptions).toHaveProperty('palette');
    expect(themeOptions).toHaveProperty('typography');
    expect(themeOptions).toHaveProperty('components');
  });

  it('has primary color configured', () => {
    expect(themeOptions.palette).toHaveProperty('primary');
    expect(themeOptions.palette.primary).toHaveProperty('main');
    expect(themeOptions.palette.primary).toHaveProperty('dark');
  });

  it('has secondary color configured', () => {
    expect(themeOptions.palette).toHaveProperty('secondary');
    expect(themeOptions.palette.secondary).toHaveProperty('main');
  });

  it('has white color configured', () => {
    expect(themeOptions.palette).toHaveProperty('white');
    expect(themeOptions.palette.white).toHaveProperty('main');
  });

  it('has background color configured', () => {
    expect(themeOptions.palette).toHaveProperty('background');
    expect(themeOptions.palette.background).toHaveProperty('default');
  });

  it('can be used to create a MUI theme', () => {
    const theme = createTheme(themeOptions);
    expect(theme).toBeDefined();
    expect(typeof theme).toBe('object');
  });

  it('can be used in a ThemeProvider without errors', () => {
    const theme = createTheme(themeOptions);
    
    const { container } = render(
      <ThemeProvider theme={theme}>
        <Button>Test Button</Button>
      </ThemeProvider>
    );
    
    expect(container).toBeInTheDocument();
    expect(container.querySelector('button')).toBeInTheDocument();
  });

  it('applies Prosper theme styles to a primary button', () => {
    const theme = createTheme(themeOptions);
    
    render(
      <ThemeProvider theme={theme}>
        <Button color="primary">Primary Button</Button>
      </ThemeProvider>
    );
    
    const button = screen.getByRole('button', { name: 'Primary Button' });
    expect(button.tagName).toBe('BUTTON');
    expect(button).toHaveTextContent('Primary Button');
    expect(button.getAttribute('data-testid')).toBe('mui-button');
  });

  describe('MuiButton styleOverrides function', () => {
    const buttonOverrides = themeOptions.components.MuiButton.styleOverrides.root;

    it('returns red design styles', () => {
      const ownerState = { design: 'red' };
      const result = buttonOverrides({ ownerState });
      
      expect(result).toHaveProperty('textTransform', 'initial');
      expect(result).toHaveProperty('width', 161);
      expect(result).toHaveProperty('height', 51);
      expect(result).toHaveProperty('fontSize', '16pt');
      expect(result).toHaveProperty('textDecoration', 'none');
    });

    it('returns green design styles', () => {
      const ownerState = { design: 'green' };
      const result = buttonOverrides({ ownerState });
      
      expect(result).toHaveProperty('textTransform', 'initial');
      expect(result).toHaveProperty('width', 161);
      expect(result).toHaveProperty('height', 51);
      expect(result).toHaveProperty('fontSize', '16pt');
      expect(result).toHaveProperty('textDecoration', 'none');
    });

    it('returns reverse design styles', () => {
      const ownerState = { design: 'reverse' };
      const result = buttonOverrides({ ownerState });
      
      expect(result).toHaveProperty('textTransform', 'initial');
      expect(result).toHaveProperty('width', 161);
      expect(result).toHaveProperty('height', 51);
      expect(result).toHaveProperty('fontSize', '16pt');
      expect(result).toHaveProperty('textDecoration', 'none');
    });

    it('returns link design styles', () => {
      const ownerState = { design: 'link' };
      const result = buttonOverrides({ ownerState });
      
      expect(result).toHaveProperty('textTransform', 'initial');
      expect(result).toHaveProperty('width', 161);
      expect(result).toHaveProperty('height', 51);
      expect(result).toHaveProperty('fontSize', '14pt');
      expect(result).toHaveProperty('textDecoration', 'underline');
    });

    it('returns black design styles', () => {
      const ownerState = { design: 'black' };
      const result = buttonOverrides({ ownerState });
      
      expect(result).toHaveProperty('textTransform', 'initial');
      expect(result).toHaveProperty('width', 161);
      expect(result).toHaveProperty('height', 51);
    });

    it('returns empty styles for unknown design', () => {
      const ownerState = { design: 'unknown' };
      const result = buttonOverrides({ ownerState });
      
      expect(result).toEqual({});
    });

    it('returns empty styles for no design property', () => {
      const ownerState = {};
      const result = buttonOverrides({ ownerState });
      
      expect(result).toEqual({});
    });
  });

  describe('MuiFormControlLabel styleOverrides function', () => {
    const formControlLabelOverrides = themeOptions.components.MuiFormControlLabel.styleOverrides.root;

    it('returns dialog select styles when dialogselect is true', () => {
      const ownerState = { dialogselect: 'true' };
      const result = formControlLabelOverrides({ ownerState });
      
      expect(result).toHaveProperty('justifyContent', 'space-between');
      expect(result).toHaveProperty('flexDirection', 'row-reverse');
      expect(result).toHaveProperty('fontWeight', 200);
      expect(result).toHaveProperty('margin', 0);
    });

    it('returns empty styles when dialogselect is not true', () => {
      const ownerState = { dialogselect: 'false' };
      const result = formControlLabelOverrides({ ownerState });
      
      expect(result).toEqual({});
    });

    it('returns empty styles when dialogselect is undefined', () => {
      const ownerState = {};
      const result = formControlLabelOverrides({ ownerState });
      
      expect(result).toEqual({});
    });
  });

  it('has spacing configuration', () => {
    expect(themeOptions.spacing).toBe(8);
  });

  it('has typography configuration', () => {
    expect(themeOptions.typography).toHaveProperty('fontFamily');
    expect(themeOptions.typography).toHaveProperty('small');
    expect(themeOptions.typography).toHaveProperty('normal');
    expect(themeOptions.typography).toHaveProperty('title');
    expect(themeOptions.typography).toHaveProperty('title2');
    expect(themeOptions.typography).toHaveProperty('title3');
    expect(themeOptions.typography).toHaveProperty('boldTitle');
    expect(themeOptions.typography).toHaveProperty('button');
  });

  it('has MuiListItem component overrides', () => {
    expect(themeOptions.components).toHaveProperty('MuiListItem');
    expect(themeOptions.components.MuiListItem.styleOverrides.root.height).toBe('48px');
  });

  it('has MuiListItemText component overrides', () => {
    expect(themeOptions.components).toHaveProperty('MuiListItemText');
    expect(themeOptions.components.MuiListItemText.styleOverrides).toHaveProperty('primary');
    expect(themeOptions.components.MuiListItemText.styleOverrides).toHaveProperty('secondary');
  });

  it('has MuiCheckbox component overrides', () => {
    expect(themeOptions.components).toHaveProperty('MuiCheckbox');
    expect(themeOptions.components.MuiCheckbox.styleOverrides.root['& .MuiSvgIcon-root'].fontSize).toBe(30);
  });

  it('has MuiLink component overrides', () => {
    expect(themeOptions.components).toHaveProperty('MuiLink');
    expect(themeOptions.components.MuiLink.styleOverrides.root).toHaveProperty('color');
    expect(themeOptions.components.MuiLink.styleOverrides.root).toHaveProperty('textDecorationColor');
  });

  it('has MuiSelect component overrides', () => {
    expect(themeOptions.components).toHaveProperty('MuiSelect');
    expect(themeOptions.components.MuiSelect.styleOverrides.root.height).toBe(48);
  });

  it('has MuiTextField component overrides', () => {
    expect(themeOptions.components).toHaveProperty('MuiTextField');
    expect(themeOptions.components.MuiTextField.styleOverrides.root['.MuiInputBase-input']).toBeDefined();
    expect(themeOptions.components.MuiTextField.styleOverrides.root['.MuiInputBase-input'].height).toBe(13);
  });

  it('has MuiDialog component overrides', () => {
    expect(themeOptions.components).toHaveProperty('MuiDialog');
    expect(themeOptions.components.MuiDialog.styleOverrides.backdrop).toHaveProperty('backgroundColor');
  });

  it('has MuiDataGrid component overrides', () => {
    expect(themeOptions.components).toHaveProperty('MuiDataGrid');
    expect(themeOptions.components.MuiDataGrid.styleOverrides.root['& .MuiDataGrid-overlayWrapper']).toBeDefined();
    expect(themeOptions.components.MuiDataGrid.styleOverrides.root['& .MuiDataGrid-row']).toBeDefined();
  });
});
