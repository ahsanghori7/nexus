import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

const { MemoryRouter } = jest.requireActual('react-router-dom');

// Mock the dependencies
jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: {
        clinkBlack: '#000000',
      },
    },
  },
}));

jest.mock('v2/apps/clink/layout/navbar/HeaderIcon', () => {
  const React = require('react');

  const MockHeaderIcon = ({ handleClick, iconLink }) =>
    React.createElement(
      'div',
      {
        'data-testid': 'header-icon',
        onClick: handleClick,
        style: iconLink?.sx,
      },
      'Header Icon'
    );

  MockHeaderIcon.displayName = 'HeaderIcon';
  return MockHeaderIcon;
});

jest.mock('./Links', () => {
  const React = require('react');
  const createIcon = (testId, text) =>
    React.createElement('span', { 'data-testid': testId }, text);

  return {
    __esModule: true,
    main: [
      {
        label: 'Projects',
        icon: createIcon('projects-icon', '🏠'),
        url: '/main-contractor',
      },
      {
        label: 'Team Manager',
        icon: createIcon('team-icon', '👥'),
        url: '/main-contractor/add_team',
      },
    ],
    secondary: [
      {
        label: 'Help & Support',
        icon: createIcon('help-icon', '❓'),
        url: 'https://knowledge.c-link.com/en/guides',
        target: '_blank',
      },
    ],
  };
});

jest.mock('v2/helpers/roles', () => ({
  admin: { id: 1 },
  superAdmin: { id: 2 },
}));

jest.mock('v2/hooks/useFeatureFlag', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    checkFeature: jest.fn(() => true), // Default to true for tests
  })),
}));

// Import component after mocks
import Sidebar from './index';
import useFeatureFlag from 'v2/hooks/useFeatureFlag';

// Helper to render with router
const renderWithRouter = (component) => {
  return render(
    <MemoryRouter>
      {component}
    </MemoryRouter>
  );
};

