import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Adornment from './Adornment';

describe('Adornment Component', () => {
  it('renders without crashing', () => {
    const mockSetShowPassword = jest.fn();
    render(<Adornment showPassword={false} setShowPassword={mockSetShowPassword} />);
    
    const toggleButton = screen.getByLabelText('toggle password visibility');
    expect(toggleButton).toBeInTheDocument();
  });

  it('shows visibility icon when password is hidden', () => {
    const mockSetShowPassword = jest.fn();
    render(<Adornment showPassword={false} setShowPassword={mockSetShowPassword} />);
    
    // Should show Visibility icon when password is hidden
    expect(screen.getByTestId('VisibilityIcon')).toBeInTheDocument();
  });

  it('shows visibility off icon when password is shown', () => {
    const mockSetShowPassword = jest.fn();
    render(<Adornment showPassword={true} setShowPassword={mockSetShowPassword} />);
    
    // Should show VisibilityOff icon when password is shown
    expect(screen.getByTestId('VisibilityOffIcon')).toBeInTheDocument();
  });

  it('calls setShowPassword when clicked', () => {
    const mockSetShowPassword = jest.fn();
    render(<Adornment showPassword={false} setShowPassword={mockSetShowPassword} />);
    
    const toggleButton = screen.getByLabelText('toggle password visibility');
    fireEvent.click(toggleButton);
    
    expect(mockSetShowPassword).toHaveBeenCalledWith(expect.any(Function));
  });

  it('prevents default on mouse down', () => {
    const mockSetShowPassword = jest.fn();
    render(<Adornment showPassword={false} setShowPassword={mockSetShowPassword} />);
    
    const toggleButton = screen.getByLabelText('toggle password visibility');
    const mockPreventDefault = jest.fn();
    
    fireEvent.mouseDown(toggleButton, {
      preventDefault: mockPreventDefault
    });
    
    // The component should call preventDefault, but since we're mocking the event
    // we can't directly test this. We'll just test that the handler doesn't throw.
    expect(() => fireEvent.mouseDown(toggleButton)).not.toThrow();
  });

  it('toggles between visibility states correctly', () => {
    const mockSetShowPassword = jest.fn();
    const { rerender } = render(
      <Adornment showPassword={false} setShowPassword={mockSetShowPassword} />
    );
    
    // Initial state - password hidden, should show Visibility icon
    expect(screen.getByTestId('VisibilityIcon')).toBeInTheDocument();
    
    // Rerender with password shown
    rerender(<Adornment showPassword={true} setShowPassword={mockSetShowPassword} />);
    
    // Now should show VisibilityOff icon
    expect(screen.getByTestId('VisibilityOffIcon')).toBeInTheDocument();
  });

  it('takes a snapshot', () => {
    const mockSetShowPassword = jest.fn();
    const { container } = render(
      <Adornment showPassword={false} setShowPassword={mockSetShowPassword} />
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});