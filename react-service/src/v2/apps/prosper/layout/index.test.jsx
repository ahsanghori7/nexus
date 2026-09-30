import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import { MemoryRouter } from 'react-router-dom';
import ProsperLayout from './index';

// Mock all dependencies
jest.mock('clink-components', () => ({
  Layout: ({ children, layoutProps }) => (
    <div data-testid="layout" data-theme="prosper">
      <div data-testid="header-logo">{layoutProps.headerLogo}</div>
      <div data-testid="header-content">{layoutProps.headerContent}</div>
      <div data-testid="page-header">{layoutProps.pageHeader}</div>
      <div data-testid="children">{children}</div>
      <div data-testid="footer-content">{layoutProps.footerContent}</div>
      <div data-testid="after-body">{layoutProps.afterBody}</div>
    </div>
  )
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Outlet: () => <div data-testid="outlet">Page Content</div>,
  useLocation: () => ({
    pathname: '/test-path',
    search: '?param=value'
  })
}));

jest.mock('hooks/context', () => ({
  useContext: jest.fn(() => ({
    actions: {
      fetchSubcontractorInfo: jest.fn(() => Promise.resolve()),
      fetchRooms: jest.fn(() => Promise.resolve()),
      claimToken: jest.fn()
    },
    HeaderLogo: ({ subscriptionId, filterRoutes }) => (
      <div data-testid="header-logo-component">
        Header Logo {subscriptionId}
      </div>
    ),
    filterRoutes: jest.fn()
  }))
}));

jest.mock('v2/helpers/url', () => ({
  getUrlWithoutParamers: jest.fn(() => '/test-url')
}));

jest.mock('v2/apps/prosper/pages/projects/OpportunitiesHeader', () => {
  return function OpportunitiesHeader() {
    return <div data-testid="opportunities-header">Opportunities Header</div>;
  };
});

jest.mock('./header-content', () => {
  return function HeaderContent({ theme, profileProps, claimToken }) {
    return (
      <div data-testid="header-content-component" data-theme={theme}>
        Header Content - Profile: {profileProps?.id || 'none'}
        <button onClick={claimToken} data-testid="claim-token-btn">
          Claim Token
        </button>
      </div>
    );
  };
});

jest.mock('./footer-content', () => {
  return function FooterContent() {
    return <div data-testid="footer-content-component">Footer Content</div>;
  };
});

jest.mock('./subheader', () => {
  return jest.fn((subcontractor, dispatch, title) => (
    title || <div data-testid="subheader-component">Subheader</div>
  ));
});

jest.mock('./footer-content/Banner', () => {
  return function Banner() {
    return <div data-testid="banner-component">Banner</div>;
  };
});

