import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Filters from './index';

// Mock the styled component
jest.mock('./styles/Filters.styled', () => {
  return function MockedStyledFiltersContainer({ children, className }) {
    return <div data-testid="styled-filters-container" className={className}>{children}</div>;
  };
});

describe('Filters Component', () => {
  it('renders without crashing', () => {
    render(<Filters />);
    expect(screen.getByTestId('styled-filters-container')).toBeInTheDocument();
  });

  it('displays default filter title', () => {
    render(<Filters />);
    expect(screen.getByText('Filters:')).toBeInTheDocument();
  });

  it('displays custom filter title when provided', () => {
    const customTitle = 'Custom Filter Title';
    render(<Filters filterTitle={customTitle} />);
    expect(screen.getByText(`${customTitle}:`)).toBeInTheDocument();
  });

  it('renders children correctly', () => {
    const testChild = <div data-testid="test-child">Test Child</div>;
    render(<Filters>{testChild}</Filters>);
    expect(screen.getByTestId('test-child')).toBeInTheDocument();
    expect(screen.getByText('Test Child')).toBeInTheDocument();
  });

  it('applies the correct CSS classes', () => {
    render(<Filters />);
    const container = screen.getByTestId('styled-filters-container');
    expect(container).toHaveClass('filters');
  });

  it('renders filter label with correct class', () => {
    render(<Filters />);
    const label = screen.getByText('Filters:');
    expect(label).toHaveClass('label-filters');
    expect(label.tagName).toBe('B');
  });

  it('renders multiple children correctly', () => {
    render(
      <Filters>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
      </Filters>
    );
    
    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
  });

  it('matches snapshot', () => {
    const { container } = render(
      <Filters filterTitle="Test Filters">
        <div>Test content</div>
      </Filters>
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});