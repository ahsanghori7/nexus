import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock the store configuration before importing App
jest.mock('store', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    getState: jest.fn(() => ({})),
    dispatch: jest.fn(),
    subscribe: jest.fn(),
    replaceReducer: jest.fn(),
  })),
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => {
  const React = require('react');

  return {
    BrowserRouter: ({ children }) =>
      React.createElement(
        'div',
        { 'data-testid': 'browser-router' },
        children
      ),
    Routes: ({ children }) =>
      React.createElement('div', { 'data-testid': 'routes' }, children),
    Route: ({ element, children, path, index }) =>
      React.createElement(
        'div',
        { 'data-testid': 'route', 'data-path': path, 'data-index': index },
        element,
        children
      ),
  };
});

// Mock react-redux
jest.mock('react-redux', () => {
  const React = require('react');

  return {
    Provider: ({ children, store }) =>
      React.createElement(
        'div',
        {
          'data-testid': 'redux-provider',
          'data-store': store ? 'mocked-store' : 'no-store',
        },
        children
      ),
  };
});

// Mock the router configurations
jest.mock('./router', () => {
  const React = require('react');
  const createNode = (testId, text) =>
    React.createElement('div', { 'data-testid': testId }, text);

  return {
    routerAdminConfig: [
      {
        path: '/admin/*',
        routes: [
          {
            path: 'dashboard',
            element: createNode('admin-dashboard', 'Admin Dashboard'),
          },
          {
            index: true,
            element: createNode('admin-home', 'Admin Home'),
          },
        ],
      },
    ],
    routerProsperConfig: [
      {
        path: '/prosper/*',
        routes: [
          {
            path: 'dashboard',
            element: createNode('prosper-dashboard', 'Prosper Dashboard'),
          },
          {
            index: true,
            element: createNode('prosper-home', 'Prosper Home'),
          },
        ],
      },
    ],
  };
});

// Mock clink-components Error404
jest.mock('clink-components', () => {
  const React = require('react');

  return {
    Error404: ({ theme }) =>
      React.createElement(
        'div',
        { 'data-testid': 'error-404' },
        `Error 404 - Theme: ${theme}`
      ),
  };
});

// Mock Layout component
jest.mock('./Layout', () => {
  const React = require('react');

  return ({ routerConfig, contextType, children }) =>
    React.createElement(
      'div',
      {
        'data-testid': 'layout',
        'data-context-type': contextType,
      },
      `Layout - ${routerConfig.length} routes`,
      children
    );
});

// Mock Login component
jest.mock('v2/apps/shared/components/Login', () => {
  const React = require('react');

  return ({ theme, app }) =>
    React.createElement(
      'div',
      { 'data-testid': 'login', 'data-theme': theme, 'data-app': app },
      `Login - ${theme} - ${app}`
    );
});

import App from './App';

describe('Admin App', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<App />);
    
    // Check that the Redux Provider is present
    expect(screen.getByTestId('redux-provider')).toBeInTheDocument();
    expect(screen.getByTestId('redux-provider')).toHaveAttribute('data-store', 'mocked-store');
    
    // Check that BrowserRouter is present
    expect(screen.getByTestId('browser-router')).toBeInTheDocument();
    
    // Check that Routes are present
    expect(screen.getByTestId('routes')).toBeInTheDocument();
  });

  it('renders Layout components with correct router configurations', () => {
    render(<App />);
    
    // Check that Layout components are rendered
    const layouts = screen.getAllByTestId('layout');
    expect(layouts).toHaveLength(2);
    
    // Check admin layout
    expect(layouts[0]).toHaveTextContent('Layout - 1 routes');
    expect(layouts[0]).not.toHaveAttribute('data-context-type');
    
    // Check prosper layout  
    expect(layouts[1]).toHaveTextContent('Layout - 1 routes');
    expect(layouts[1]).toHaveAttribute('data-context-type', 'adminProsper');
  });

  it('renders Login route with correct props', () => {
    render(<App />);
    
    const loginComponent = screen.getByTestId('login');
    expect(loginComponent).toBeInTheDocument();
    expect(loginComponent).toHaveAttribute('data-theme', 'pegasus');
    expect(loginComponent).toHaveAttribute('data-app', 'ADMIN');
    expect(loginComponent).toHaveTextContent('Login - pegasus - ADMIN');
  });

  it('renders Error404 component for catch-all route', () => {
    render(<App />);
    
    const errorComponent = screen.getByTestId('error-404');
    expect(errorComponent).toBeInTheDocument();
    expect(errorComponent).toHaveTextContent('Error 404 - Theme: pegasus');
  });

  it('verifies store configuration setup', () => {
    // Since the store is created during module import, we just verify
    // that our mock store structure is correct and being used
    render(<App />);
    
    const reduxProvider = screen.getByTestId('redux-provider');
    expect(reduxProvider).toHaveAttribute('data-store', 'mocked-store');
    
    // This confirms that the store mock is working correctly
    // and the App is receiving a store instance
  });

  it('renders all Route components', () => {
    render(<App />);
    
    const routes = screen.getAllByTestId('route');
    // Should have routes for: admin layout, prosper layout, login, and catch-all
    expect(routes.length).toBeGreaterThan(0);
  });

  it('uses pegasus theme consistently', () => {
    render(<App />);
    
    const loginComponent = screen.getByTestId('login');
    const errorComponent = screen.getByTestId('error-404');
    
    expect(loginComponent).toHaveAttribute('data-theme', 'pegasus');
    expect(errorComponent).toHaveTextContent('Error 404 - Theme: pegasus');
  });
});
