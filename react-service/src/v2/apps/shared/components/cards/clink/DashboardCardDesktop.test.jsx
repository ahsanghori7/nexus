import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import DashboardCardDesktop from './DashboardCardDesktop';

// Mock clink-components
jest.mock('clink-components', () => ({
  Card: ({ children, handleClick, theme }) => (
    <div data-testid="card" data-theme={theme} onClick={handleClick}>
      {children}
    </div>
  ),
  CardBody: ({ children, theme }) => (
    <div data-testid="card-body" data-theme={theme}>
      {children}
    </div>
  ),
  CardSubtitle: ({ children, theme }) => (
    <div data-testid="card-subtitle" data-theme={theme}>
      {children}
    </div>
  )
}));

// Mock the styled components
jest.mock('./styled', () => ({
  StyledWrapperWithImage: ({ children, imageSrc, imageSrcHover, dropdown }) => (
    <div 
      data-testid="styled-wrapper-with-image"
      data-image-src={imageSrc}
      data-image-src-hover={imageSrcHover}
      data-dropdown={dropdown}
    >
      {children}
    </div>
  )
}));

describe('DashboardCardDesktop', () => {
  const defaultProps = {
    cardName: 'Test Card',
    handleClick: jest.fn(),
    imageSrc: 'test-image.png',
    imageSrcHover: 'test-image-hover.png'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<DashboardCardDesktop {...defaultProps} />);
    expect(screen.getByTestId('card')).toBeInTheDocument();
  });

  it('displays card name when no dropdown', () => {
    render(<DashboardCardDesktop {...defaultProps} dropdown={null} />);
    expect(screen.getByText('Test Card')).toBeInTheDocument();
  });

  it('displays dropdown when provided', () => {
    const dropdownComponent = <select><option>Option 1</option></select>;
    render(<DashboardCardDesktop {...defaultProps} dropdown={dropdownComponent} />);
    
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.queryByText('Test Card')).not.toBeInTheDocument();
  });

  it('uses default theme when not provided', () => {
    render(<DashboardCardDesktop {...defaultProps} />);
    
    expect(screen.getByTestId('card')).toHaveAttribute('data-theme', 'clink-dashboard-card-desktop');
    expect(screen.getByTestId('card-body')).toHaveAttribute('data-theme', 'clink-dashboard-card-desktop');
    expect(screen.getByTestId('card-subtitle')).toHaveAttribute('data-theme', 'clink-dashboard-card-desktop');
  });

  it('uses custom theme when provided', () => {
    const customTheme = 'custom-theme';
    render(<DashboardCardDesktop {...defaultProps} theme={customTheme} />);
    
    expect(screen.getByTestId('card')).toHaveAttribute('data-theme', customTheme);
    expect(screen.getByTestId('card-body')).toHaveAttribute('data-theme', customTheme);
    expect(screen.getByTestId('card-subtitle')).toHaveAttribute('data-theme', customTheme);
  });

  it('passes image props to StyledWrapperWithImage', () => {
    render(<DashboardCardDesktop {...defaultProps} />);
    
    const wrapper = screen.getByTestId('styled-wrapper-with-image');
    expect(wrapper).toHaveAttribute('data-image-src', 'test-image.png');
    expect(wrapper).toHaveAttribute('data-image-src-hover', 'test-image-hover.png');
  });

  it('passes dropdown prop to StyledWrapperWithImage', () => {
    const dropdownComponent = <div>Dropdown</div>;
    render(<DashboardCardDesktop {...defaultProps} dropdown={dropdownComponent} />);
    
    const wrapper = screen.getByTestId('styled-wrapper-with-image');
    expect(wrapper).toHaveAttribute('data-dropdown', '[object Object]'); // React element as string
  });

  it('calls handleClick when card is clicked', () => {
    const mockHandleClick = jest.fn();
    render(<DashboardCardDesktop {...defaultProps} handleClick={mockHandleClick} />);
    
    const card = screen.getByTestId('card');
    card.click();
    
    expect(mockHandleClick).toHaveBeenCalledTimes(1);
  });

  it('renders with all components in correct hierarchy', () => {
    render(<DashboardCardDesktop {...defaultProps} />);
    
    const card = screen.getByTestId('card');
    const cardBody = screen.getByTestId('card-body');
    const cardSubtitle = screen.getByTestId('card-subtitle');
    const wrapper = screen.getByTestId('styled-wrapper-with-image');
    
    expect(card).toBeInTheDocument();
    expect(cardBody).toBeInTheDocument();
    expect(cardSubtitle).toBeInTheDocument();
    expect(wrapper).toBeInTheDocument();
  });

  it('handles undefined dropdown correctly', () => {
    render(<DashboardCardDesktop {...defaultProps} dropdown={undefined} />);
    expect(screen.getByText('Test Card')).toBeInTheDocument();
  });

  it('handles false dropdown correctly', () => {
    render(<DashboardCardDesktop {...defaultProps} dropdown={false} />);
    // When dropdown is false (falsy), it should show the dropdown value (false)
    // The ?? operator only uses the right side when left side is null or undefined
    expect(screen.queryByText('Test Card')).not.toBeInTheDocument();
  });

  it('handles empty string dropdown correctly', () => {
    render(<DashboardCardDesktop {...defaultProps} dropdown="" />);
    expect(screen.queryByText('Test Card')).not.toBeInTheDocument();
  });
});