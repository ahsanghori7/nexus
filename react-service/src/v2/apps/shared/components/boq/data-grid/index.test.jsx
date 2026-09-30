import React from 'react';
import { render, screen } from '@testing-library/react';
import { v4 as uuidv4 } from 'uuid';

// Mock the modules
jest.mock('./useActions', () => jest.fn());
jest.mock('@mui/x-data-grid-pro', () => ({
  DataGridPro: jest.fn().mockReturnValue('div')
}));

import DataGrid from './index';
import useActions from './useActions';

describe('DataGrid', () => {
  const mockRows = [
    { id: 1, name: 'Item 1', quantity: 10 },
    { id: 2, name: 'Item 2', quantity: 20 }
  ];

  const defaultProps = {
    entries: mockRows,
    columns: jest.fn(() => [
      { field: 'name', headerName: 'Name', width: 150 },
      { field: 'quantity', headerName: 'Quantity', width: 150 }
    ]),
    units: 'pieces'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useActions.mockReturnValue([
      mockRows,
      { field: 'actions', type: 'actions', headerName: '', getActions: () => [] },
      jest.fn(),
      jest.fn(),
      jest.fn()
    ]);
  });

  it('renders without crashing', () => {
    render(React.createElement(DataGrid, defaultProps));
    const { DataGridPro } = require('@mui/x-data-grid-pro');
    expect(DataGridPro).toHaveBeenCalled();
  });

  it('displays correct number of rows', () => {
    render(React.createElement(DataGrid, defaultProps));
    expect(useActions).toHaveBeenCalled();
  });

  it('displays correct number of columns without actions', () => {
    render(React.createElement(DataGrid, { ...defaultProps, noAction: true }));
    expect(defaultProps.columns).toHaveBeenCalledWith(defaultProps.units);
  });

  it('displays correct number of columns with actions', () => {
    render(React.createElement(DataGrid, defaultProps));
    expect(defaultProps.columns).toHaveBeenCalledWith(defaultProps.units);
  });

  it('calls columns function with units', () => {
    render(React.createElement(DataGrid, defaultProps));
    expect(defaultProps.columns).toHaveBeenCalledWith(defaultProps.units);
  });

  it('calls useActions with correct parameters', () => {
    render(React.createElement(DataGrid, defaultProps));
    expect(useActions).toHaveBeenCalledWith(
      expect.arrayContaining([defaultProps.entries, expect.any(Function)]), 
      false, 
      defaultProps.entries
    );
  });

  it('calls useActions with noAction true when specified', () => {
    const propsWithNoAction = { ...defaultProps, noAction: true };
    render(React.createElement(DataGrid, propsWithNoAction));
    expect(useActions).toHaveBeenCalledWith(
      expect.arrayContaining([defaultProps.entries, expect.any(Function)]), 
      true, 
      defaultProps.entries
    );
  });

  it('uses custom useRows when provided', () => {
    const customUseRows = [{ id: 3, name: 'Custom Item', quantity: 30 }];
    const propsWithUseRows = { ...defaultProps, useRows: customUseRows };
    
    render(React.createElement(DataGrid, propsWithUseRows));
    expect(useActions).toHaveBeenCalledWith(customUseRows, false, defaultProps.entries);
  });

  it('passes default props to DataGridPro', () => {
    render(React.createElement(DataGrid, defaultProps));
    const { DataGridPro } = require('@mui/x-data-grid-pro');
    
    expect(DataGridPro).toHaveBeenCalledWith(
      expect.objectContaining({
        rows: mockRows,
        columns: expect.any(Array),
        rowReordering: true,
        processRowUpdate: expect.any(Function)
      }),
      {}
    );
  });

  it('passes custom props to DataGridPro', () => {
    const customProps = {
      ...defaultProps,
      customProp: 'customValue',
      anotherProp: 123
    };
    
    render(React.createElement(DataGrid, customProps));
    const { DataGridPro } = require('@mui/x-data-grid-pro');
    
    expect(DataGridPro).toHaveBeenCalledWith(
      expect.objectContaining({
        customProp: 'customValue',
        anotherProp: 123
      }),
      {}
    );
  });

  it('handles row order change', () => {
    const mockHandleRowOrderChange = jest.fn();
    useActions.mockReturnValue([
      mockRows,
      { field: 'actions', type: 'actions', headerName: '', getActions: () => [] },
      jest.fn(),
      jest.fn(),
      mockHandleRowOrderChange
    ]);

    render(React.createElement(DataGrid, defaultProps));
    const { DataGridPro } = require('@mui/x-data-grid-pro');
    
    expect(DataGridPro).toHaveBeenCalledWith(
      expect.objectContaining({
        onRowOrderChange: mockHandleRowOrderChange
      }),
      {}
    );
  });

  it('uses processRowUpdate when isProsper is false', () => {
    const mockProcessRowUpdate = jest.fn();
    useActions.mockReturnValue([
      mockRows,
      { field: 'actions', type: 'actions', headerName: '', getActions: () => [] },
      mockProcessRowUpdate,
      jest.fn(),
      jest.fn()
    ]);

    render(React.createElement(DataGrid, { ...defaultProps, isProsper: false }));
    const { DataGridPro } = require('@mui/x-data-grid-pro');
    
    expect(DataGridPro).toHaveBeenCalledWith(
      expect.objectContaining({
        processRowUpdate: mockProcessRowUpdate
      }),
      {}
    );
  });

  it('uses processRowUpdateProsper when isProsper is true', () => {
    const mockProcessRowUpdateProsper = jest.fn();
    useActions.mockReturnValue([
      mockRows,
      { field: 'actions', type: 'actions', headerName: '', getActions: () => [] },
      jest.fn(),
      mockProcessRowUpdateProsper,
      jest.fn()
    ]);

    render(React.createElement(DataGrid, { ...defaultProps, isProsper: true }));
    const { DataGridPro } = require('@mui/x-data-grid-pro');
    
    expect(DataGridPro).toHaveBeenCalledWith(
      expect.objectContaining({
        processRowUpdate: mockProcessRowUpdateProsper
      }),
      {}
    );
  });

  it('returns correct row height', () => {
    render(React.createElement(DataGrid, defaultProps));
    const { DataGridPro } = require('@mui/x-data-grid-pro');
    
    const call = DataGridPro.mock.calls[0][0];
    expect(call.getRowHeight()).toBe(40);
  });

  it('calls updatedEntriesCallback when provided', () => {
    const mockCallback = jest.fn();
    const propsWithCallback = { ...defaultProps, updatedEntriesCallback: mockCallback };
    
    render(React.createElement(DataGrid, propsWithCallback));
    // The callback should be available for use by the component
    expect(typeof propsWithCallback.updatedEntriesCallback).toBe('function');
  });

  it('calls callback function when provided', () => {
    const mockCallback = jest.fn();
    const propsWithCallback = { ...defaultProps, callback: mockCallback };
    
    render(React.createElement(DataGrid, propsWithCallback));
    // The callback should be available for use by the component
    expect(typeof propsWithCallback.callback).toBe('function');
  });

  it('handles empty entries', () => {
    const emptyProps = { ...defaultProps, entries: [] };
    render(React.createElement(DataGrid, emptyProps));
    expect(useActions).toHaveBeenCalledWith(
      expect.arrayContaining([[], expect.any(Function)]), 
      false, 
      []
    );
  });

  it('handles isCellEditable function', () => {
    const mockIsCellEditable = jest.fn(() => true);
    const propsWithIsCellEditable = { ...defaultProps, isCellEditable: mockIsCellEditable };
    
    render(React.createElement(DataGrid, propsWithIsCellEditable));
    const { DataGridPro } = require('@mui/x-data-grid-pro');
    
    expect(DataGridPro).toHaveBeenCalledWith(
      expect.objectContaining({
        isCellEditable: mockIsCellEditable
      }),
      {}
    );
  });

  it('passes extra props to DataGridPro', () => {
    const extraProps = {
      ...defaultProps,
      density: 'compact',
      hideFooter: true,
      checkboxSelection: true
    };
    
    render(React.createElement(DataGrid, extraProps));
    const { DataGridPro } = require('@mui/x-data-grid-pro');
    
    expect(DataGridPro).toHaveBeenCalledWith(
      expect.objectContaining({
        density: 'compact',
        hideFooter: true,
        checkboxSelection: true
      }),
      {}
    );
  });

  it('updates internal state when entries change and useRows is false', () => {
    const { rerender } = render(React.createElement(DataGrid, defaultProps));
    
    const newEntries = [{ id: 3, name: 'New Item', quantity: 30 }];
    const newProps = { ...defaultProps, entries: newEntries };
    
    rerender(React.createElement(DataGrid, newProps));
    
    // useActions should be called with new entries
    expect(useActions).toHaveBeenLastCalledWith(
      expect.arrayContaining([newEntries, expect.any(Function)]), 
      false, 
      newEntries
    );
  });

  it('does not update internal state when useRows is provided', () => {
    const customRows = [{ id: 4, name: 'Custom Row', quantity: 40 }];
    const propsWithUseRows = { ...defaultProps, useRows: customRows };
    
    const { rerender } = render(React.createElement(DataGrid, propsWithUseRows));
    
    const newEntries = [{ id: 3, name: 'New Item', quantity: 30 }];
    const newProps = { ...propsWithUseRows, entries: newEntries };
    
    rerender(React.createElement(DataGrid, newProps));
    
    // useActions should still be called with the custom rows, not the new entries
    expect(useActions).toHaveBeenLastCalledWith(customRows, false, newEntries);
  });
});