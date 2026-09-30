import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import AdminProsper from 'v2/apps/admin/pages/prosper/index';

// Mock the context hook
jest.mock('hooks/context', () => ({
  useContext: jest.fn(),
}));

// Mock i18next
jest.mock('v2/helpers/i18n', () => ({
  t: jest.fn((key) => `translated-${key}`),
}));

// Mock URL helpers
jest.mock('v2/helpers/url', () => ({
  createBreadcrumbs: jest.fn(() => ({
    items: [
      { title: 'Home', url: '/admin/prosper' },
      { title: 'Dashboard', url: '/admin/prosper/dashboard' },
    ],
  })),
  getQueryStringVars: jest.fn(() => ({})),
  goToSearch: jest.fn(),
}));

// Mock clink-components
jest.mock('clink-components', () => ({
  Page: ({ children, pageHeader, status }) => (
    <div data-testid="mock-page" data-status={status || 'default'}>
      <div data-testid="page-header">
        <div data-testid="page-title">{pageHeader?.title}</div>
        {pageHeader?.subLeftContent}
        {pageHeader?.mainMiddleContent}
      </div>
      {children}
    </div>
  ),
  Breadcrumbs: (props) => (
    <div data-testid="mock-breadcrumbs" data-props={JSON.stringify(props)} />
  ),
  Searchbox: (props) => (
    <div data-testid="mock-searchbox" data-props={JSON.stringify(props)} />
  ),
}));

const { useContext } = require('hooks/context');

// Create a mock store
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      admin: (state = {}) => state,
      users: (state = {}) => state,
    },
    preloadedState: initialState,
  });
};

// Mock context data
const mockContext = {
  logo: {
    src: '/test-logo.png',
    alt: 'Test Logo',
  },
  pages: {
    home: {
      title: 'Home',
      keyTitle: 'home-title',
    },
    dashboard: {
      title: 'Dashboard',
      keyTitle: 'dashboard-title',
    },
    search: {
      title: 'Search',
      keyTitle: 'search-title',
    },
  },
};

describe('AdminProsper', () => {
  let store;

  beforeEach(() => {
    store = createMockStore();
    useContext.mockReturnValue(mockContext);
    
    // Setup global BASE_URLS
    global.BASE_URLS = {
      ADMIN_PROSPER: '/admin/prosper',
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing', () => {
    render(
      <Provider store={store}>
        <AdminProsper />
      </Provider>
    );

    expect(screen.getByTestId('mock-page')).toBeInTheDocument();
  });

  it('should render dashboard title by default', () => {
    render(
      <Provider store={store}>
        <AdminProsper />
      </Provider>
    );

    expect(screen.getByTestId('page-title')).toHaveTextContent('translated-dashboard-title');
  });

  it('should render breadcrumbs', () => {
    render(
      <Provider store={store}>
        <AdminProsper />
      </Provider>
    );

    expect(screen.getByTestId('mock-breadcrumbs')).toBeInTheDocument();
  });

  it('should not render searchbox when no model is provided', () => {
    render(
      <Provider store={store}>
        <AdminProsper />
      </Provider>
    );

    expect(screen.queryByTestId('mock-searchbox')).not.toBeInTheDocument();
  });

  it('should render searchbox when model is provided', () => {
    render(
      <Provider store={store}>
        <AdminProsper model="accountsProsper" />
      </Provider>
    );

    expect(screen.getByTestId('mock-searchbox')).toBeInTheDocument();
  });

  it('should render children content', () => {
    render(
      <Provider store={store}>
        <AdminProsper>
          <div data-testid="child-content">Test Child</div>
        </AdminProsper>
      </Provider>
    );

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByTestId('child-content')).toHaveTextContent('Test Child');
  });

  it('should pass status to Page component', () => {
    render(
      <Provider store={store}>
        <AdminProsper accountsProsper={{ status: 'loading' }} model="accountsProsper" />
      </Provider>
    );

    expect(screen.getByTestId('mock-page')).toHaveAttribute('data-status', 'loading');
  });

  it('should render model page title when model is provided', () => {
    const contextWithModel = {
      ...mockContext,
      pages: {
        ...mockContext.pages,
        accountsProsper: {
          title: 'Accounts',
          keyTitle: 'accounts-title',
        },
      },
    };

    useContext.mockReturnValue(contextWithModel);

    render(
      <Provider store={store}>
        <AdminProsper model="accountsProsper" />
      </Provider>
    );

    expect(screen.getByTestId('page-title')).toHaveTextContent('translated-accounts-title');
  });

  it('should render search title when searchModel is provided', () => {
    const { getQueryStringVars } = require('v2/helpers/url');
    getQueryStringVars.mockReturnValue({ model: 'accountsProsper', term: 'test' });

    render(
      <Provider store={store}>
        <AdminProsper />
      </Provider>
    );

    expect(screen.getByTestId('page-title')).toHaveTextContent('translated-search-title');
  });
});