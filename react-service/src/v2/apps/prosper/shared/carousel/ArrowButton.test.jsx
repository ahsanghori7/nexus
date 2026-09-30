import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ArrowButton from './ArrowButton';

describe('ArrowButton', () => {
  const defaultProps = {
    src: 'test-icon-src',
    className: 'test-class',
    nextItem: jest.fn(),
    label: 'Test Arrow Button',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    render(<ArrowButton {...defaultProps} />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  test('renders with correct aria-label', () => {
    render(<ArrowButton {...defaultProps} />);
    const button = screen.getByLabelText('Test Arrow Button');
    expect(button).toBeInTheDocument();
  });

  test('applies correct className', () => {
    render(<ArrowButton {...defaultProps} />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('test-class');
  });

  test('renders Image component with correct props', () => {
    render(<ArrowButton {...defaultProps} />);
    const image = screen.getByRole('img');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'test-icon-src');
    expect(image).toHaveAttribute('alt', 'Test Arrow Button');
  });

  test('calls nextItem function when clicked', () => {
    const mockNextItem = jest.fn();
    render(<ArrowButton {...defaultProps} nextItem={mockNextItem} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(mockNextItem).toHaveBeenCalledTimes(1);
  });

  test('renders with default props when optional props are not provided', () => {
    render(<ArrowButton />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label', '');
    expect(button).not.toHaveClass('test-class');
  });

  test('handles empty string label correctly', () => {
    render(<ArrowButton {...defaultProps} label="" />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', '');
  });

  test('image alt attribute matches label toString()', () => {
    const numericLabel = 123;
    render(<ArrowButton {...defaultProps} label={numericLabel} />);
    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('alt', '123');
  });

  test('snapshot test', () => {
    const { container } = render(<ArrowButton {...defaultProps} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});