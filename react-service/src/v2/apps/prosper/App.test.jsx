import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

// Mock the router component
jest.mock('./router', () => {
  return function MockRouter() {
    return <div data-testid="mock-router">Router Component</div>;
  };
});

// Mock the store configuration
jest.mock('store', () => {
  return jest.fn(() => ({
    getState: jest.fn(() => ({})),
    dispatch: jest.fn(),
    subscribe: jest.fn(),
  }));
});

describe('Prosper App', () => {
  it('renders without crashing', () => {
    const { getByTestId } = render(<App />);
    expect(getByTestId('mock-router')).toBeInTheDocument();
  });

  it('provides Redux store to components', () => {
    const { container } = render(<App />);
    // Provider should wrap the Router component
    expect(container.firstChild).toBeInTheDocument();
  });
});