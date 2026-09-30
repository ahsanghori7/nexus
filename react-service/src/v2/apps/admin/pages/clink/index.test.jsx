import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import { MemoryRouter } from 'react-router-dom';
import AdminCLink from './index';

// Mock dependencies
jest.mock('clink-components', () => ({
  Breadcrumbs: ({ pages, ...props }) => (
    <div data-testid="breadcrumbs">
      {pages && pages.map((page, index) => (
        <span key={index} data-testid={`breadcrumb-${index}`}>
          {(page && (page.keyTitle || page.title)) || `Page ${index}`}
        </span>
      ))}
    </div>
  ),
  Page: ({ pageHeader, status, children, ...props }) => (
    <div data-testid="page">
      <div data-testid="page-header">
        {pageHeader?.title && <h1 data-testid="page-title">{pageHeader.title}</h1>}
        {pageHeader?.subLeftContent && (
          <div data-testid="sub-left-content">{pageHeader.subLeftContent}</div>
        )}
        {pageHeader?.subRightContent && (
          <div data-testid="sub-right-content">{pageHeader.subRightContent}</div>
        )}
        {pageHeader?.mainMiddleContent && (
          <div data-testid="main-middle-content">{pageHeader.mainMiddleContent}</div>
        )}
      </div>
      <div data-testid="page-status">{status}</div>
      <div data-testid="page-children">{children}</div>
    </div>
  ),
  Searchbox: ({ name, defaultValue, placeholder, onSubmit, ...props }) => (
    <div data-testid="searchbox">
      <input 
        data-testid="search-input"
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
      />
      <button 
        data-testid="search-button"
        onClick={() => onSubmit && onSubmit({ search: 'test' })}
      >
        Search
      </button>
    </div>
  )
}));

jest.mock('hooks/context', () => ({
  useContext: jest.fn()
}));

jest.mock('v2/helpers/i18n', () => ({
  t: (key) => key
}));

jest.mock('v2/helpers/url', () => ({
  createBreadcrumbs: jest.fn((base, pages) => ({ pages })),
  getQueryStringVars: jest.fn(),
  goToSearch: jest.fn()
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn()
}));

// Mock child components
jest.mock('./modal', () => {
  return function FormModal() {
    return <div data-testid="form-modal">Form Modal</div>;
  };
});

jest.mock('./DefaultRightContent', () => {
  return function DefaultRightContent({ options, children }) {
    return (
      <div data-testid="default-right-content">
        Default Right Content
        {children}
      </div>
    );
  };
});

jest.mock('./SelectDataToShow', () => {
  return function SelectDataToShow({ model }) {
    return <div data-testid="select-data-to-show">Select Data: {model}</div>;
  };
});

// Create a mock store
const createMockStore = (initialState) => {
  const reducer = (state = initialState) => state;
  return createStore(reducer);
};

