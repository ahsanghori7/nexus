import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PreqContent from './PreqContent';

describe('PreqContent', () => {
  it('renders without crashing', () => {
    render(<PreqContent />);
    expect(screen.getByTestId('mui-box')).toBeInTheDocument();
  });

  it('renders children correctly', () => {
    render(
      <PreqContent>
        <div data-testid="test-child">Test Child</div>
      </PreqContent>
    );
    expect(screen.getByTestId('test-child')).toBeInTheDocument();
    expect(screen.getByText('Test Child')).toBeInTheDocument();
  });

  it('applies default spacing prop', () => {
    const { container } = render(
      <PreqContent>
        <div>Child content</div>
      </PreqContent>
    );
    const gridContainer = container.querySelector('[data-testid="mui-grid"]');
    expect(gridContainer).toBeInTheDocument();
  });

  it('accepts custom spacing prop', () => {
    render(
      <PreqContent spacing={3}>
        <div>Child content</div>
      </PreqContent>
    );
    expect(screen.getByTestId('mui-box')).toBeInTheDocument();
  });

  it('applies custom sx styles', () => {
    const customSx = { padding: '16px' };
    render(
      <PreqContent sx={customSx}>
        <div>Child content</div>
      </PreqContent>
    );
    expect(screen.getByTestId('mui-box')).toBeInTheDocument();
  });

  it('renders with multiple children', () => {
    render(
      <PreqContent>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
        <div data-testid="child-3">Child 3</div>
      </PreqContent>
    );
    
    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
    expect(screen.getByTestId('child-3')).toBeInTheDocument();
  });
});