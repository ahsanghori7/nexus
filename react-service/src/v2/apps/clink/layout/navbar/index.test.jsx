import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('js-cookie', () => ({
  get: jest.fn(() => undefined),
}));

jest.mock('v2/helpers/php-globals', () => ({
  PHPAppClinkGloblals: jest.fn(() => ({ isCostPlaningTool: false })),
}));

jest.mock('v2/helpers/url', () => ({
  goTo: jest.fn(),
}));

jest.mock('react-redux', () => {
  const React = require('react');
  return {
    connect: () => (Component) => Component,
    Provider: ({ children }) => <div data-testid="provider">{children}</div>,
    useDispatch: () => jest.fn(),
    useSelector: (selector) => selector({
      notifications: {
        items: [],
        unreadCount: 0,
        isLoading: false,
        isLoadingMore: false,
      },
    }),
  };
});

jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: {
        clinkGreen: '#4cc0ad',
      },
    },
    userTypes: {
      userTypeSuperAdmin: 'super-admin',
    },
  },
}));


jest.mock('./HeaderIcon', () => ({ handleClick, iconLink }) => (
  <button
    data-testid="header-icon"
    type="button"
    onClick={handleClick}
    data-link-component={iconLink?.LinkComponent ? 'Link' : undefined}
  >
    Header
  </button>
));

jest.mock('@mui/icons-material/Person', () => () => (
  <span data-testid="icon-person">person</span>
));

jest.mock('@mui/icons-material/AdminPanelSettings', () => () => (
  <span data-testid="icon-admin">admin</span>
));

jest.mock('@mui/icons-material/ExitToApp', () => () => (
  <span data-testid="icon-exit">exit</span>
));

const { MemoryRouter } = jest.requireActual('react-router-dom');

// Mock global variables
global.ENV = 'test';
global.BASE_URLS = {
  CLINK: '/clink',
  APP_CLINK: '/app-clink',
};

// Import component after mocks
import MenuAppBar from './index';

const renderWithRouter = (ui) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
};

describe('MenuAppBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    return renderWithRouter(<MenuAppBar {...props} />);
  };

  it('renders without crashing', () => {
    renderComponent();

    expect(screen.getByTestId('header-icon')).toBeInTheDocument();
  });

  it('renders user avatar with initials', () => {
    renderComponent({
      clinkAccount: {
        user: { display_name: 'John Doe', type: 'team_assistant' },
      },
    });

    const avatar = screen.getByText('JD');
    expect(avatar).toBeInTheDocument();
  });

  it('handles empty display name with default initials', () => {
    renderComponent({
      clinkAccount: {
        user: { display_name: '', type: 'team_assistant' },
      },
    });

    const avatar = screen.getByText('U');
    expect(avatar).toBeInTheDocument();
  });

  it('opens menu when avatar is clicked', () => {
    renderComponent({
      clinkAccount: {
        user: { display_name: 'John Doe', type: 'team_assistant' },
      },
    });

    const avatarButton = screen.getByLabelText('account of current user');
    fireEvent.click(avatarButton);

    expect(screen.getByText('Update profile')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('shows admin menu item for admin users', () => {
    renderComponent({
      clinkAccount: {
        user: { display_name: 'Admin User', type: 'team_admin' },
      },
    });

    const avatarButton = screen.getByLabelText('account of current user');
    fireEvent.click(avatarButton);

    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('does not show admin menu item for non-admin users', () => {
    require('js-cookie').get.mockReturnValue(undefined);

    renderComponent({
      clinkAccount: {
        user: { display_name: 'John Doe', type: 'team_assistant' },
      },
    });

    const avatarButton = screen.getByLabelText('account of current user');
    fireEvent.click(avatarButton);

    expect(screen.queryByText('Admin')).not.toBeInTheDocument();
  });

  it('closes menu when clicking menu items', () => {
    const { goTo } = require('v2/helpers/url');

    renderComponent({
      clinkAccount: {
        user: { display_name: 'John Doe', type: 'team_assistant' },
      },
    });

    fireEvent.click(screen.getByLabelText('account of current user'));
    fireEvent.click(screen.getByText('Update profile'));

    expect(goTo).toHaveBeenCalledWith('/main-contractor/profile');
  });

  it('calls goTo for logout', () => {
    const { goTo } = require('v2/helpers/url');

    renderComponent({
      clinkAccount: {
        user: { display_name: 'John Doe', type: 'team_assistant' },
      },
    });

    fireEvent.click(screen.getByLabelText('account of current user'));
    fireEvent.click(screen.getByText('Logout'));

    expect(goTo).toHaveBeenCalledWith('/logout');
  });

  it('calls goTo for admin menu', () => {
    const { goTo } = require('v2/helpers/url');

    renderComponent({
      clinkAccount: {
        user: { display_name: 'Admin User', type: 'team_admin' },
      },
    });

    fireEvent.click(screen.getByLabelText('account of current user'));
    fireEvent.click(screen.getByText('Admin'));

    expect(goTo).toHaveBeenCalledWith('/app-clink/main-contractor/back_to_admin/');
  });

  it('calls toggleDrawer when HeaderIcon is clicked', () => {
    const mockToggleDrawer = jest.fn(() => jest.fn());

    renderComponent({ toggleDrawer: mockToggleDrawer });

    fireEvent.click(screen.getByTestId('header-icon'));

    expect(mockToggleDrawer).toHaveBeenCalledWith(true);
  });

  it('handles noReact prop correctly', () => {
    renderComponent({ noReact: true });

    const headerIcon = screen.getByTestId('header-icon');
    expect(headerIcon).toHaveAttribute('data-link-component', 'Link');
  });

  it('handles missing clinkAccount gracefully', () => {
    renderComponent();

    const avatar = screen.getByText('U');
    expect(avatar).toBeInTheDocument();
  });

  it('has correct menu accessibility attributes', () => {
    renderComponent({
      clinkAccount: {
        user: { display_name: 'John Doe', type: 'team_assistant' },
      },
    });

    const avatarButton = screen.getByLabelText('account of current user');
    expect(avatarButton).toHaveAttribute('aria-controls', 'menu-appbar');
    expect(avatarButton).toHaveAttribute('aria-haspopup', 'true');
  });

  it('generates correct initials from complex names', () => {
    renderComponent({
      clinkAccount: {
        user: { display_name: 'Mary Jane Watson-Smith', type: 'team_assistant' },
      },
    });

    const avatar = screen.getByText('MJW');
    expect(avatar).toBeInTheDocument();
  });
});
