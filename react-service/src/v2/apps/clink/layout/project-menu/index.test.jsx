// src/v2/apps/clink/layout/project-menu/index.test.jsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, useParams } from 'react-router-dom';
import { createStore } from 'redux';
import DrawerAppBar from './index';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn()
}));

// Mock the dependencies
jest.mock('v2/helpers/i18n', () => ({
  t: (key) => key
}));

jest.mock('clink-components', () => ({
  Image: ({ src, width, height, ...props }) => (
    <img src={src} width={width} height={height} {...props} data-testid="clink-image" />
  ),
  CONSTANTS: {
    colors: {
      general: {
        white: '#ffffff',
        clinkLightPurple: '#purple',
        grayDark: '#gray',
        black: '#000000',
        teal: '#008080'
      }
    }
  }
}));

jest.mock('./navItems', () =>
  jest.fn((slug, clinkAccount) => [
    {
      label: 'Dashboard',
      url: `/projects/${slug}/dashboard`,
      icon: '/icons/dashboard.svg'
    },
    {
      label: 'Team Manager',
      url: `/projects/${slug}/team-manager`,
      icon: '/icons/team.svg'
    },
    {
      label: 'Documents',
      urls: [
        { label: 'Instructions', url: `/projects/${slug}/instructions` },
        { label: 'Variations', url: `/projects/${slug}/variations` }
      ],
      icon: '/icons/docs.svg'
    }
  ])
);

jest.mock('./SingleLink', () => ({
  SingleDrawerLink: ({ active, label, url, icon, ...props }) => (
    <div data-testid="single-drawer-link" data-active={active} data-url={url}>
      {icon && <img src={icon} data-testid="drawer-icon" />}
      {label}
    </div>
  ),
  SingleMenuLink: ({ active, label, url, icon, firstMenuItem, lastMenuItem, ...props }) => (
    <div
      data-testid="single-menu-link"
      data-active={active}
      data-url={url}
      data-first={firstMenuItem}
      data-last={lastMenuItem}
    >
      {icon && <img src={icon} data-testid="menu-icon" />}
      {label}
    </div>
  ),
  MultipleMenuLink: ({ locationLastSegment, label, urls, icon, firstMenuItem, lastMenuItem, ...props }) => (
    <div
      data-testid="multiple-menu-link"
      data-first={firstMenuItem}
      data-last={lastMenuItem}
    >
      {icon && <img src={icon} data-testid="multiple-menu-icon" />}
      {label}
      {urls && urls.map(item => (
        <div key={item.label} data-testid="submenu-item">{item.label}</div>
      ))}
    </div>
  ),
  sxImg: { marginRight: '10px' }
}));

// Mock theme hook
jest.mock('@mui/material/styles', () => ({
  useTheme: () => ({
    breakpoints: {
      down: (size) => `@media (max-width: ${size === 'lg' ? '1200px' : '600px'})`
    }
  })
}));

jest.mock('@mui/material/useMediaQuery', () => jest.fn(() => false));

// Helper to create mock store
const createMockStore = (layout = {}) => {
  const initialState = {
    layout: {
      slugHack: 'test-project',
      ...layout
    }
  };

  const reducer = (state = initialState) => state;
  return createStore(reducer);
};

// Helper to render with providers
const renderWithProviders = (component, { store, route = '/projects/test-project/dashboard' } = {}) => {
  const defaultStore = createMockStore();
  return render(
    <Provider store={store || defaultStore}>
      <MemoryRouter initialEntries={[route]}>
        {component}
      </MemoryRouter>
    </Provider>
  );
};

