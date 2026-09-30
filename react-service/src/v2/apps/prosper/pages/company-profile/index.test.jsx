import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { createStore } from 'redux';
import CompanyProfile from './index';

// Mock the child components that we've already tested
jest.mock('./contact', () => ({ data, website, loading, idContact }) => (
  <div data-testid="contact" data-loading={loading} data-id-contact={idContact}>
    Contact Component
  </div>
));

jest.mock('./company', () => ({ companyName, src, description, website, loading }) => (
  <div 
    data-testid="company" 
    data-company-name={companyName}
    data-src={src}
    data-description={description}
    data-website={website || ''}
    data-loading={loading}
  >
    Company Component
  </div>
));

// Mock the Container component
jest.mock('v2/apps/prosper/pages/projects/Container.styled', () => ({ children }) => (
  <div data-testid="container">{children}</div>
));

// Mock the helper functions
jest.mock('v2/helpers/url', () => ({
  checkIfImageExists: jest.fn((url, callback) => callback(true)),
  validUrl: jest.fn((url) => url && url.startsWith('http') ? url : null),
  getQueryStringVars: jest.fn(() => ({ pid: '123' }))
}));

jest.mock('v2/helpers/user', () => ({
  getAccountLogo: jest.fn((id) => `https://example.com/logo/${id}.png`)
}));

jest.mock('v2/helpers/data', () => ({
  renderHtmlInText: jest.fn((html) => html ? html.replace(/<[^>]*>/g, '') : null)
}));

// Mock useContext hook
jest.mock('hooks/context', () => ({
  useContext: jest.fn(() => ({
    actions: {
      fetchCompanyData: jest.fn()
    }
  }))
}));

// Mock clink-components
jest.mock('clink-components', () => ({
  CONSTANTS: {
    s3: {
      iconContractor: 'https://example.com/contractor-icon.png'
    }
  }
}));

// Mock react-router-dom useParams
const mockUseParams = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => mockUseParams()
}));

// Mock global BASE_DIRS
global.BASE_DIRS = {
  V2: {
    PROSPER: 'prosper'
  }
};

// Create a mock Redux store
const createMockStore = (initialState = {}) => {
  const rootReducer = (state = initialState, action) => {
    return state;
  };
  return createStore(rootReducer);
};

// Wrapper component to provide all necessary context
const TestWrapper = ({ children, store }) => (
  <Provider store={store}>
    <BrowserRouter>
      {children}
    </BrowserRouter>
  </Provider>
);

