import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import DeleteButton from './DeleteButton';

// Mock the BinIcon component
jest.mock('v1/global/public/images/svg/bin-icon.svg', () => () => (
  <div data-testid="bin-icon" />
));

describe('DeleteButton', () => {
  it('renders correctly with bin icon', () => {
    const mockHandleClick = jest.fn();
    render(<DeleteButton handleClick={mockHandleClick} />);

    // Check that the button is rendered
    const button = screen.getByRole('button', { name: /delete/i });
    expect(button).toBeInTheDocument();

    // Check that the bin icon is rendered
    const binIcon = screen.getByTestId('bin-icon');
    expect(binIcon).toBeInTheDocument();
  });

  it('calls handleClick when clicked', () => {
    const mockHandleClick = jest.fn();
    render(<DeleteButton handleClick={mockHandleClick} />);

    const button = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(button);

    // Verify the click handler was called
    expect(mockHandleClick).toHaveBeenCalledTimes(1);
  });

  it('has correct aria-label for accessibility', () => {
    const mockHandleClick = jest.fn();
    render(<DeleteButton handleClick={mockHandleClick} />);

    const button = screen.getByRole('button', { name: /delete/i });
    expect(button).toHaveAttribute('aria-label', 'delete');
  });

  it('has correct button type', () => {
    const mockHandleClick = jest.fn();
    render(<DeleteButton handleClick={mockHandleClick} />);

    const button = screen.getByRole('button', { name: /delete/i });
    expect(button).toHaveAttribute('type', 'button');
  });
});
