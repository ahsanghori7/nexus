import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import InsuranceData from './Data';

// Mock dependencies
jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: {
        bostonRed: '#dc3545',
        transparentGray: '#808080',
        white: '#ffffff',
        black: '#000000',
        clinkGreen: '#28a745',
      },
    },
  },
}));

jest.mock('v2/helpers/currency', () => ({
  __esModule: true,
  default: jest.fn((value) => value ? `$${value}` : null),
}));

jest.mock('v2/helpers/i18n', () => ({
  __esModule: true,
  default: {
    t: jest.fn((key) => {
      const translations = {
        'dollar': '$',
        'pound': '£',
        'certificate': 'Certificate',
      };
      return translations[key] || key;
    }),
  },
}));

jest.mock('v2/helpers/date', () => ({
  expiredDate: jest.fn((date) => false), // Default to not expired
}));

jest.mock('v2/apps/clink/pages/supply-chain-profile/prequalification/ExpirationDate', () => {
  return function MockExpirationDate({ date, ...props }) {
    return (
      <div data-testid="expiration-date" {...props}>
        Expiration: {date}
      </div>
    );
  };
});

jest.mock('./styles', () => ({
  commonSx: {
    padding: '8px',
    borderRadius: '4px',
  },
}));

jest.mock('v2/helpers/prequal/documents', () => ({
  SCHEDULE_INDEMNITY: 'SCHEDULE_INDEMNITY',
  SCHEDULE_LIABILITY: 'SCHEDULE_LIABILITY',
}));

jest.mock('./ExtraDoc', () => {
  return function MockExtraDoc({ item, aid, data }) {
    return (
      <div data-testid="extra-doc">
        Extra Doc: {item.id}
      </div>
    );
  };
});

jest.mock('./Wrapper', () => {
  return function MockWrapper({ children, data, aid }) {
    return (
      <div data-testid="wrapper" data-aid={aid}>
        {children}
      </div>
    );
  };
});

const theme = createTheme();

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('InsuranceData Component', () => {
  const mockData = {
    price: 10000,
    date: '2025-12-31',
    label: 'General Insurance',
  };

  const mockCountry = {
    code: 'UK',
  };

  const mockAid = 'test-aid-123';

  it('renders with basic insurance data', () => {
    renderWithTheme(
      <InsuranceData data={mockData} aid={mockAid} country={mockCountry} />
    );

    expect(screen.getByTestId('wrapper')).toBeInTheDocument();
    expect(screen.getByTestId('expiration-date')).toBeInTheDocument();
    expect(screen.getByText('£')).toBeInTheDocument(); // Currency symbol for UK
  });

  it('renders with dollar currency for NZ country', () => {
    const nzCountry = { code: 'NZ' };
    renderWithTheme(
      <InsuranceData data={mockData} aid={mockAid} country={nzCountry} />
    );

    expect(screen.getByText('$')).toBeInTheDocument(); // Dollar symbol for NZ
  });

  it('renders with dollar currency for AUS country', () => {
    const ausCountry = { code: 'AUS' };
    renderWithTheme(
      <InsuranceData data={mockData} aid={mockAid} country={ausCountry} />
    );

    expect(screen.getByText('$')).toBeInTheDocument(); // Dollar symbol for Australia
  });

  it('renders N/A when price is not available', () => {
    const dataWithoutPrice = { ...mockData, price: null };
    renderWithTheme(
      <InsuranceData data={dataWithoutPrice} aid={mockAid} country={mockCountry} />
    );

    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('renders extra documents for schedule indemnity', () => {
    const dataWithExtra = {
      ...mockData,
      label: 'SCHEDULE_INDEMNITY',
      extra: [
        { id: 'doc1' },
        { id: 'doc2' },
      ],
    };

    renderWithTheme(
      <InsuranceData data={dataWithExtra} aid={mockAid} country={mockCountry} />
    );

    // Check that extra documents are rendered
    expect(screen.getAllByTestId('extra-doc')).toHaveLength(2);
    expect(screen.getByText('Extra Doc: doc1')).toBeInTheDocument();
    expect(screen.getByText('Extra Doc: doc2')).toBeInTheDocument();
  });

  it('renders extra documents for schedule liability', () => {
    const dataWithExtra = {
      ...mockData,
      label: 'SCHEDULE_LIABILITY',
      extra: [{ id: 'doc1' }],
    };

    renderWithTheme(
      <InsuranceData data={dataWithExtra} aid={mockAid} country={mockCountry} />
    );

    // Check that extra document is rendered
    expect(screen.getByTestId('extra-doc')).toBeInTheDocument();
    expect(screen.getByText('Extra Doc: doc1')).toBeInTheDocument();
  });

  it('does not render extra documents when label is not schedule type', () => {
    const dataWithExtra = {
      ...mockData,
      label: 'OTHER_TYPE',
      extra: [{ id: 'doc1' }],
    };

    renderWithTheme(
      <InsuranceData data={dataWithExtra} aid={mockAid} country={mockCountry} />
    );

    expect(screen.queryByTestId('extra-doc')).not.toBeInTheDocument();
  });

  it('renders with expired date styling', () => {
    const { expiredDate } = require('v2/helpers/date');
    expiredDate.mockReturnValue(true); // Mock as expired

    renderWithTheme(
      <InsuranceData data={mockData} aid={mockAid} country={mockCountry} />
    );

    expect(screen.getByTestId('wrapper')).toBeInTheDocument();
    // Component should still render even when expired
  });

  it('passes correct props to sub-components', () => {
    renderWithTheme(
      <InsuranceData data={mockData} aid={mockAid} country={mockCountry} />
    );

    const wrapper = screen.getByTestId('wrapper');
    expect(wrapper).toHaveAttribute('data-aid', mockAid);

    const expirationDate = screen.getByTestId('expiration-date');
    expect(expirationDate).toBeInTheDocument();
  });

  it('handles missing country prop gracefully', () => {
    renderWithTheme(
      <InsuranceData data={mockData} aid={mockAid} />
    );

    expect(screen.getByTestId('wrapper')).toBeInTheDocument();
    expect(screen.getByTestId('expiration-date')).toBeInTheDocument();
  });

  it('renders with different data variations', () => {
    const variantData = {
      price: 25000,
      date: '2024-06-15',
      label: 'Professional Liability',
      currency: 'EUR'
    };

    renderWithTheme(
      <InsuranceData data={variantData} aid={mockAid} country={mockCountry} />
    );

    expect(screen.getByTestId('wrapper')).toBeInTheDocument();
    expect(screen.getByTestId('expiration-date')).toBeInTheDocument();
  });

  it('handles null aid prop', () => {
    renderWithTheme(
      <InsuranceData data={mockData} aid={null} country={mockCountry} />
    );

    const wrapper = screen.getByTestId('wrapper');
    expect(wrapper).toBeInTheDocument();
    // When aid is null, the data-aid attribute should not be present
    expect(wrapper).not.toHaveAttribute('data-aid');
  });

  it('renders correctly with minimal required props', () => {
    const minimalData = { price: 5000 };
    
    renderWithTheme(
      <InsuranceData data={minimalData} aid={mockAid} />
    );

    expect(screen.getByTestId('wrapper')).toBeInTheDocument();
    expect(screen.getByTestId('expiration-date')).toBeInTheDocument();
  });
});