describe('Sidebar', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    // Default behavior: feature flag returns true
    useFeatureFlag.mockReturnValue({
      checkFeature: jest.fn(() => true),
    });
  });

  it('renders without crashing', () => {
    const mockToggleDrawer = jest.fn(() => jest.fn());
    const useSidebar = [false, mockToggleDrawer];
    
    renderWithRouter(<Sidebar useSidebar={useSidebar} />);
    
    // Should render drawer (closed by default)
    const drawer = screen.getByTestId('sidebar-drawer');
    expect(drawer).toBeInTheDocument();
    expect(drawer).toHaveAttribute('data-open', 'false');
  });

  it('renders drawer content when open', () => {
    const mockToggleDrawer = jest.fn(() => jest.fn());
    const useSidebar = [true, mockToggleDrawer];
    
    renderWithRouter(<Sidebar useSidebar={useSidebar} />);
    
    // Should render header icon
    expect(screen.getByTestId('header-icon')).toBeInTheDocument();
    
    // Should render main navigation items
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Team Manager')).toBeInTheDocument();
    
    // Should render secondary navigation items
    expect(screen.getByText('Help & Support')).toBeInTheDocument();
    
    // Should render icons
    expect(screen.getByTestId('projects-icon')).toBeInTheDocument();
    expect(screen.getByTestId('team-icon')).toBeInTheDocument();
    expect(screen.getByTestId('help-icon')).toBeInTheDocument();
  });

  it('calls toggleDrawer when clicking on drawer content', () => {
    const mockToggleFunction = jest.fn();
    const mockToggleDrawer = jest.fn(() => mockToggleFunction);
    const useSidebar = [true, mockToggleDrawer];
    
    renderWithRouter(<Sidebar useSidebar={useSidebar} />);
    
    // Click on the drawer content box (should have presentation role)
    const drawerBox = screen.getByRole('presentation');
    fireEvent.click(drawerBox);
    
    // Should call toggleDrawer(false)
    expect(mockToggleDrawer).toHaveBeenCalledWith(false);
  });

  it('calls toggleDrawer when clicking header icon', () => {
    const mockToggleFunction = jest.fn();
    const mockToggleDrawer = jest.fn(() => mockToggleFunction);
    const useSidebar = [true, mockToggleDrawer];
    
    renderWithRouter(<Sidebar useSidebar={useSidebar} />);
    
    // Click on the header icon
    const headerIcon = screen.getByTestId('header-icon');
    fireEvent.click(headerIcon);
    
    // Should call the toggle function
    expect(mockToggleFunction).toHaveBeenCalled();
  });

  it('handles noReact prop correctly', () => {
    const mockToggleDrawer = jest.fn(() => jest.fn());
    const useSidebar = [true, mockToggleDrawer];
    
    renderWithRouter(<Sidebar useSidebar={useSidebar} noReact={true} />);
    
    // Should still render navigation items
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Team Manager')).toBeInTheDocument();
    expect(screen.getByText('Help & Support')).toBeInTheDocument();
  });

  it('has correct drawer structure', () => {
    const mockToggleDrawer = jest.fn(() => jest.fn());
    const useSidebar = [true, mockToggleDrawer];
    
    renderWithRouter(<Sidebar useSidebar={useSidebar} />);
    
    // Should have presentation role on the Box
    const drawerBox = screen.getByRole('presentation');
    expect(drawerBox).toBeInTheDocument();
    
    // Should have correct width
    expect(drawerBox).toHaveStyle('width: 250px');
  });

  it('handles default useSidebar prop', () => {
    // Should not crash with default prop
    expect(() => {
      renderWithRouter(<Sidebar />);
    }).not.toThrow();
  });

  it('renders with closed drawer by default', () => {
    const mockToggleDrawer = jest.fn(() => jest.fn());
    const useSidebar = [false, mockToggleDrawer];
    
    renderWithRouter(<Sidebar useSidebar={useSidebar} />);
    
    // Drawer should be present but content should not be visible
    const drawer = screen.getByTestId('sidebar-drawer');
    expect(drawer).toBeInTheDocument();
    expect(drawer).toHaveAttribute('data-open', 'false');
  });

  it('passes iconLink props to HeaderIcon', () => {
    const mockToggleDrawer = jest.fn(() => jest.fn());
    const useSidebar = [true, mockToggleDrawer];
    
    renderWithRouter(<Sidebar useSidebar={useSidebar} />);
    
    // Header icon should receive iconLink prop with sx styles
    const headerIcon = screen.getByTestId('header-icon');
    expect(headerIcon).toHaveStyle('pointer-events: none');
  });

  it('hides secondary navigation when feature flag is disabled', () => {
    // Mock feature flag to return false
    useFeatureFlag.mockReturnValue({
      checkFeature: jest.fn(() => false),
    });

    const mockToggleDrawer = jest.fn(() => jest.fn());
    const useSidebar = [true, mockToggleDrawer];
    
    renderWithRouter(<Sidebar useSidebar={useSidebar} />);
    
    // Should render main navigation items
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Team Manager')).toBeInTheDocument();
    
    // Should NOT render secondary navigation items
    expect(screen.queryByText('Help & Support')).not.toBeInTheDocument();
    expect(screen.queryByTestId('help-icon')).not.toBeInTheDocument();
  });

  it('shows secondary navigation when feature flag is enabled', () => {
    // Mock feature flag to return true
    useFeatureFlag.mockReturnValue({
      checkFeature: jest.fn(() => true),
    });

    const mockToggleDrawer = jest.fn(() => jest.fn());
    const useSidebar = [true, mockToggleDrawer];
    
    renderWithRouter(<Sidebar useSidebar={useSidebar} />);
    
    // Should render secondary navigation items
    expect(screen.getByText('Help & Support')).toBeInTheDocument();
    expect(screen.getByTestId('help-icon')).toBeInTheDocument();
  });

  it('calls checkFeature with correct parameters', () => {
    const mockCheckFeature = jest.fn(() => true);
    useFeatureFlag.mockReturnValue({
      checkFeature: mockCheckFeature,
    });

    const mockToggleDrawer = jest.fn(() => jest.fn());
    const useSidebar = [true, mockToggleDrawer];
    
    renderWithRouter(<Sidebar useSidebar={useSidebar} />);
    
    // Should call checkFeature with ACL_HELP_SUPPORT flag
    expect(mockCheckFeature).toHaveBeenCalledWith('ACL_HELP_SUPPORT');
  });
});
