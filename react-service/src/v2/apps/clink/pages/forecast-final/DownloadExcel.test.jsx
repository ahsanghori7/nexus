import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import DownloadExcel from './DownloadExcel';

// Mock the worksheet and workbook objects
const mockWorksheet = {};
const mockWorkbook = {};

// Mock XLSX module with all required functions
jest.mock('xlsx', () => ({
  utils: {
    aoa_to_sheet: jest.fn(() => mockWorksheet),
    book_new: jest.fn(() => mockWorkbook),
    book_append_sheet: jest.fn(),
    encode_cell: jest.fn(({ r, c }) => `${String.fromCharCode(65 + c)}${r + 1}`), // A1, B1, etc.
  },
  writeFile: jest.fn(),
}));

// Mock i18next
jest.mock('v2/helpers/i18n', () => ({
  t: jest.fn((key) => key),
}));

// Mock parseFloatVal
jest.mock('v2/helpers/currency', () => ({
  parseFloatVal: jest.fn((value) => {
    if (typeof value === 'number') return value;
    return parseFloat(value) || 0;
  }),
}));

const XLSX = require('xlsx');

describe('DownloadExcel', () => {
  const mockProps = {
    data: {
      name: 'Test Project',
    },
    forecastList: [
      {
        package: 'Package 1',
        budget: '1000.50',
        order: '800.25',
        variations: '200.75',
        omissions: '-100.25',
        total: '900.75',
      },
    ],
    projectBudget: '1000.50',
    profitLoss: '100.25',
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Mock current date to ensure consistent filename generation
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-02-19'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders download button correctly', () => {
    render(<DownloadExcel {...mockProps} />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Download as Excel');
  });

  it('generates Excel file with correct data when clicked', () => {
    render(<DownloadExcel {...mockProps} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Check if XLSX utilities were called with correct data
    expect(XLSX.utils.book_new).toHaveBeenCalled();

    // Verify the data passed to aoa_to_sheet
    const callData = XLSX.utils.aoa_to_sheet.mock.calls[0][0];

    // Verify headers
    expect(callData[0]).toEqual([
      { v: 'Package', t: 's' },
      { v: 'Budget', t: 's' },
      { v: 'Order Value', t: 's' },
      { v: 'Variations', t: 's' },
      { v: 'Omissions', t: 's' },
      { v: 'Total Value', t: 's' }
    ]);

    // Verify first data row - ignore the 'w' property in comparison
    const firstDataRow = callData[1].map(({ v, t, z }) => ({ v, t, z }));
    expect(firstDataRow).toEqual([
      { v: 'Package 1', t: 's' },
      { v: 1000.50, t: 'n', z: '#,##0.00' },
      { v: 800.25, t: 'n', z: '#,##0.00' },
      { v: 200.75, t: 'n', z: '#,##0.00' },
      { v: -100.25, t: 'n', z: '#,##0.00' },
      { v: 900.75, t: 'n', z: '#,##0.00' }
    ]);

    // Verify file name format
    expect(XLSX.writeFile).toHaveBeenCalledWith(
      mockWorkbook,
      'Test Project_Forecast_Final_Accounts_20240219.xlsx',
      expect.any(Object)
    );
  });

  it('handles missing project name correctly', () => {
    const propsWithoutName = {
      ...mockProps,
      data: {},
    };

    render(<DownloadExcel {...propsWithoutName} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Verify default project name is used in filename
    expect(XLSX.writeFile).toHaveBeenCalledWith(
      mockWorkbook,
      'Project_Forecast_Final_Accounts_20240219.xlsx',
      expect.any(Object)
    );
  });

  it('formats numbers correctly with decimal places', () => {
    render(<DownloadExcel {...mockProps} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Get the data passed to aoa_to_sheet
    const callData = XLSX.utils.aoa_to_sheet.mock.calls[0][0];
    const [, firstDataRow] = callData;

    // Check number formatting for budget - ignore the 'w' property
    const { w, ...budgetCell } = firstDataRow[1];
    expect(budgetCell).toEqual({
      v: 1000.50,
      t: 'n',
      z: '#,##0.00'
    });
  });

  it('handles empty forecastList correctly', () => {
    const propsWithEmptyList = {
      data: {},
      forecastList: [],
      projectBudget: mockProps.projectBudget,
      profitLoss: mockProps.profitLoss
    };

    render(<DownloadExcel {...propsWithEmptyList} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Get the data passed to aoa_to_sheet
    const callData = XLSX.utils.aoa_to_sheet.mock.calls[0][0];

    // Filter out the 'w' property from the data for comparison
    const cleanedData = callData.map(row =>
      row.map(cell => {
        const { w, ...rest } = cell;
        return rest;
      })
    );

    // Verify the base structure is maintained even with empty data
    expect(cleanedData).toEqual([
      // Headers
      [
        { v: 'Package', t: 's' },
        { v: 'Budget', t: 's' },
        { v: 'Order Value', t: 's' },
        { v: 'Variations', t: 's' },
        { v: 'Omissions', t: 's' },
        { v: 'Total Value', t: 's' }
      ],
      // Summary section
      [],
      [{ v: 'Summary', t: 's' }],
      [
        { v: 'Project Budget', t: 's' },
        { v: 1000.50, t: 'n', z: '#,##0.00' }
      ],
      [
        { v: 'Profit/Loss', t: 's' },
        { v: 100.25, t: 'n', z: '#,##0.00' }
      ]
    ]);
  });

  it('handles invalid number values correctly', () => {
    const propsWithInvalidNumbers = {
      ...mockProps,
      forecastList: [{
        package: 'Package 1',
        budget: 'invalid',
        order: '',
        variations: null,
        omissions: undefined,
        total: 'NaN',
      }],
    };

    render(<DownloadExcel {...propsWithInvalidNumbers} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Get the data passed to aoa_to_sheet
    const callData = XLSX.utils.aoa_to_sheet.mock.calls[0][0];
    const [, firstDataRow] = callData;

    // All invalid numbers should be converted to 0
    expect(firstDataRow[1].v).toBe(0);
    expect(firstDataRow[2].v).toBe(0);
    expect(firstDataRow[3].v).toBe(0);
    expect(firstDataRow[4].v).toBe(0);
    expect(firstDataRow[5].v).toBe(0);
  });
});
