import React from 'react';
import { render } from '@testing-library/react';
import DocHeader from './DocHeader';

// Mock the required dependencies
jest.mock('v2/helpers/date', () => ({
  getDateValuesV1: jest.fn((dateStr) => {
    // Mock implementation that returns a valid Date object
    return new Date(dateStr);
  }),
}));

jest.mock('v2/helpers/currency/v1', () => jest.fn((value) => `£${value / 100}`));

jest.mock('v2/helpers/user', () => ({
  getAccountLogo: jest.fn(() => 'mock-logo-url'),
}));

jest.mock('v2/helpers/flags', () => jest.fn(() => false));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: {
        darkCharcoal: '#333',
        eerieBlack: '#000',
      },
    },
    fonts: {
      proxima: 'Proxima Nova',
    },
  },
}));

describe('DocHeader component', () => {
  test('should render component with "N/A" if meta is missing quote or values', () => {
    const { getByText, queryAllByText } = render(<DocHeader meta={{}} />);
    const fieldTitles = ['Order Number', 'Date', 'Company', 'Status'];

    fieldTitles.forEach((title) => {
      expect(getByText(title)).toBeInTheDocument();
    });

    const nAValues = queryAllByText('N/A');
    expect(nAValues.length).toBe(fieldTitles.length);

    nAValues.forEach((nAElement) => {
      expect(nAElement).toHaveTextContent('N/A');
    });
    expect(getByText('Value')).toBeInTheDocument();
  });

  test('should render component if valid meta data is provided', () => {
    const meta = {
      quote: {
        order_number: 'ORD123',
        quote_created: '2025-02-17 10:00:00',
        status: 'Approved',
        subcontractor: { name: 'ABC Corp' },
      },
      values: { order_value: 12345 },
    };

    const { getByText } = render(<DocHeader meta={meta} />);

    expect(getByText('Order Number')).toBeInTheDocument();
    expect(getByText('ORD123')).toBeInTheDocument();
    expect(getByText('Date')).toBeInTheDocument();
    expect(getByText('Company')).toBeInTheDocument();
    expect(getByText('ABC Corp')).toBeInTheDocument();
    expect(getByText('Value')).toBeInTheDocument();
    expect(getByText('Status')).toBeInTheDocument();
    expect(getByText('Approved')).toBeInTheDocument();
  });
});
