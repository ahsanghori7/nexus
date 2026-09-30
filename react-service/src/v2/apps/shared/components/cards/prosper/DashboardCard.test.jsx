import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProsperDashboardCard from './DashboardCard';

// Mock the clink-components
jest.mock('clink-components', () => ({
  Card: ({ children, theme }) => <div data-testid="card" data-theme={theme}>{children}</div>,
  CardBody: ({ children, theme }) => <div data-testid="card-body" data-theme={theme}>{children}</div>,
  CardTitle: ({ children, theme }) => <div data-testid="card-title" data-theme={theme}>{children}</div>,
  CardSubtitle: ({ children, theme }) => <div data-testid="card-subtitle" data-theme={theme}>{children}</div>,
}));

// Mock the styled component
jest.mock('./styled', () => ({
  StyledRightContent: ({ children }) => <div data-testid="right-content">{children}</div>,
}));

describe('ProsperDashboardCard', () => {
  it('renders without crashing', () => {
    render(<ProsperDashboardCard />);
    expect(screen.getByTestId('card')).toBeInTheDocument();
  });

  it('renders with default theme', () => {
    render(<ProsperDashboardCard>Test content</ProsperDashboardCard>);
    
    expect(screen.getByTestId('card')).toHaveAttribute('data-theme', 'prosper-dashboard-card');
    expect(screen.getByTestId('card-body')).toHaveAttribute('data-theme', 'prosper-dashboard-card');
  });

  it('renders with custom theme', () => {
    render(
      <ProsperDashboardCard theme="custom-theme">
        Test content
      </ProsperDashboardCard>
    );
    
    expect(screen.getByTestId('card')).toHaveAttribute('data-theme', 'custom-theme');
    expect(screen.getByTestId('card-body')).toHaveAttribute('data-theme', 'custom-theme');
  });

  it('renders children in card body', () => {
    render(
      <ProsperDashboardCard>
        <p>Test child content</p>
      </ProsperDashboardCard>
    );
    
    expect(screen.getByText('Test child content')).toBeInTheDocument();
    expect(screen.getByTestId('card-body')).toContainElement(screen.getByText('Test child content'));
  });

  it('renders title when provided', () => {
    render(
      <ProsperDashboardCard title="Test Title">
        Test content
      </ProsperDashboardCard>
    );
    
    expect(screen.getByTestId('card-title')).toBeInTheDocument();
    expect(screen.getByTestId('card-subtitle')).toBeInTheDocument();
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('does not render title when not provided', () => {
    render(<ProsperDashboardCard>Test content</ProsperDashboardCard>);
    
    expect(screen.queryByTestId('card-title')).not.toBeInTheDocument();
    expect(screen.queryByTestId('card-subtitle')).not.toBeInTheDocument();
  });

  it('renders optional right content when provided', () => {
    const rightContent = <button>Right Button</button>;
    
    render(
      <ProsperDashboardCard 
        title="Test Title" 
        optionalRightContent={rightContent}
      >
        Test content
      </ProsperDashboardCard>
    );
    
    expect(screen.getByTestId('right-content')).toBeInTheDocument();
    expect(screen.getByText('Right Button')).toBeInTheDocument();
  });

  it('does not render right content when not provided', () => {
    render(
      <ProsperDashboardCard title="Test Title">
        Test content
      </ProsperDashboardCard>
    );
    
    expect(screen.queryByTestId('right-content')).not.toBeInTheDocument();
  });

  it('renders title without right content', () => {
    render(
      <ProsperDashboardCard title="Test Title">
        Test content
      </ProsperDashboardCard>
    );
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByTestId('card-title')).toBeInTheDocument();
    expect(screen.queryByTestId('right-content')).not.toBeInTheDocument();
  });

  it('renders complex children correctly', () => {
    render(
      <ProsperDashboardCard title="Dashboard">
        <div>
          <h3>Section Title</h3>
          <p>Section content</p>
          <button>Action Button</button>
        </div>
      </ProsperDashboardCard>
    );
    
    expect(screen.getByText('Section Title')).toBeInTheDocument();
    expect(screen.getByText('Section content')).toBeInTheDocument();
    expect(screen.getByText('Action Button')).toBeInTheDocument();
  });
});