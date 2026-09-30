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

// Mock react-redux (FIXED)
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

    // FIX: mock useSelector so hooks do not crash
    useSelector: jest.fn((selector) =>
      selector({
        clinkAccount: {
          featureFlags: {
            TENDER_RECOMMENDATION: false,
          },
        },
      })
    ),

    // Optional but safe
    useDispatch: jest.fn(() => jest.fn()),
  };
});

// Mock the router config
jest.mock('./router', () => {
  const React = require('react');
  const createNode = (testId, text) =>
    React.createElement('div', { 'data-testid': testId }, text);

  return {
    __esModule: true,
    default: [
      {
        path: '/main-contractor/*',
        routes: [
          {
            path: 'dashboard',
            element: createNode('clink-dashboard', 'Clink Dashboard'),
          },
          {
            index: true,
            element: createNode('clink-home', 'Clink Home'),
          },
        ],
      },
      {
        path: '/projects/*',
        routes: [
          {
            path: 'list',
            element: createNode('projects-list', 'Projects List'),
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
    Error404: ({ theme, error, title, href, whoops, parragraph }) =>
      React.createElement(
        'div',
        {
          'data-testid': 'error-404',
          'data-theme': theme,
          'data-error': error,
          'data-title': title,
          'data-href': href,
          'data-whoops': whoops,
          'data-paragraph': parragraph === null ? 'null' : parragraph,
        },
        `Error 404 - Theme: ${theme} - ${error}`
      ),
  };
});

import App from './App';

describe('Clink App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<App />);

    expect(screen.getByTestId('redux-provider')).toBeInTheDocument();
    expect(screen.getByTestId('redux-provider')).toHaveAttribute(
      'data-store',
      'mocked-store'
    );

    expect(screen.getByTestId('browser-router')).toBeInTheDocument();
    expect(screen.getByTestId('routes')).toBeInTheDocument();
  });

  it('renders Error404 component with correct clink theme and props', () => {
    render(<App />);

    const errorComponent = screen.getByTestId('error-404');
    expect(errorComponent).toBeInTheDocument();
    expect(errorComponent).toHaveAttribute('data-theme', 'clink');
    expect(errorComponent).toHaveAttribute(
      'data-error',
      'An Error has occurred'
    );
    expect(errorComponent).toHaveAttribute(
      'data-title',
      'Unfortunately the page you are looking for is no longer available'
    );
    expect(errorComponent).toHaveAttribute('data-href', '/main-contractor');
    expect(errorComponent).toHaveAttribute('data-whoops', 'false');
    expect(errorComponent).toHaveAttribute('data-paragraph', 'null');
    expect(errorComponent).toHaveTextContent(
      'Error 404 - Theme: clink - An Error has occurred'
    );
  });

  it('processes router configuration correctly', () => {
    render(<App />);
    const routes = screen.getAllByTestId('route');
    expect(routes.length).toBeGreaterThan(0);
  });

  it('verifies store configuration with clink context', () => {
    render(<App />);
    expect(screen.getByTestId('redux-provider')).toHaveAttribute(
      'data-store',
      'mocked-store'
    );
  });

  it('renders Router component inside Provider', () => {
    render(<App />);

    const provider = screen.getByTestId('redux-provider');
    const router = screen.getByTestId('browser-router');
    const routes = screen.getByTestId('routes');

    expect(provider).toBeInTheDocument();
    expect(router).toBeInTheDocument();
    expect(routes).toBeInTheDocument();

    expect(provider).toContainElement(router);
  });

  it('uses clink-specific configurations', () => {
    render(<App />);
    const errorComponent = screen.getByTestId('error-404');
    expect(errorComponent).toHaveAttribute('data-theme', 'clink');
    expect(errorComponent).toHaveAttribute('data-href', '/main-contractor');
  });
});
