import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import '@testing-library/jest-dom';
import ProcurementScheduleTable from './ProcurementScheduleTable';

/* ----------------------------------
   Mocks
----------------------------------- */

// Interactive DataGridPro mock
jest.mock('@mui/x-data-grid-pro', () => {
  const React = require('react');

  return {
    DataGridPro: ({ rows, slots, onCellEditCommit }) => (
      <div data-testid="data-grid-pro">
        {rows.length === 0 ? (
          slots?.noRowsOverlay ? (
            <slots.noRowsOverlay />
          ) : null
        ) : (
          rows.map((row) => (
            <div key={row.id} data-testid={`row-${row.id}`}>
              <span>{row.name}</span>

              <button
                data-testid={`edit-cell-${row.id}`}
                onClick={() =>
                  onCellEditCommit?.({
                    id: row.id,
                    field: 'name',
                    value: 'Updated Name',
                  })
                }
              >
                Edit
              </button>
            </div>
          ))
        )}

        <div data-testid="pagination">Pagination</div>
      </div>
    ),

    GridColumnMenu: () => <div data-testid="grid-column-menu" />,
  };
});

// Columns helper mock
jest.mock('./procurement-schedule-table-columns', () => ({
  getProcurementTableColumns: jest.fn(() => [
    { field: 'id', headerName: 'ID' },
    { field: 'name', headerName: 'Name' },
    { field: 'status', headerName: 'Status' },
  ]),
}));

// date-fns mock
jest.mock('date-fns', () => ({
  format: jest.fn(() => '1 Jan 2024'),
}));

/* ----------------------------------
   Helpers
----------------------------------- */

const theme = createTheme();

const renderWithTheme = (ui) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

/* ----------------------------------
   Tests
----------------------------------- */

describe('ProcurementScheduleTable', () => {
  const defaultProps = {
    rowData: [
      { id: 1, name: 'Package 1', status: 'In Progress' },
      { id: 2, name: 'Package 2', status: 'Completed' },
    ],
    handleCellEditCommit: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /* ---------- Rendering ---------- */

  it('renders DataGridPro with rows', () => {
    renderWithTheme(<ProcurementScheduleTable {...defaultProps} />);

    expect(screen.getByTestId('data-grid-pro')).toBeInTheDocument();
    expect(screen.getByTestId('row-1')).toBeInTheDocument();
    expect(screen.getByTestId('row-2')).toBeInTheDocument();
  });

  it('shows No Records Found when no rows exist', () => {
    renderWithTheme(
      <ProcurementScheduleTable {...defaultProps} rowData={[]} />,
    );

    expect(screen.getByText('No Records Found')).toBeInTheDocument();
  });

  /* ---------- Interaction ---------- */

  it('calls handleCellEditCommit when edit button is clicked', () => {
    const handleCellEditCommit = jest.fn();

    renderWithTheme(
      <ProcurementScheduleTable
        rowData={[{ id: 1, name: 'Package 1' }]}
        handleCellEditCommit={handleCellEditCommit}
      />,
    );

    fireEvent.click(screen.getByTestId('edit-cell-1'));

    expect(handleCellEditCommit).toHaveBeenCalledWith({
      id: 1,
      field: 'name',
      value: 'Updated Name',
    });
  });

  /* ---------- Columns integration ---------- */

  it('passes required handlers to getProcurementTableColumns', () => {
    const {
      getProcurementTableColumns,
    } = require('./procurement-schedule-table-columns');

    renderWithTheme(<ProcurementScheduleTable {...defaultProps} />);

    expect(getProcurementTableColumns).toHaveBeenCalledTimes(1);

    const args = getProcurementTableColumns.mock.calls[0][0];

    expect(args).toEqual(
      expect.objectContaining({
        rowData: defaultProps.rowData,
        handleTooltipOpen: expect.any(Function),
        handleTooltipClose: expect.any(Function),
        handleMilestoneTooltipOpen: expect.any(Function),
        handleMilestoneTooltipClose: expect.any(Function),
        formatUKDate: expect.any(Function),
      }),
    );
  });

  /* ---------- Date formatting ---------- */

  it('formats date using UK format', () => {
    const { format } = require('date-fns');
    const {
      getProcurementTableColumns,
    } = require('./procurement-schedule-table-columns');

    renderWithTheme(<ProcurementScheduleTable {...defaultProps} />);

    const { formatUKDate } = getProcurementTableColumns.mock.calls[0][0];

    const date = new Date('2024-01-01');
    formatUKDate(date);

    expect(format).toHaveBeenCalledWith(date, 'd MMM yyyy');
  });

  /* ---------- State safety ---------- */

  it('tooltip handlers can be called safely', () => {
    const {
      getProcurementTableColumns,
    } = require('./procurement-schedule-table-columns');

    renderWithTheme(<ProcurementScheduleTable {...defaultProps} />);

    const args = getProcurementTableColumns.mock.calls[0][0];

    expect(() =>
      args.handleTooltipOpen({ currentTarget: {} }, 1),
    ).not.toThrow();

    expect(() => args.handleTooltipClose()).not.toThrow();
  });

  /* ---------- Rerender ---------- */

  it('re-renders when rowData changes', () => {
    const { rerender } = renderWithTheme(
      <ProcurementScheduleTable {...defaultProps} />,
    );

    expect(screen.getByTestId('row-1')).toBeInTheDocument();

    rerender(
      <ThemeProvider theme={theme}>
        <ProcurementScheduleTable
          {...defaultProps}
          rowData={[{ id: 3, name: 'New Package' }]}
        />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('row-3')).toBeInTheDocument();
    expect(screen.queryByTestId('row-1')).not.toBeInTheDocument();
  });
});