describe('CompanyProfile Component', () => {
  let mockDispatch;
  let mockActions;

  beforeEach(() => {
    mockDispatch = jest.fn();
    mockActions = {
      fetchCompanyData: jest.fn()
    };

    // Reset mocks
    jest.clearAllMocks();
    
    // Setup useContext mock
    const { useContext } = require('hooks/context');
    useContext.mockReturnValue({
      actions: mockActions
    });

    // Setup useParams mock
    mockUseParams.mockReturnValue({
      companyId: '123',
      contactId: '456'
    });
  });

  const defaultAccountState = {
    account: {
      account: {
        id: '123',
        name: 'Test Company',
        description: '<p>Test company description</p>',
        website: 'https://testcompany.com'
      }
    }
  };

  it('should render without crashing', () => {
    const store = createMockStore(defaultAccountState);
    store.dispatch = mockDispatch;

    render(
      <TestWrapper store={store}>
        <CompanyProfile />
      </TestWrapper>
    );

    expect(screen.getByTestId('company')).toBeInTheDocument();
    expect(screen.getByTestId('contact')).toBeInTheDocument();
  });

  it('should call fetchCompanyData action when companyId and pid are present', () => {
    const store = createMockStore(defaultAccountState);
    
    render(
      <TestWrapper store={store}>
        <CompanyProfile />
      </TestWrapper>
    );

    // The action should be called (mocked via useContext)
    expect(mockActions.fetchCompanyData).toHaveBeenCalledWith({
      id: '123',
      pid: '123'
    });
  });

  it('should pass correct props to Company component', () => {
    const store = createMockStore(defaultAccountState);
    store.dispatch = mockDispatch;

    render(
      <TestWrapper store={store}>
        <CompanyProfile />
      </TestWrapper>
    );

    const companyComponent = screen.getByTestId('company');
    expect(companyComponent).toHaveAttribute('data-company-name', 'Test Company');
    expect(companyComponent).toHaveAttribute('data-src', 'https://example.com/logo/123.png');
    expect(companyComponent).toHaveAttribute('data-description', 'Test company description');
    expect(companyComponent).toHaveAttribute('data-website', 'https://testcompany.com');
    expect(companyComponent).toHaveAttribute('data-loading', 'false');
  });

  it('should pass correct props to Contact component', () => {
    const store = createMockStore(defaultAccountState);
    store.dispatch = mockDispatch;

    render(
      <TestWrapper store={store}>
        <CompanyProfile />
      </TestWrapper>
    );

    const contactComponent = screen.getByTestId('contact');
    expect(contactComponent).toHaveAttribute('data-loading', 'false');
    expect(contactComponent).toHaveAttribute('data-id-contact', '456');
  });

  it('should show loading state when account data is not available', () => {
    const storeWithoutAccount = createMockStore({
      account: {
        account: null
      }
    });
    storeWithoutAccount.dispatch = mockDispatch;

    render(
      <TestWrapper store={storeWithoutAccount}>
        <CompanyProfile />
      </TestWrapper>
    );

    const companyComponent = screen.getByTestId('company');
    const contactComponent = screen.getByTestId('contact');
    
    expect(companyComponent).toHaveAttribute('data-loading', 'true');
    expect(contactComponent).toHaveAttribute('data-loading', 'true');
  });

  it('should show loading state when account exists but has no id', () => {
    const storeWithAccountWithoutId = createMockStore({
      account: {
        account: {
          name: 'Test Company',
          description: 'Test description'
          // Missing id
        }
      }
    });
    storeWithAccountWithoutId.dispatch = mockDispatch;

    render(
      <TestWrapper store={storeWithAccountWithoutId}>
        <CompanyProfile />
      </TestWrapper>
    );

    const companyComponent = screen.getByTestId('company');
    expect(companyComponent).toHaveAttribute('data-loading', 'true');
  });

  it('should handle missing website gracefully', () => {
    const storeWithoutWebsite = createMockStore({
      account: {
        account: {
          id: '123',
          name: 'Test Company',
          description: 'Test description',
          website: null
        }
      }
    });
    storeWithoutWebsite.dispatch = mockDispatch;

    render(
      <TestWrapper store={storeWithoutWebsite}>
        <CompanyProfile />
      </TestWrapper>
    );

    const companyComponent = screen.getByTestId('company');
    expect(companyComponent).toHaveAttribute('data-website', '');
  });

  it('should handle invalid website URL', () => {
    const storeWithInvalidWebsite = createMockStore({
      account: {
        account: {
          id: '123',
          name: 'Test Company',
          description: 'Test description',
          website: 'not-a-valid-url'
        }
      }
    });
    storeWithInvalidWebsite.dispatch = mockDispatch;

    // Mock validUrl to return null for invalid URLs
    const { validUrl } = require('v2/helpers/url');
    validUrl.mockReturnValue(null);

    render(
      <TestWrapper store={storeWithInvalidWebsite}>
        <CompanyProfile />
      </TestWrapper>
    );

    const companyComponent = screen.getByTestId('company');
    expect(companyComponent).toHaveAttribute('data-website', '');
  });

  it('should handle missing params', () => {
    mockUseParams.mockReturnValue({});
    
    const store = createMockStore(defaultAccountState);
    store.dispatch = mockDispatch;

    render(
      <TestWrapper store={store}>
        <CompanyProfile />
      </TestWrapper>
    );

    // Should not dispatch fetchCompanyData when companyId is missing
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('should use iconContractor when image does not exist', () => {
    // Mock checkIfImageExists to return false
    const { checkIfImageExists } = require('v2/helpers/url');
    checkIfImageExists.mockImplementation((url, callback) => callback(false));

    const store = createMockStore(defaultAccountState);
    store.dispatch = mockDispatch;

    render(
      <TestWrapper store={store}>
        <CompanyProfile />
      </TestWrapper>
    );

    const companyComponent = screen.getByTestId('company');
    expect(companyComponent).toHaveAttribute('data-src', 'https://example.com/contractor-icon.png');
  });

  it('should handle missing contactId in params', () => {
    mockUseParams.mockReturnValue({
      companyId: '123'
      // Missing contactId
    });

    const store = createMockStore(defaultAccountState);
    store.dispatch = mockDispatch;

    render(
      <TestWrapper store={store}>
        <CompanyProfile />
      </TestWrapper>
    );

    const contactComponent = screen.getByTestId('contact');
    expect(contactComponent).toHaveAttribute('data-id-contact', '0');
  });

  it('should render HTML description as text', () => {
    const store = createMockStore(defaultAccountState);
    store.dispatch = mockDispatch;

    render(
      <TestWrapper store={store}>
        <CompanyProfile />
      </TestWrapper>
    );

    const companyComponent = screen.getByTestId('company');
    // renderHtmlInText should strip HTML tags
    expect(companyComponent).toHaveAttribute('data-description', 'Test company description');
  });
});