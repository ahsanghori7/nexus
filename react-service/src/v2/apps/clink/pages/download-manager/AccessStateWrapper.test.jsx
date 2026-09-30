import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Container before importing the component
jest.mock('@mui/material', () => ({
  Container: ({ children, ...props }) => (
    <div data-testid="mock-container" {...props}>
      {children}
    </div>
  ),
}));

import AccessStateWrapper from './AccessStateWrapper';

describe('AccessStateWrapper', () => {
  const MockComponent = () => <div data-testid="mock-component">Mock Content</div>;

  it('renders without crashing', () => {
    render(<AccessStateWrapper component={MockComponent} />);
    const container = screen.getByTestId('mock-container');
    expect(container).toBeInTheDocument();
  });

  it('renders the provided component', () => {
    render(<AccessStateWrapper component={MockComponent} />);
    expect(screen.getByTestId('mock-component')).toBeInTheDocument();
    expect(screen.getByText('Mock Content')).toBeInTheDocument();
  });

  it('renders Container with maxWidth md', () => {
    render(<AccessStateWrapper component={MockComponent} />);
    const container = screen.getByTestId('mock-container');
    expect(container).toHaveAttribute('maxWidth', 'md');
  });

  it('passes component prop correctly', () => {
    const CustomComponent = () => <div data-testid="custom">Custom Component</div>;
    render(<AccessStateWrapper component={CustomComponent} />);
    expect(screen.getByTestId('custom')).toBeInTheDocument();
    expect(screen.getByText('Custom Component')).toBeInTheDocument();
  });

  it('renders multiple different components when called multiple times', () => {
    const Component1 = () => <div>Component 1</div>;
    const Component2 = () => <div>Component 2</div>;

    const { rerender } = render(<AccessStateWrapper component={Component1} />);
    expect(screen.getByText('Component 1')).toBeInTheDocument();

    rerender(<AccessStateWrapper component={Component2} />);
    expect(screen.getByText('Component 2')).toBeInTheDocument();
    expect(screen.queryByText('Component 1')).not.toBeInTheDocument();
  });

  it('handles component with props', () => {
    const ComponentWithProps = ({ message }) => <div>{message}</div>;
    const WrappedComponent = () => <ComponentWithProps message="Test Message" />;
    
    render(<AccessStateWrapper component={WrappedComponent} />);
    expect(screen.getByText('Test Message')).toBeInTheDocument();
  });

  it('renders container as a wrapper around component', () => {
    render(<AccessStateWrapper component={MockComponent} />);
    const container = screen.getByTestId('mock-container');
    const mockComponent = screen.getByTestId('mock-component');
    
    expect(container).toContainElement(mockComponent);
  });

  it('applies correct styling to container', () => {
    render(<AccessStateWrapper component={MockComponent} />);
    const container = screen.getByTestId('mock-container');
    expect(container).toHaveAttribute('sx');
  });
});
