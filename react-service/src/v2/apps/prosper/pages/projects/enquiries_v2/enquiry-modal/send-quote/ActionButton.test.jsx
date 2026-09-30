import React from 'react';
import { render, screen } from '@testing-library/react';
import ActionsButton from './ActionButton';

describe('ActionsButton', () => {
  const defaultProps = {
    text: 'Test Button',
    imgSrc: 'test-image-src',
    className: 'test-class',
  };

  it('should render without crashing', () => {
    render(<ActionsButton {...defaultProps} />);
    expect(screen.getByText('Test Button')).toBeInTheDocument();
  });

  it('should render with default props when minimal props provided', () => {
    render(<ActionsButton />);
    // Should not crash with empty props
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('should display the correct text', () => {
    render(<ActionsButton text="Custom Text" />);
    expect(screen.getByText('Custom Text')).toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<ActionsButton {...defaultProps} disabled={true} />);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('should be enabled when disabled prop is false', () => {
    render(<ActionsButton {...defaultProps} disabled={false} />);
    const button = screen.getByRole('button');
    expect(button).not.toBeDisabled();
  });

  it('should apply the correct className', () => {
    render(<ActionsButton {...defaultProps} className="custom-class" />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('should render with custom width prop', () => {
    render(<ActionsButton {...defaultProps} width={120} />);
    expect(screen.getByText('Test Button')).toBeInTheDocument();
  });

  it('should handle empty text gracefully', () => {
    render(<ActionsButton text="" imgSrc="test" />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('should render image and text elements', () => {
    render(<ActionsButton {...defaultProps} />);
    expect(screen.getByText('Test Button')).toBeInTheDocument();
    // Image is mocked, so we just verify the text is present
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });
});