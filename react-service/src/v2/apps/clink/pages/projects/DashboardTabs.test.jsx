import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import DashboardTabs from './DashboardTabs';

// Mock the ActionsTable component
jest.mock('./ActionsTable', () => {
  return function MockActionsTable({ items, clinkAccount, type }) {
    return (
      <div data-testid={`actions-table-${type}`}>
        Actions Table - {type} - Items: {items?.length || 0}
      </div>
    );
  };
});

// Mock clink-components
jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: {
        clinkLightPurple: '#9c27b0',
        white: '#ffffff',
      },
    },
  },
}));

describe('DashboardTabs Component', () => {
  const mockProps = {
    dashboardActions: {
      pending: [{ id: 1 }, { id: 2 }],
      completed: [{ id: 3 }],
    },
    clinkAccount: { id: 'test-account' },
    fetchDashboardActions: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Arrange → Act → Assert
  it('renders without crashing', () => {
    // Arrange & Act
    render(<DashboardTabs {...mockProps} />);
    
    // Assert
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('displays dashboard title', () => {
    // Arrange & Act
    render(<DashboardTabs {...mockProps} />);
    
    // Assert
    const title = screen.getByText('Dashboard');
    expect(title).toBeInTheDocument();
    // Note: MUI Typography mock doesn't preserve style props, so we only test presence
  });

  it('renders tabs with correct labels', () => {
    // Arrange & Act
    render(<DashboardTabs {...mockProps} />);
    
    // Assert - Using testid since MUI mocks don't create proper tab roles
    expect(screen.getByText('Actions Required')).toBeInTheDocument();
    expect(screen.getByText('Actions Completed')).toBeInTheDocument();
  });

  it('renders filter dropdown with all options', () => {
    // Arrange & Act
    render(<DashboardTabs {...mockProps} />);
    
    // Assert - Check select and menu items (i18n mock returns keys as-is)
    const select = screen.getByTestId('mui-select');
    expect(select).toBeInTheDocument();
    expect(screen.getByText('all')).toBeInTheDocument();
    expect(screen.getByText('this-week')).toBeInTheDocument();
    expect(screen.getByText('last-week')).toBeInTheDocument();
    expect(screen.getByText('older')).toBeInTheDocument();
  });

  it('shows pending actions table by default (first tab)', () => {
    // Arrange & Act
    render(<DashboardTabs {...mockProps} />);
    
    // Assert
    expect(screen.getByTestId('actions-table-pending')).toBeInTheDocument();
    expect(screen.queryByTestId('actions-table-completed')).not.toBeInTheDocument();
  });

  it('switches to completed actions table when second tab is clicked', () => {
    // Arrange
    render(<DashboardTabs {...mockProps} />);
    
    // Act - Use the hidden button that simulates tab change
    const tabChangeButton = screen.getByTestId('tab-change-button');
    fireEvent.click(tabChangeButton);
    
    // Assert
    expect(screen.getByTestId('actions-table-completed')).toBeInTheDocument();
    expect(screen.queryByTestId('actions-table-pending')).not.toBeInTheDocument();
  });

  it('renders filter options correctly', () => {
    // Arrange & Act
    render(<DashboardTabs {...mockProps} />);
    
    // Assert - Verify all filter options are present (i18n mock returns keys as-is)
    expect(screen.getByText('all')).toBeInTheDocument();
    expect(screen.getByText('this-week')).toBeInTheDocument();
    expect(screen.getByText('last-week')).toBeInTheDocument();
    expect(screen.getByText('older')).toBeInTheDocument();
  });

  it('handles empty dashboardActions prop', () => {
    // Arrange
    const emptyProps = {
      ...mockProps,
      dashboardActions: {},
    };
    
    // Act
    render(<DashboardTabs {...emptyProps} />);
    
    // Assert
    expect(screen.getByTestId('actions-table-pending')).toBeInTheDocument();
    expect(screen.getByText('Actions Table - pending - Items: 0')).toBeInTheDocument();
  });

  it('handles undefined dashboardActions prop', () => {
    // Arrange
    const undefinedProps = {
      ...mockProps,
      dashboardActions: undefined,
    };
    
    // Act
    render(<DashboardTabs {...undefinedProps} />);
    
    // Assert
    expect(screen.getByTestId('actions-table-pending')).toBeInTheDocument();
    expect(screen.getByText('Actions Table - pending - Items: 0')).toBeInTheDocument();
  });

  it('passes correct props to ActionsTable components', () => {
    // Arrange & Act
    render(<DashboardTabs {...mockProps} />);
    
    // Assert - Check pending tab (default)
    expect(screen.getByText('Actions Table - pending - Items: 2')).toBeInTheDocument();
    
    // Act - Switch to completed tab using the hidden button
    const tabChangeButton = screen.getByTestId('tab-change-button');
    fireEvent.click(tabChangeButton);
    
    // Assert - Check completed tab
    expect(screen.getByText('Actions Table - completed - Items: 1')).toBeInTheDocument();
  });

  it('renders tabs container with correct attributes', () => {
    // Arrange & Act
    render(<DashboardTabs {...mockProps} />);
    
    // Assert - Check the tabs mock structure
    const tabsContainer = screen.getByTestId('tabs');
    expect(tabsContainer).toHaveAttribute('aria-label', 'Dashboard Tabs');
    expect(tabsContainer).toHaveAttribute('data-value', '0');
  });

  it('renders combobox for filter select', () => {
    // Arrange & Act
    render(<DashboardTabs {...mockProps} />);
    
    // Assert
    const combobox = screen.getByRole('combobox');
    expect(combobox).toBeInTheDocument();
    expect(combobox).toHaveAttribute('value', 'all');
  });
});