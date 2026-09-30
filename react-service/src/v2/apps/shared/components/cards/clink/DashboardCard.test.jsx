import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import DashboardCard from './DashboardCard';

// Mock the clink-components
jest.mock('clink-components', () => ({
  Card: ({ children, theme, handleClick }) => (
    <div 
      data-testid="card" 
      data-theme={theme}
      onClick={handleClick}
      role={handleClick ? "button" : undefined}
    >
      {children}
    </div>
  ),
  CardBody: ({ children, theme }) => (
    <div data-testid="card-body" data-theme={theme}>{children}</div>
  ),
  CardImage: ({ theme, src, alt }) => (
    <img 
      data-testid="card-image" 
      data-theme={theme} 
      src={src} 
      alt={alt} 
    />
  ),
  CardTitle: ({ children, theme }) => (
    <div data-testid="card-title" data-theme={theme}>{children}</div>
  ),
  CardSubtitle: ({ children, theme }) => (
    <div data-testid="card-subtitle" data-theme={theme}>{children}</div>
  ),
}));

describe('DashboardCard', () => {
  const mockHandleClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<DashboardCard />);
    expect(screen.getByTestId('card')).toBeInTheDocument();
  });

  it('renders with default theme', () => {
    render(<DashboardCard />);
    
    expect(screen.getByTestId('card')).toHaveAttribute('data-theme', 'clink-dashboard-card');
    expect(screen.getByTestId('card-title')).toHaveAttribute('data-theme', 'clink-dashboard-card');
    expect(screen.getByTestId('card-body')).toHaveAttribute('data-theme', 'clink-dashboard-card');
    expect(screen.getByTestId('card-subtitle')).toHaveAttribute('data-theme', 'clink-dashboard-card');
    expect(screen.getByTestId('card-image')).toHaveAttribute('data-theme', 'clink-dashboard-card');
  });

  it('renders with custom theme', () => {
    render(<DashboardCard theme="custom-theme" />);
    
    expect(screen.getByTestId('card')).toHaveAttribute('data-theme', 'custom-theme');
    expect(screen.getByTestId('card-title')).toHaveAttribute('data-theme', 'custom-theme');
    expect(screen.getByTestId('card-body')).toHaveAttribute('data-theme', 'custom-theme');
    expect(screen.getByTestId('card-subtitle')).toHaveAttribute('data-theme', 'custom-theme');
    expect(screen.getByTestId('card-image')).toHaveAttribute('data-theme', 'custom-theme');
  });

  it('renders image with correct src', () => {
    const imageSrc = 'https://example.com/image.jpg';
    render(<DashboardCard imageSrc={imageSrc} />);
    
    const image = screen.getByTestId('card-image');
    expect(image).toHaveAttribute('src', imageSrc);
    expect(image).toHaveAttribute('alt', '');
  });

  it('renders card name', () => {
    const cardName = 'Test Card Name';
    render(<DashboardCard cardName={cardName} />);
    
    expect(screen.getByText(cardName)).toBeInTheDocument();
    expect(screen.getByTestId('card-subtitle')).toContainElement(screen.getByText(cardName));
  });

  it('renders dropdown when provided', () => {
    const dropdown = <select data-testid="test-dropdown"><option>Option 1</option></select>;
    render(<DashboardCard dropdown={dropdown} />);
    
    expect(screen.getByTestId('test-dropdown')).toBeInTheDocument();
    expect(screen.getByTestId('card-body')).toContainElement(screen.getByTestId('test-dropdown'));
  });

  it('does not render dropdown when not provided', () => {
    render(<DashboardCard />);
    
    const cardBody = screen.getByTestId('card-body');
    expect(cardBody.children).toHaveLength(1); // Only CardSubtitle
  });

  it('calls handleClick when card is clicked', () => {
    render(<DashboardCard handleClick={mockHandleClick} />);
    
    const card = screen.getByTestId('card');
    fireEvent.click(card);
    
    expect(mockHandleClick).toHaveBeenCalledTimes(1);
  });

  it('renders card as button when handleClick is provided', () => {
    render(<DashboardCard handleClick={mockHandleClick} />);
    
    const card = screen.getByTestId('card');
    expect(card).toHaveAttribute('role', 'button');
  });

  it('does not render card as button when handleClick is not provided', () => {
    render(<DashboardCard />);
    
    const card = screen.getByTestId('card');
    expect(card).not.toHaveAttribute('role');
  });

  it('renders with all props combined', () => {
    const props = {
      theme: 'custom-theme',
      imageSrc: 'https://example.com/custom-image.jpg',
      cardName: 'Custom Card',
      handleClick: mockHandleClick,
      dropdown: <button data-testid="custom-dropdown">Custom Dropdown</button>
    };
    
    render(<DashboardCard {...props} />);
    
    expect(screen.getByTestId('card')).toHaveAttribute('data-theme', 'custom-theme');
    expect(screen.getByTestId('card-image')).toHaveAttribute('src', 'https://example.com/custom-image.jpg');
    expect(screen.getByText('Custom Card')).toBeInTheDocument();
    expect(screen.getByTestId('custom-dropdown')).toBeInTheDocument();
    expect(screen.getByTestId('card')).toHaveAttribute('role', 'button');
  });

  it('handles empty cardName', () => {
    render(<DashboardCard cardName="" />);
    
    const subtitle = screen.getByTestId('card-subtitle');
    expect(subtitle).toBeInTheDocument();
    expect(subtitle).toBeEmptyDOMElement();
  });

  it('handles undefined imageSrc', () => {
    render(<DashboardCard imageSrc={undefined} />);
    
    const image = screen.getByTestId('card-image');
    expect(image).not.toHaveAttribute('src');
  });
});