describe('ProsperLayout', () => {
  const defaultState = {
    subcontractor: {
      id: 1,
      account_owner: true,
      subscription_id: 123,
      country: { code: 'UK' }
    },
    config: {
      type: 'string',
      title: 'Test Title',
      lock: false
    },
    opportunities: {
      project: {
        project: 'Test Project'
      }
    },
    account: {
      account: {
        name: 'Test Company'
      }
    }
  };

  const mockReducer = (state = defaultState, action) => state;
  const mockStore = createStore(mockReducer);

  const defaultProps = {
    routerConfig: [
      {
        title: 'Dashboard',
        path: '/dashboard',
        routes: []
      },
      {
        title: 'Projects',
        path: '/projects',
        filter: [456], // Will be filtered out for subscription_id 123
        routes: []
      }
    ]
  };

  const renderWithProviders = (component, props = defaultProps, state = defaultState) => {
    const customStore = createStore(() => state);
    return render(
      <Provider store={customStore}>
        <MemoryRouter>
          {React.cloneElement(component, props)}
        </MemoryRouter>
      </Provider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders main layout structure', () => {
    renderWithProviders(<ProsperLayout />);
    
    expect(screen.getByTestId('layout')).toBeInTheDocument();
    expect(screen.getByTestId('header-logo')).toBeInTheDocument();
    expect(screen.getByTestId('header-content')).toBeInTheDocument();
    expect(screen.getByTestId('page-header')).toBeInTheDocument();
    expect(screen.getByTestId('footer-content')).toBeInTheDocument();
    expect(screen.getByTestId('outlet')).toHaveTextContent('Page Content');
  });

  test('renders HeaderContent with correct props', () => {
    renderWithProviders(<ProsperLayout />);
    
    const headerContent = screen.getByTestId('header-content-component');
    expect(headerContent).toHaveAttribute('data-theme', 'prosper');
    expect(headerContent).toHaveTextContent('Profile: 1');
  });

  test('renders Banner for UK country code', () => {
    renderWithProviders(<ProsperLayout />);
    
    expect(screen.getByTestId('banner-component')).toBeInTheDocument();
  });

  test('does not render Banner for non-UK countries', () => {
    const stateWithAU = {
      ...defaultState,
      subcontractor: {
        ...defaultState.subcontractor,
        country: { code: 'AU' }
      }
    };

    renderWithProviders(<ProsperLayout />, defaultProps, stateWithAU);
    
    expect(screen.queryByTestId('banner-component')).not.toBeInTheDocument();
  });

  test('filters router config based on subscription', () => {
    const propsWithFilteredRoutes = {
      routerConfig: [
        {
          title: 'Available Route',
          path: '/available'
        },
        {
          title: 'Filtered Route',
          path: '/filtered',
          filter: [123] // Should be filtered out for subscription_id 123
        }
      ]
    };

    renderWithProviders(<ProsperLayout />, propsWithFilteredRoutes);
    
    // Layout should still render normally
    expect(screen.getByTestId('layout')).toBeInTheDocument();
  });

  test('handles missing subcontractor data', () => {
    const stateWithoutSubcontractor = {
      ...defaultState,
      subcontractor: {}
    };

    expect(() => {
      renderWithProviders(<ProsperLayout />, defaultProps, stateWithoutSubcontractor);
    }).not.toThrow();
  });

  test('handles missing config data', () => {
    const stateWithoutConfig = {
      ...defaultState,
      config: {}
    };

    renderWithProviders(<ProsperLayout />, defaultProps, stateWithoutConfig);
    expect(screen.getByTestId('layout')).toBeInTheDocument();
  });

  test('renders OpportunitiesHeader when config type is component', () => {
    const stateWithComponentConfig = {
      ...defaultState,
      config: {
        type: 'component',
        title: 'OpportunitiesHeader'
      }
    };

    renderWithProviders(<ProsperLayout />, defaultProps, stateWithComponentConfig);
    expect(screen.getByTestId('opportunities-header')).toBeInTheDocument();
  });

  test('handles empty router config', () => {
    const propsWithEmptyConfig = {
      routerConfig: []
    };

    expect(() => {
      renderWithProviders(<ProsperLayout />, propsWithEmptyConfig);
    }).not.toThrow();
  });

  test('calls actions on mount', async () => {
    const mockActions = {
      fetchSubcontractorInfo: jest.fn(() => Promise.resolve()),
      fetchRooms: jest.fn(() => Promise.resolve()),
      claimToken: jest.fn()
    };

    const useContextSpy = require('hooks/context').useContext;
    useContextSpy.mockReturnValue({
      actions: mockActions,
      HeaderLogo: () => <div>Logo</div>,
      filterRoutes: jest.fn()
    });

    renderWithProviders(<ProsperLayout />);

    await waitFor(() => {
      expect(mockActions.fetchSubcontractorInfo).toHaveBeenCalled();
      expect(mockActions.fetchRooms).toHaveBeenCalled();
    });
  });

  test('handles account owner filtering', () => {
    const stateWithNonOwner = {
      ...defaultState,
      subcontractor: {
        ...defaultState.subcontractor,
        account_owner: false
      }
    };

    const propsWithOwnerRoute = {
      routerConfig: [
        {
          title: 'Owner Only Route',
          path: '/owner',
          accountOwner: true
        }
      ]
    };

    expect(() => {
      renderWithProviders(<ProsperLayout />, propsWithOwnerRoute, stateWithNonOwner);
    }).not.toThrow();
  });

  test('handles country filtering', () => {
    const propsWithCountryFilter = {
      routerConfig: [
        {
          title: 'Not For UK',
          path: '/not-uk',
          filterCountry: ['UK']
        }
      ]
    };

    expect(() => {
      renderWithProviders(<ProsperLayout />, propsWithCountryFilter);
    }).not.toThrow();
  });

  test('handles nested route filtering', () => {
    const propsWithNestedRoutes = {
      routerConfig: [
        {
          title: 'Parent',
          path: '/parent',
          routes: [
            {
              title: 'Child',
              path: '/child',
              filter: [123] // Should be filtered out
            }
          ]
        }
      ]
    };

    expect(() => {
      renderWithProviders(<ProsperLayout />, propsWithNestedRoutes);
    }).not.toThrow();
  });

  test('handles missing opportunities data', () => {
    const stateWithoutOpportunities = {
      ...defaultState,
      opportunities: {}
    };

    renderWithProviders(<ProsperLayout />, defaultProps, stateWithoutOpportunities);
    expect(screen.getByTestId('layout')).toBeInTheDocument();
  });

  test('handles missing account data', () => {
    const stateWithoutAccount = {
      ...defaultState,
      account: {}
    };

    renderWithProviders(<ProsperLayout />, defaultProps, stateWithoutAccount);
    expect(screen.getByTestId('layout')).toBeInTheDocument();
  });
});

// Test the connected component separately
describe('ProsperLayout Connected Component', () => {
  const mockState = {
    subcontractor: { id: 1 },
    config: { type: 'string', title: 'Test' },
    opportunities: {},
    account: {}
  };

  const mockReducer = (state = mockState) => state;
  const mockStore = createStore(mockReducer);

  test('connects to Redux store correctly', () => {
    expect(() => render(
      <Provider store={mockStore}>
        <MemoryRouter>
          <ProsperLayout routerConfig={[]} />
        </MemoryRouter>
      </Provider>
    )).not.toThrow();
  });
});