describe('AdminCLink Component', () => {
  const mockContext = {
    actions: {
      fetchSubscriptions: jest.fn().mockReturnValue({ type: 'FETCH_SUBSCRIPTIONS' }),
      fetchMainContractors: jest.fn().mockReturnValue({ type: 'FETCH_MAIN_CONTRACTORS' })
    },
    logo: 'mock-logo-url',
    pages: {
      home: { keyTitle: 'home', title: 'Home' },
      dashboard: { keyTitle: 'dashboard', title: 'Dashboard' },
      search: { keyTitle: 'search', title: 'Search' },
      users: { keyTitle: 'users', title: 'Users' },
      projects: { keyTitle: 'projects', title: 'Projects' },
      accounts: { keyTitle: 'accounts', title: 'Accounts' },
      features: { keyTitle: 'features', title: 'Features' },
      customerHealthScore: { keyTitle: 'customerHealthScore', title: 'Customer Health Score' }
    },
    config: {
      website: 'mock-website'
    }
  };

  const mockState = {
    admin: {
      mainContractors: [
        { id: 1, name: 'Contractor 1' },
        { id: 2, name: 'Contractor 2' }
      ]
    },
    users: { status: null },
    projects: { status: null },
    accounts: { status: null },
    subscription: { status: null },
    customerHealthScore: { status: null },
    features: { status: null }
  };

  let store;

  beforeEach(() => {
    jest.clearAllMocks();
    store = createMockStore(mockState);
    
    const { useContext } = require('hooks/context');
    useContext.mockReturnValue(mockContext);

    const { useParams } = require('react-router-dom');
    useParams.mockReturnValue({});

    const { getQueryStringVars } = require('v2/helpers/url');
    getQueryStringVars.mockReturnValue({});
  });

  const renderComponent = (props = {}) => {
    return render(
      <Provider store={store}>
        <MemoryRouter>
          <AdminCLink {...props}>
            <div data-testid="test-children">Test Children</div>
          </AdminCLink>
        </MemoryRouter>
      </Provider>
    );
  };

  it('renders without crashing', () => {
    renderComponent();
    expect(screen.getByTestId('page')).toBeInTheDocument();
  });

  it('renders page title correctly for dashboard', () => {
    renderComponent();
    expect(screen.getByTestId('page-title')).toHaveTextContent('dashboard');
  });

  it('renders breadcrumbs component', () => {
    renderComponent();
    expect(screen.getByTestId('breadcrumbs')).toBeInTheDocument();
  });

  it('renders children content', () => {
    renderComponent();
    expect(screen.getByTestId('test-children')).toBeInTheDocument();
    expect(screen.getByText('Test Children')).toBeInTheDocument();
  });

  it('renders searchbox for projects model', () => {
    renderComponent({ model: 'projects' });
    expect(screen.getByTestId('searchbox')).toBeInTheDocument();
    expect(screen.getByTestId('search-input')).toHaveAttribute('placeholder', 'search-project');
  });

  it('renders searchbox for users model', () => {
    renderComponent({ model: 'users' });
    expect(screen.getByTestId('searchbox')).toBeInTheDocument();
    expect(screen.getByTestId('search-input')).toHaveAttribute('placeholder', 'search-contractor');
  });

  it('renders searchbox for accounts model', () => {
    renderComponent({ model: 'accounts' });
    expect(screen.getByTestId('searchbox')).toBeInTheDocument();
    expect(screen.getByTestId('search-input')).toHaveAttribute('placeholder', 'search-account');
  });

  it('does not render searchbox for customerHealthScore model', () => {
    renderComponent({ model: 'customerHealthScore' });
    expect(screen.queryByTestId('searchbox')).not.toBeInTheDocument();
  });

  it('does not render searchbox for features model', () => {
    renderComponent({ model: 'features' });
    expect(screen.queryByTestId('searchbox')).not.toBeInTheDocument();
  });

  it('renders SelectDataToShow for customerHealthScore model', () => {
    renderComponent({ model: 'customerHealthScore' });
    expect(screen.getByTestId('select-data-to-show')).toBeInTheDocument();
    expect(screen.getByText('Select Data: customerHealthScore')).toBeInTheDocument();
  });

  it('renders SelectDataToShow for features model when no accountId', () => {
    renderComponent({ model: 'features' });
    expect(screen.getByTestId('select-data-to-show')).toBeInTheDocument();
    expect(screen.getByText('Select Data: features')).toBeInTheDocument();
  });

  it('does not render SelectDataToShow for features model when accountId is present', () => {
    const { useParams } = require('react-router-dom');
    useParams.mockReturnValue({ accountId: '123' });
    
    renderComponent({ model: 'features' });
    expect(screen.queryByTestId('select-data-to-show')).not.toBeInTheDocument();
  });

  it('renders DefaultRightContent for users model with FormModal', () => {
    renderComponent({ model: 'users' });
    expect(screen.getByTestId('default-right-content')).toBeInTheDocument();
    expect(screen.getByTestId('form-modal')).toBeInTheDocument();
  });

  it('renders DefaultRightContent for other models', () => {
    renderComponent({ model: 'other' });
    expect(screen.getByTestId('default-right-content')).toBeInTheDocument();
  });

  it('handles search model from query string', () => {
    const { getQueryStringVars } = require('v2/helpers/url');
    getQueryStringVars.mockReturnValue({ model: 'projects', term: 'test-search' });
    
    renderComponent();
    expect(screen.getByTestId('searchbox')).toBeInTheDocument();
    expect(screen.getByTestId('search-input')).toHaveValue('test-search');
  });

  it('handles missing admin state gracefully', () => {
    const storeWithoutAdmin = createMockStore({
      ...mockState,
      admin: {
        mainContractors: []
      }
    });

    render(
      <Provider store={storeWithoutAdmin}>
        <MemoryRouter>
          <AdminCLink>
            <div>Test</div>
          </AdminCLink>
        </MemoryRouter>
      </Provider>
    );

    expect(screen.getByTestId('page')).toBeInTheDocument();
  });
});