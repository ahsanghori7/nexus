import '@testing-library/jest-dom';
import MuiDataGrid from './DataGrid';

// Mock clink-components
jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: {
        clinkLightPurple: '#e2e2ee', // eslint-disable-line no-hex-colors/no-hex-colors
        clinkBackgroundPurple: '#f3f3f8', // eslint-disable-line no-hex-colors/no-hex-colors
        prim: '#E3E1E2', // eslint-disable-line no-hex-colors/no-hex-colors
        clinkPurple: '#8e8dbe' // eslint-disable-line no-hex-colors/no-hex-colors
      }
    }
  }
}));

describe('MuiDataGrid Theme', () => {
  it('exports a valid theme object', () => {
    expect(MuiDataGrid).toBeDefined();
    expect(typeof MuiDataGrid).toBe('object');
  });

  it('has styleOverrides property', () => {
    expect(MuiDataGrid).toHaveProperty('styleOverrides');
    expect(typeof MuiDataGrid.styleOverrides).toBe('object');
  });

  it('has root styles defined', () => {
    expect(MuiDataGrid.styleOverrides).toHaveProperty('root');
    expect(typeof MuiDataGrid.styleOverrides.root).toBe('object');
  });

  it('includes border color settings', () => {
    const rootStyles = MuiDataGrid.styleOverrides.root;
    expect(rootStyles).toHaveProperty('borderColor');
    expect(rootStyles.borderColor).toBe('#e2e2ee'); // eslint-disable-line no-hex-colors/no-hex-colors
  });

  it('includes border radius and width settings', () => {
    const rootStyles = MuiDataGrid.styleOverrides.root;
    expect(rootStyles).toHaveProperty('borderRadius', 0);
    expect(rootStyles).toHaveProperty('borderWidth', '1px 0 0');
  });

  it('includes MuiDataGrid-row styles', () => {
    const rootStyles = MuiDataGrid.styleOverrides.root;
    expect(Object.keys(rootStyles)).toContain('& .MuiDataGrid-row');
    
    const rowStyles = rootStyles['& .MuiDataGrid-row'];
    expect(rowStyles).toBeDefined();
    expect(Object.keys(rowStyles)).toContain('&:nth-of-type(even)');
    expect(Object.keys(rowStyles)).toContain('&.boq--section');
    expect(Object.keys(rowStyles)).toContain('&.boq--grouped_heading');
  });

  it('includes MuiDataGrid-cell styles', () => {
    const rootStyles = MuiDataGrid.styleOverrides.root;
    expect(Object.keys(rootStyles)).toContain('& .MuiDataGrid-cell');
    
    const cellStyles = rootStyles['& .MuiDataGrid-cell'];
    expect(cellStyles).toBeDefined();
    expect(cellStyles).toHaveProperty('borderBottomColor', '#e2e2ee'); // eslint-disable-line no-hex-colors/no-hex-colors
    expect(cellStyles).toHaveProperty('textOverflow', 'ellipsis');
    expect(cellStyles).toHaveProperty('whiteSpace', 'pre');
  });

  it('includes focus styles', () => {
    const rootStyles = MuiDataGrid.styleOverrides.root;
    const focusSelector = '& .MuiDataGrid-cell:focus-within, & .MuiDataGrid-colCell:focus-within,  & .MuiDataGrid-columnHeader:focus-within';
    expect(Object.keys(rootStyles)).toContain(focusSelector);
    
    const focusStyles = rootStyles[focusSelector];
    expect(focusStyles).toHaveProperty('outline', 0);
  });

  it('includes column container styles', () => {
    const rootStyles = MuiDataGrid.styleOverrides.root;
    expect(Object.keys(rootStyles)).toContain('& .MuiDataGrid-columnsContainer');
    
    const columnStyles = rootStyles['& .MuiDataGrid-columnsContainer'];
    expect(columnStyles).toHaveProperty('borderBottomColor', '#e2e2ee'); // eslint-disable-line no-hex-colors/no-hex-colors
  });

  it('includes column separator styles', () => {
    const rootStyles = MuiDataGrid.styleOverrides.root;
    expect(Object.keys(rootStyles)).toContain('& .MuiDataGrid-columnSeparator--resizable');
    
    const separatorStyles = rootStyles['& .MuiDataGrid-columnSeparator--resizable'];
    expect(separatorStyles).toHaveProperty('color', '#e2e2ee'); // eslint-disable-line no-hex-colors/no-hex-colors
  });

  it('includes focused row styles', () => {
    const rootStyles = MuiDataGrid.styleOverrides.root;
    expect(Object.keys(rootStyles)).toContain('& .MuiDataGrid-row.focusedNotSelected');
    
    const focusedRowStyles = rootStyles['& .MuiDataGrid-row.focusedNotSelected'];
    expect(focusedRowStyles).toHaveProperty('backgroundColor', '#8e8dbe'); // eslint-disable-line no-hex-colors/no-hex-colors
  });

  it('configures even row styles correctly', () => {
    const rootStyles = MuiDataGrid.styleOverrides.root;
    const evenRowStyles = rootStyles['& .MuiDataGrid-row']['&:nth-of-type(even)'];
    
    expect(evenRowStyles).toHaveProperty('backgroundColor', '#f3f3f8'); // eslint-disable-line no-hex-colors/no-hex-colors
    expect(evenRowStyles).toHaveProperty('&:hover');
    expect(evenRowStyles['&:hover']).toHaveProperty('backgroundColor', '#e2e2ee'); // eslint-disable-line no-hex-colors/no-hex-colors
  });

  it('configures BOQ section styles correctly', () => {
    const rootStyles = MuiDataGrid.styleOverrides.root;
    const sectionStyles = rootStyles['& .MuiDataGrid-row']['&.boq--section'];
    
    expect(sectionStyles).toHaveProperty('backgroundColor', '#E3E1E2'); // eslint-disable-line no-hex-colors/no-hex-colors
    expect(sectionStyles).toHaveProperty('fontWeight', 700);
  });

  it('configures BOQ grouped heading styles correctly', () => {
    const rootStyles = MuiDataGrid.styleOverrides.root;
    const headingStyles = rootStyles['& .MuiDataGrid-row']['&.boq--grouped_heading'];
    
    expect(headingStyles).toHaveProperty('fontWeight', 700);
    expect(headingStyles).toHaveProperty('textDecoration', 'underline');
  });

  it('configures show/hide cell styles correctly', () => {
    const rootStyles = MuiDataGrid.styleOverrides.root;
    const cellStyles = rootStyles['& .MuiDataGrid-cell'];
    
    expect(Object.keys(cellStyles)).toContain('&.show');
    expect(cellStyles['&.show']).toHaveProperty('opacity', '1');
    
    expect(Object.keys(cellStyles)).toContain('&.hide');
    expect(cellStyles['&.hide']).toHaveProperty('opacity', '0');
    expect(cellStyles['&.hide']).toHaveProperty('pointerEvents', 'none');
  });
});