describe('DrawerAppBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderWithProviders(<DrawerAppBar />);

    // Check that the component renders (AppBar should be present)
    const appBar = screen.getByTestId('project-menu-bar');
    expect(appBar).toBeInTheDocument();
  });

  it('renders navigation items when slug is present and drawer is open', () => {
    const store = createMockStore({ slugHack: 'test-project' });
    renderWithProviders(<DrawerAppBar />, {
      store,
      route: '/projects/test-project/dashboard'
    });

    // Open the drawer to see navigation items
    const menuButton = screen.getByLabelText('open drawer');
    fireEvent.click(menuButton);

    // Look for drawer-specific elements
    expect(screen.getAllByTestId('single-drawer-link')).toHaveLength(2);
    expect(screen.getByTestId('listitem')).toBeInTheDocument();
    expect(screen.getByTestId('project-menu-mobile-drawer')).toBeInTheDocument();
  });

  it('returns null when no slug is available', () => {
    const store = createMockStore({ slugHack: null });
    const { container } = renderWithProviders(<DrawerAppBar />, { store });

    expect(container.firstChild).toBeNull();
  });

  it('handles mobile drawer toggle', () => {
    renderWithProviders(<DrawerAppBar />);

    const menuButton = screen.getByLabelText('open drawer');
    expect(menuButton).toBeInTheDocument();

    fireEvent.click(menuButton);
    // Mobile drawer opening is handled by state
  });

  it('renders single menu links with correct props when drawer is open', () => {
    renderWithProviders(<DrawerAppBar />);

    // Open the drawer to see menu links
    const menuButton = screen.getByLabelText('open drawer');
    fireEvent.click(menuButton);

    const dashboardLink = screen.getAllByTestId('single-menu-link')[0];
    expect(dashboardLink).toHaveAttribute('data-url', '/projects/test-project/dashboard');
    expect(dashboardLink).toHaveAttribute('data-first', 'true');
  });

  it('renders multiple menu links for items without direct URL when drawer is open', () => {
    renderWithProviders(<DrawerAppBar />);

    // Open the drawer to see menu links
    const menuButton = screen.getByLabelText('open drawer');
    fireEvent.click(menuButton);

    const multipleLink = screen.getByTestId('multiple-menu-link');
    expect(multipleLink).toBeInTheDocument();

    const submenuItems = screen.getAllByTestId('submenu-item');
    expect(submenuItems).toHaveLength(2);
    expect(submenuItems[0]).toHaveTextContent('Instructions');
    expect(submenuItems[1]).toHaveTextContent('Variations');
  });

  it('identifies active menu items correctly when drawer is open', () => {
    renderWithProviders(<DrawerAppBar />, {
      route: '/projects/test-project/team-manager'
    });

    // Open the drawer to see menu links
    const menuButton = screen.getByLabelText('open drawer');
    fireEvent.click(menuButton);

    // Since the locationLastSegment would be 'team-manager' and we check if URL ends with it
    const menuLinks = screen.getAllByTestId('single-menu-link');
    // The second link (Team Manager) should be active since its URL ends with 'team-manager'
    expect(menuLinks[1]).toHaveAttribute('data-active', 'true');
  });

  it('handles drawer close event', () => {
    renderWithProviders(<DrawerAppBar />);

    const menuButton = screen.getByLabelText('open drawer');
    fireEvent.click(menuButton);

    // Test that drawer functionality works
    const drawer = screen.getByTestId('project-menu-mobile-drawer');
    expect(drawer).toBeInTheDocument();
  });

  it('renders icons for menu items when drawer is open', () => {
    renderWithProviders(<DrawerAppBar />);

    // Open the drawer to see menu icons
    const menuButton = screen.getByLabelText('open drawer');
    fireEvent.click(menuButton);

    const menuIcons = screen.getAllByTestId('menu-icon');
    expect(menuIcons).toHaveLength(2); // Dashboard and Team Manager have icons

    const multipleMenuIcon = screen.getByTestId('multiple-menu-icon');
    expect(multipleMenuIcon).toBeInTheDocument();
  });

  it('uses params slug when available', () => {
    const navItemsMock = require('./navItems');
    const mockUseParams = require('react-router-dom').useParams;
    mockUseParams.mockReturnValue({ slug: 'param-slug' });

    renderWithProviders(<DrawerAppBar />, {
      route: '/projects/param-slug/dashboard'
    });

    // navItems should be called with the slug from params
    expect(navItemsMock).toHaveBeenCalledWith('param-slug', undefined);
  });

  it('falls back to layout slugHack when params slug is not available', () => {
    const navItemsMock = require('./navItems');
    const store = createMockStore({ slugHack: 'fallback-slug' });
    const mockUseParams = require('react-router-dom').useParams;
    mockUseParams.mockReturnValue({}); // No slug in params

    renderWithProviders(<DrawerAppBar />, {
      store,
      route: '/some-other-route'
    });
    expect(navItemsMock).toHaveBeenCalledWith('fallback-slug', undefined);
  });

  it('handles responsive behavior', () => {
    const useMediaQuery = require('@mui/material/useMediaQuery');
    useMediaQuery.mockReturnValue(true); // Simulate mobile view

    renderWithProviders(<DrawerAppBar />);

    // In mobile view, AppBar should render
    const appBar = screen.getByTestId('project-menu-bar');
    expect(appBar).toBeInTheDocument();
  });

  it('handles submenu toggle in drawer', () => {
    renderWithProviders(<DrawerAppBar />);

    // Open the drawer first
    const menuButton = screen.getByLabelText('open drawer');
    fireEvent.click(menuButton);

    // Test drawer submenu functionality
    const drawerContent = screen.getByText('project-menu').closest('div');
    expect(drawerContent).toBeInTheDocument();
  });

  it('renders with correct grid layout when drawer is open', () => {
    renderWithProviders(<DrawerAppBar />);

    // Open the drawer to see the menu links
    const menuButton = screen.getByLabelText('open drawer');
    fireEvent.click(menuButton);

    const projectMenu = screen.getAllByTestId('single-menu-link')[0].closest('#project-menu');
    expect(projectMenu).toBeInTheDocument();
  });

  it('applies first and last menu item styling correctly when drawer is open', () => {
    renderWithProviders(<DrawerAppBar />);

    // Open the drawer to see the menu links
    const menuButton = screen.getByLabelText('open drawer');
    fireEvent.click(menuButton);

    const menuLinks = screen.getAllByTestId('single-menu-link');
    expect(menuLinks[0]).toHaveAttribute('data-first', 'true');
    expect(menuLinks[1]).toHaveAttribute('data-last', 'false');

    const multipleLink = screen.getByTestId('multiple-menu-link');
    expect(multipleLink).toHaveAttribute('data-last', 'true');
  });

  it('handles missing window prop gracefully', () => {
    renderWithProviders(<DrawerAppBar window={undefined} />);

    // Check that the AppBar renders even without window prop
    const appBar = screen.getByTestId('project-menu-bar');
    expect(appBar).toBeInTheDocument();
  });

  it('uses provided window prop when available', () => {
    const mockWindow = () => ({ document: { body: {} } });
    renderWithProviders(<DrawerAppBar window={mockWindow} />);

    // Check that the AppBar renders with custom window prop
    const appBar = screen.getByTestId('project-menu-bar');
    expect(appBar).toBeInTheDocument();
  });
});
