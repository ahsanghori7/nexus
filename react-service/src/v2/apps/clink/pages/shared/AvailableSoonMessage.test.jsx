import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AvailableSoonMessage from './AvailableSoonMessage';

// Mock the Loading component
jest.mock('v2/apps/shared/components/Loading', () => {
  return function MockLoading({ status, message }) {
    return (
      <div data-testid="loading-component">
        <div data-testid="loading-status">{status}</div>
        <div data-testid="loading-message">{message}</div>
      </div>
    );
  };
});

describe('AvailableSoonMessage', () => {
  it('renders without crashing', () => {
    render(<AvailableSoonMessage />);
    expect(screen.getByTestId('loading-component')).toBeInTheDocument();
  });

  it('passes correct props to Loading component', () => {
    render(<AvailableSoonMessage />);
    
    expect(screen.getByTestId('loading-status')).toHaveTextContent('error');
    expect(screen.getByTestId('loading-message')).toHaveTextContent('This page will be available soon');
  });

  it('matches snapshot', () => {
    const { container } = render(<AvailableSoonMessage />);
    expect(container.firstChild).toMatchSnapshot();
  });
});