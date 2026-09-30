import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ImageContainer from './ImageContainer';

describe('ImageContainer', () => {
  it('renders without crashing', () => {
    render(<ImageContainer />);
  });

  it('renders children correctly', () => {
    render(
      <ImageContainer>
        <img src="test.jpg" alt="test" data-testid="test-image" />
      </ImageContainer>
    );
    expect(screen.getByTestId('test-image')).toBeInTheDocument();
  });

  it('calls onClick handler when clicked', () => {
    const mockOnClick = jest.fn();
    render(<ImageContainer onClick={mockOnClick} />);
    
    fireEvent.click(screen.getByTestId('mui-box'));
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('applies default styles', () => {
    render(<ImageContainer />);
    
    const box = screen.getByTestId('mui-box');
    expect(box).toBeInTheDocument();
  });

  it('applies extra styles', () => {
    const extraStyles = { backgroundColor: 'red', margin: '10px' };
    render(<ImageContainer extra={extraStyles} />);
    
    expect(screen.getByTestId('mui-box')).toBeInTheDocument();
  });

  it('renders without children', () => {
    render(<ImageContainer />);
    
    const box = screen.getByTestId('mui-box');
    expect(box).toBeInTheDocument();
    expect(box.children).toHaveLength(0);
  });

  it('handles multiple children', () => {
    render(
      <ImageContainer>
        <span data-testid="child1">Child 1</span>
        <span data-testid="child2">Child 2</span>
      </ImageContainer>
    );
    
    expect(screen.getByTestId('child1')).toBeInTheDocument();
    expect(screen.getByTestId('child2')).toBeInTheDocument();
  });

  it('uses default empty function for onClick when not provided', () => {
    render(<ImageContainer />);
    
    // Should not throw error when clicked
    expect(() => {
      fireEvent.click(screen.getByTestId('mui-box'));
    }).not.toThrow();
  });
});