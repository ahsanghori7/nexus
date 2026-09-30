import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Wrapper from './Wrapper';

// Mock the dependencies
jest.mock('v2/apps/clink/pages/supply-chain-profile/prequalification/content/Requester', () => {
  return function MockRequester({ children, aid, type, data, extra }) {
    return (
      <div data-testid="requester" data-aid={aid} data-type={type} data-extra={extra}>
        <span data-testid="requester-data">{JSON.stringify(data)}</span>
        {children}
      </div>
    );
  };
});

jest.mock('v2/helpers/date', () => ({
  expiredDate: jest.fn(),
}));

jest.mock('./styles', () => ({
  insurancesSx: {
    minWidth: '100px',
    height: '40px',
    top: '0px',
  },
}));

describe('Wrapper', () => {
  const mockExpiredDate = require('v2/helpers/date').expiredDate;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const defaultProps = {
    aid: 'test-aid',
    data: {
      date: '2023-12-31',
      label: 'Test Insurance',
    },
    extra: false,
  };

  it('renders without crashing', () => {
    mockExpiredDate.mockReturnValue(false);
    render(
      <Wrapper {...defaultProps}>
        <div data-testid="child">Test Child</div>
      </Wrapper>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('renders Requester when date is missing', () => {
    const props = {
      ...defaultProps,
      data: { label: 'Test' }, // no date
    };
    render(
      <Wrapper {...props}>
        <div data-testid="child">Test Child</div>
      </Wrapper>
    );
    expect(screen.getByTestId('requester')).toBeInTheDocument();
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('renders Requester when date is expired', () => {
    mockExpiredDate.mockReturnValue(true);
    render(
      <Wrapper {...defaultProps}>
        <div data-testid="child">Test Child</div>
      </Wrapper>
    );
    expect(screen.getByTestId('requester')).toBeInTheDocument();
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('renders children directly when date is valid and not expired', () => {
    mockExpiredDate.mockReturnValue(false);
    render(
      <Wrapper {...defaultProps}>
        <div data-testid="child">Test Child</div>
      </Wrapper>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.queryByTestId('requester')).not.toBeInTheDocument();
  });

  it('passes extra prop to Requester correctly', () => {
    const props = {
      ...defaultProps,
      data: { label: 'Test' }, // no date to trigger Requester
      extra: true,
    };
    render(
      <Wrapper {...props}>
        <div data-testid="child">Test Child</div>
      </Wrapper>
    );
    const requester = screen.getByTestId('requester');
    expect(requester).toHaveAttribute('data-extra', 'true');
  });

  it('passes correct props to Requester', () => {
    const props = {
      ...defaultProps,
      data: { label: 'Test Insurance' }, // no date
    };
    render(
      <Wrapper {...props}>
        <div>Child content</div>
      </Wrapper>
    );
    const requester = screen.getByTestId('requester');
    expect(requester).toHaveAttribute('data-aid', 'test-aid');
    expect(requester).toHaveAttribute('data-type', 'insurances');
  });
});