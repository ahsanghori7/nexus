import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { StyledButon } from './Content.styled';

describe('StyledButon', () => {
  it('should render without crashing', () => {
    render(<StyledButon>Test Button</StyledButon>);
    expect(screen.getByText('Test Button')).toBeInTheDocument();
  });

  it('should render as button element', () => {
    render(<StyledButon>Click me</StyledButon>);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Click me');
  });

  it('should apply custom styling', () => {
    const { container } = render(<StyledButon>Styled Button</StyledButon>);
    const buttonElement = container.firstChild;
    expect(buttonElement).toHaveStyle('width: 182px');
    expect(buttonElement).toHaveStyle('border-radius: 5px');
    expect(buttonElement).toHaveStyle('font-size: 17px');
  });

  it('should handle disabled state', () => {
    render(<StyledButon disabled>Disabled Button</StyledButon>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('should render with proper type attribute', () => {
    render(<StyledButon type="submit">Submit Button</StyledButon>);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'submit');
  });
});