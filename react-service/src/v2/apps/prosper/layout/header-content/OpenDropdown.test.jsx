import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import OpenDropdown from './OpenDropdown';

// Mock clink-components
jest.mock('clink-components', () => ({
  ProfileSection: ({ profileProps, ...props }) => (
    <div data-testid="profile-section" {...props}>
      Profile Section {profileProps.isOpen ? 'Open' : 'Closed'}
    </div>
  ),
  CONSTANTS: {
    dimensions: {
      MD_SCREEN: 768
    }
  }
}));

describe('OpenDropdown', () => {
  const mockTheme = {};
  
  const defaultProps = {
    isOpen: false,
    align: 'right',
    handleClick: jest.fn(),
    profileProps: { name: 'Test User' }
  };

  const renderWithTheme = (component) => render(
    <ThemeProvider theme={mockTheme}>{component}</ThemeProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    renderWithTheme(<OpenDropdown {...defaultProps} />);
    
    expect(screen.getByTestId('profile-section')).toBeInTheDocument();
  });

  test('renders ProfileSection with correct props', () => {
    renderWithTheme(<OpenDropdown {...defaultProps} />);
    
    const profileSection = screen.getByTestId('profile-section');
    expect(profileSection).toHaveTextContent('Profile Section Closed');
  });

  test('shows open state when isOpen is true', () => {
    renderWithTheme(<OpenDropdown {...defaultProps} isOpen={true} />);
    
    const profileSection = screen.getByTestId('profile-section');
    expect(profileSection).toHaveTextContent('Profile Section Open');
  });

  test('calls handleClick when clicked', () => {
    const handleClick = jest.fn();
    renderWithTheme(<OpenDropdown {...defaultProps} handleClick={handleClick} />);
    
    const container = screen.getByTestId('profile-section').parentElement;
    fireEvent.click(container);
    
    expect(handleClick).toHaveBeenCalledWith(true); // !isOpen (false) = true
  });

  test('calls handleClick with correct value when already open', () => {
    const handleClick = jest.fn();
    renderWithTheme(
      <OpenDropdown {...defaultProps} isOpen={true} handleClick={handleClick} />
    );
    
    const container = screen.getByTestId('profile-section').parentElement;
    fireEvent.click(container);
    
    expect(handleClick).toHaveBeenCalledWith(false); // !isOpen (true) = false
  });

  test('passes additional props to ProfileSection', () => {
    const additionalProps = {
      customProp: 'test',
      anotherProp: 123
    };
    
    renderWithTheme(
      <OpenDropdown {...defaultProps} {...additionalProps} />
    );
    
    const profileSection = screen.getByTestId('profile-section');
    expect(profileSection).toBeInTheDocument();
  });

  test('merges profileProps correctly', () => {
    const profileProps = { name: 'John Doe', id: 123 };
    renderWithTheme(
      <OpenDropdown {...defaultProps} profileProps={profileProps} />
    );
    
    const profileSection = screen.getByTestId('profile-section');
    expect(profileSection).toHaveTextContent('Profile Section Closed');
  });

  test('applies correct styling through styled component', () => {
    const { container } = renderWithTheme(<OpenDropdown {...defaultProps} />);
    
    const styledContainer = container.firstChild;
    expect(styledContainer).toBeInTheDocument();
    
    // Check that styled component styles are applied
    const styles = window.getComputedStyle(styledContainer);
    expect(styles.width).toBe('231px');
  });

  test('snapshot test', () => {
    const { container } = renderWithTheme(<OpenDropdown {...defaultProps} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  test('snapshot test when open', () => {
    const { container } = renderWithTheme(
      <OpenDropdown {...defaultProps} isOpen={true} />
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});