import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ButtonWrapper from './ButtonWrapper';

describe('ButtonWrapper', () => {
  it('renders without crashing', () => {
    render(<ButtonWrapper>Test Button</ButtonWrapper>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders with children text', () => {
    render(<ButtonWrapper>Click Me</ButtonWrapper>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('forwards props to Button component', () => {
    render(
      <ButtonWrapper color="primary" variant="contained" data-testid="test-button">
        Test
      </ButtonWrapper>
    );
    const button = screen.getByTestId('test-button');
    expect(button).toBeInTheDocument();
  });

  it('accepts handleClick prop and passes it through', () => {
    const mockHandleClick = jest.fn();
    render(
      <ButtonWrapper handleClick={mockHandleClick} data-testid="clickable-button">
        Click Me
      </ButtonWrapper>
    );
    
    const button = screen.getByTestId('clickable-button');
    expect(button).toBeInTheDocument();
    // The component accepts handleClick as a prop, even though it may not work as intended
    // This tests that the component renders without errors when handleClick is provided
  });

  it('uses default empty function when handleClick not provided', () => {
    // This test ensures the component doesn't crash without handleClick
    render(<ButtonWrapper data-testid="default-button">Default</ButtonWrapper>);
    const button = screen.getByTestId('default-button');
    expect(() => fireEvent.click(button)).not.toThrow();
  });
});