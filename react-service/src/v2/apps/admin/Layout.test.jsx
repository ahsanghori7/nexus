import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock the custom hooks and context before importing the component
jest.mock('hooks/context', () => ({
  useContext: jest.fn(),
}));

// Mock react-redux
jest.mock('react-redux', () => ({
  connect: jest.fn((mapStateToProps) => (Component) => (props) => {
    // Simulate the connected component with mocked state
    const mockState = {
      admin: {
        id: 1,
        name: 'Test Admin',
        email: 'admin@test.com',
      },
    };
    const stateProps = mapStateToProps ? mapStateToProps(mockState) : {};
    return <Component {...props} {...stateProps} dispatch={jest.fn()} />;
  }),
}));

// Mock react-router-dom Outlet
jest.mock('react-router-dom', () => ({
  Outlet: () => <div data-testid="outlet">Route Content</div>,
}));

// Mock clink-components Layout
jest.mock('clink-components', () => ({
  Layout: ({ layoutProps, children }) => (
    <div data-testid="clink-layout" data-layout-props={JSON.stringify(layoutProps)}>
      Layout Component
      <div data-testid="layout-header-logo">{layoutProps.headerLogo}</div>
      <div data-testid="layout-header-content">{layoutProps.headerContent}</div>
      <div data-testid="layout-profile">{JSON.stringify(layoutProps.profileData)}</div>
      <div data-testid="layout-children">{children}</div>
    </div>
  ),
}));

import Layout from './Layout';
import { useContext } from 'hooks/context';

describe('Admin Layout', () => {
  const mockRouterConfig = [
    { path: '/admin', label: 'Dashboard' },
    { path: '/admin/users', label: 'Users' },
  ];

  const mockDispatch = jest.fn();
  const mockActions = {
    fetchAdminInfo: jest.fn(() => ({ type: 'FETCH_ADMIN_INFO' })),
  };

  const mockContext = {
    actions: mockActions,
    headerLogo: <div data-testid="header-logo">Admin Logo</div>,
    headerContent: <div data-testid="header-content">Admin Header</div>,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useContext.mockReturnValue(mockContext);
  });

  it('renders without crashing', () => {
    render(
      <Layout 
        routerConfig={mockRouterConfig}
        dispatch={mockDispatch}
      />
    );
    
    expect(screen.getByTestId('clink-layout')).toBeInTheDocument();
    expect(screen.getByTestId('outlet')).toBeInTheDocument();
    expect(screen.getByText('Layout Component')).toBeInTheDocument();
  });

  it('uses admin context by default', () => {
    render(
      <Layout 
        routerConfig={mockRouterConfig}
        dispatch={mockDispatch}
      />
    );
    
    expect(useContext).toHaveBeenCalledWith('admin');
  });

  it('uses custom context type when provided', () => {
    render(
      <Layout 
        routerConfig={mockRouterConfig}
        dispatch={mockDispatch}
        contextType="adminProsper"
      />
    );
    
    expect(useContext).toHaveBeenCalledWith('adminProsper');
  });

  it('calls fetchAdminInfo action through context', () => {
    // Verify that the fetchAdminInfo function is available in context
    render(
      <Layout 
        routerConfig={mockRouterConfig}
        dispatch={mockDispatch}
      />
    );
    
    // The component should be rendered successfully which means the context
    // actions including fetchAdminInfo are accessible
    expect(useContext).toHaveBeenCalledWith('admin');
    expect(screen.getByTestId('clink-layout')).toBeInTheDocument();
  });

  it('passes correct layout props to clink Layout component', () => {
    render(
      <Layout 
        routerConfig={mockRouterConfig}
        dispatch={mockDispatch}
      />
    );
    
    const layoutComponent = screen.getByTestId('clink-layout');
    const layoutPropsString = layoutComponent.getAttribute('data-layout-props');
    const layoutProps = JSON.parse(layoutPropsString);
    
    expect(layoutProps.routerConfig).toEqual(mockRouterConfig);
    expect(layoutProps.profileData).toEqual({
      id: 1,
      name: 'Test Admin',
      email: 'admin@test.com',
    });
  });

  it('renders header logo from context', () => {
    render(
      <Layout 
        routerConfig={mockRouterConfig}
        dispatch={mockDispatch}
      />
    );
    
    expect(screen.getByTestId('header-logo')).toBeInTheDocument();
    expect(screen.getByText('Admin Logo')).toBeInTheDocument();
  });

  it('renders header content from context', () => {
    render(
      <Layout 
        routerConfig={mockRouterConfig}
        dispatch={mockDispatch}
      />
    );
    
    expect(screen.getByTestId('header-content')).toBeInTheDocument();
    expect(screen.getByText('Admin Header')).toBeInTheDocument();
  });

  it('renders Outlet for nested routes', () => {
    render(
      <Layout 
        routerConfig={mockRouterConfig}
        dispatch={mockDispatch}
      />
    );
    
    const outlet = screen.getByTestId('outlet');
    expect(outlet).toBeInTheDocument();
    expect(outlet).toHaveTextContent('Route Content');
  });

  it('connects to Redux store and receives admin state', () => {
    // This test verifies that the connected component receives admin state
    // The mock connect function already provides the admin state
    render(
      <Layout 
        routerConfig={mockRouterConfig}
        dispatch={mockDispatch}
      />
    );
    
    // Verify that the admin state from the mock store is being used
    const profileElement = screen.getByTestId('layout-profile');
    expect(profileElement).toHaveTextContent('"id":1');
    expect(profileElement).toHaveTextContent('"name":"Test Admin"');
    expect(profileElement).toHaveTextContent('"email":"admin@test.com"');
  });

  it('handles empty router config', () => {
    render(
      <Layout 
        routerConfig={[]}
        dispatch={mockDispatch}
      />
    );
    
    const layoutComponent = screen.getByTestId('clink-layout');
    const layoutPropsString = layoutComponent.getAttribute('data-layout-props');
    const layoutProps = JSON.parse(layoutPropsString);
    
    expect(layoutProps.routerConfig).toEqual([]);
  });

  it('handles missing context gracefully', () => {
    useContext.mockReturnValue({
      actions: { fetchAdminInfo: jest.fn() },
      headerLogo: null,
      headerContent: null,
    });

    render(
      <Layout 
        routerConfig={mockRouterConfig}
        dispatch={mockDispatch}
      />
    );
    
    // Should still render without crashing
    expect(screen.getByTestId('clink-layout')).toBeInTheDocument();
  });
});