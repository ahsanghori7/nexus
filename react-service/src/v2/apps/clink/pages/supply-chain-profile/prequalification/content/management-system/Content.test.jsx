import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the MUI alpha function
jest.mock('@mui/material/styles', () => ({
  withStyles: (styles) => (Component) => Component,
  alpha: jest.fn((color, opacity) => `rgba(0,0,0,${opacity})`),
}));

// Mock the dependencies
jest.mock('v2/helpers/date', () => ({
  expiredDate: jest.fn(),
}));

jest.mock('v2/apps/clink/pages/supply-chain-profile/prequalification/ExpirationDate', () => {
  return function MockExpirationDate({ date, label }) {
    return <div data-testid="expiration-date" data-date={date} data-label={label}>Expiration Date</div>;
  };
});

jest.mock('./Data', () => {
  return function MockManagerSystemData({ data, aid, accordion }) {
    return (
      <div data-testid="manager-system-data" data-aid={aid}>
        <span data-testid="data-content">{JSON.stringify(data)}</span>
      </div>
    );
  };
});

import ManagerSystemContent from './Content';

describe('ManagerSystemContent', () => {
  const mockExpiredDate = require('v2/helpers/date').expiredDate;

  beforeEach(() => {
    jest.clearAllMocks();
    mockExpiredDate.mockReturnValue(false);
  });

  const defaultProps = {
    aid: 'test-aid',
    data: {
      label: 'Test Management System',
      date: '2024-12-31',
    },
    accordion: false,
  };

  it('renders without crashing when data is provided', () => {
    render(<ManagerSystemContent {...defaultProps} />);
    expect(screen.getByTestId('mui-box')).toBeInTheDocument();
    expect(screen.getByTestId('manager-system-data')).toBeInTheDocument();
  });

  it('returns null when no data is provided', () => {
    const { container } = render(<ManagerSystemContent aid="test" />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null when data is null', () => {
    const { container } = render(
      <ManagerSystemContent aid="test" data={null} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('passes correct props to ManagerSystemData', () => {
    render(<ManagerSystemContent {...defaultProps} />);
    const dataComponent = screen.getByTestId('manager-system-data');
    expect(dataComponent).toHaveAttribute('data-aid', 'test-aid');
    expect(dataComponent).toBeInTheDocument();
  });

  it('renders with expired date', () => {
    mockExpiredDate.mockReturnValue(true);
    render(<ManagerSystemContent {...defaultProps} />);
    expect(screen.getByTestId('manager-system-data')).toBeInTheDocument();
  });

  it('renders without date', () => {
    const props = {
      ...defaultProps,
      data: { label: 'Test System' }, // no date
    };
    render(<ManagerSystemContent {...props} />);
    expect(screen.getByTestId('manager-system-data')).toBeInTheDocument();
  });

  it('renders with accordion prop', () => {
    const props = { ...defaultProps, accordion: true };
    render(<ManagerSystemContent {...props} />);
    expect(screen.getByTestId('manager-system-data')).toBeInTheDocument();
  });
});