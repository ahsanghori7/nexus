import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the dependencies BEFORE importing the component
jest.mock('v2/helpers/php-globals', () => ({
  PHPAppClinkGloblals: jest.fn(() => ({
    isCostPlaningTool: false,
  })),
}));

jest.mock('clink-components', () => ({
  CONSTANTS: {
    s3: {
      iconClinkLogo: 'mock-logo-url',
    },
  },
}));

// Import the component AFTER setting up mocks
import HeaderIcon from './HeaderIcon';

describe('HeaderIcon', () => {
  it('renders without crashing', () => {
    render(<HeaderIcon />);
    
    // Should always render avatar button
    const avatarButton = screen.getByLabelText('account of current user');
    expect(avatarButton).toBeInTheDocument();
  });

  it('renders avatar with correct props', () => {
    render(<HeaderIcon />);
    
    const avatar = screen.getByTestId('mui-avatar');
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveAttribute('src', 'mock-logo-url');
    expect(avatar).toHaveAttribute('alt', 'c-link-icon');
  });

  it('has correct ARIA attributes on avatar button', () => {
    render(<HeaderIcon />);
    
    const avatarButton = screen.getByLabelText('account of current user');
    expect(avatarButton).toHaveAttribute('aria-controls', 'menu-appbar');
    expect(avatarButton).toHaveAttribute('aria-haspopup', 'true');
  });

  it('applies iconLink props to avatar button', () => {
    const iconLinkProps = {
      onClick: jest.fn(),
      'data-testid': 'custom-avatar-button',
    };
    
    render(<HeaderIcon iconLink={iconLinkProps} />);
    
    const avatarButton = screen.getByTestId('custom-avatar-button');
    expect(avatarButton).toBeInTheDocument();
    
    fireEvent.click(avatarButton);
    expect(iconLinkProps.onClick).toHaveBeenCalledTimes(1);
  });

  it('renders menu button when not cost planning tool', () => {
    render(<HeaderIcon />);
    
    // Since we mocked isCostPlaningTool as false, menu should be present
    const menuButton = screen.getByLabelText('menu');
    expect(menuButton).toBeInTheDocument();
  });

  it('calls handleClick when menu button is clicked', () => {
    const mockHandleClick = jest.fn();
    render(<HeaderIcon handleClick={mockHandleClick} />);
    
    const menuButton = screen.getByLabelText('menu');
    fireEvent.click(menuButton);
    
    expect(mockHandleClick).toHaveBeenCalledTimes(1);
  });

  it('renders with default empty handleClick function when none provided', () => {
    // Should not throw error when clicking without handleClick prop
    expect(() => {
      render(<HeaderIcon />);
      const menuButton = screen.getByLabelText('menu');
      fireEvent.click(menuButton);
    }).not.toThrow();
  });

  it('contains menu icon in menu button', () => {
    render(<HeaderIcon />);
    
    const menuIcon = screen.getByTestId('MenuIcon');
    expect(menuIcon).toBeInTheDocument();
  });
});