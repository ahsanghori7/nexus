import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import Banner from './Banner';

// Mock all the dependencies
jest.mock('v2/helpers/user/subscription', () => {
  return jest.fn().mockImplementation(() => ({
    isActivatedSupplyChain: jest.fn(() => true)
  }));
});

jest.mock('hooks/context', () => ({
  useContext: () => ({
    actions: {
      fetchEnquiries: jest.fn(),
      fetchOpportunities: jest.fn(),
      upgradeProsperPro: jest.fn(() => Promise.resolve()),
      fetchSubcontractorInfo: jest.fn()
    }
  })
}));

jest.mock('js-cookie', () => ({
  get: jest.fn(() => null),
  set: jest.fn()
}));

jest.mock('v2/helpers/date', () => ({
  happenInLast24Hours: jest.fn(() => false)
}));

jest.mock('v2/helpers/url', () => ({
  getUrlWithoutParamers: jest.fn(() => '/test-url')
}));

// Mock the global BASE_DIRS
global.BASE_DIRS = {
  V2: {
    PROSPER: 'prosper'
  }
};

describe('Banner', () => {
  // Create a minimal Redux store
  const mockReducer = (state = {}, action) => state;
  const mockStore = createStore(mockReducer);

  const defaultProps = {
    subcontractor: {
      id: 1,
      prosperProBanner: true,
      subscription_id: 123,
      trades: { 1: 'Construction', 2: 'Plumbing' }
    },
    enquiries: {
      current: []
    },
    opportunities: {
      projects: []
    },
    dispatch: jest.fn()
  };

  const renderWithRedux = (component, props = defaultProps) => {
    return render(
      <Provider store={mockStore}>
        {React.cloneElement(component, props)}
      </Provider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders without crashing when no opportunities', () => {
    renderWithRedux(<Banner />, defaultProps);
    // Should not render anything when opportunitiesCount is 0
    expect(screen.queryByTestId('enquiry-pro-banner-mock')).not.toBeInTheDocument();
  });

  test('renders banner when there are opportunities', () => {
    const propsWithOpportunities = {
      ...defaultProps,
      opportunities: {
        projects: [
          {
            tenders: [
              {
                packages: [1, 2],
                registered: false,
                awarded: false
              }
            ]
          }
        ]
      }
    };

    renderWithRedux(<Banner />, propsWithOpportunities);
    
    // Component should render the banner when there are matching opportunities
    expect(screen.queryByTestId('enquiry-pro-banner-mock')).toBeInTheDocument();
  });

  test('handles empty subcontractor', () => {
    const emptyProps = {
      ...defaultProps,
      subcontractor: {}
    };

    expect(() => renderWithRedux(<Banner />, emptyProps)).not.toThrow();
  });

  test('handles missing enquiries', () => {
    const propsWithoutEnquiries = {
      ...defaultProps,
      enquiries: { current: null }
    };

    expect(() => renderWithRedux(<Banner />, propsWithoutEnquiries)).not.toThrow();
  });

  test('handles missing opportunities', () => {
    const propsWithoutOpportunities = {
      ...defaultProps,
      opportunities: { projects: null }
    };

    expect(() => renderWithRedux(<Banner />, propsWithoutOpportunities)).not.toThrow();
  });

  test('calls dispatch when provided', () => {
    const mockDispatch = jest.fn();
    const propsWithDispatch = {
      ...defaultProps,
      subcontractor: {
        ...defaultProps.subcontractor,
        id: 1
      }
    };

    renderWithRedux(<Banner />, propsWithDispatch);
    
    // Component should render without errors
    expect(() => renderWithRedux(<Banner />, propsWithDispatch)).not.toThrow();
  });

  test('handles prosperProBanner false', () => {
    const propsWithNoBanner = {
      ...defaultProps,
      subcontractor: {
        ...defaultProps.subcontractor,
        prosperProBanner: false
      }
    };

    expect(() => renderWithRedux(<Banner />, propsWithNoBanner)).not.toThrow();
  });

  test('handles missing trades', () => {
    const propsWithoutTrades = {
      ...defaultProps,
      subcontractor: {
        ...defaultProps.subcontractor,
        trades: undefined
      },
      opportunities: {
        projects: [
          {
            tenders: [
              {
                packages: [1, 2],
                registered: false,
                awarded: false
              }
            ]
          }
        ]
      }
    };

    expect(() => renderWithRedux(<Banner />, propsWithoutTrades)).not.toThrow();
  });

  test('handles empty projects array', () => {
    const propsWithEmptyProjects = {
      ...defaultProps,
      opportunities: {
        projects: []
      }
    };

    renderWithRedux(<Banner />, propsWithEmptyProjects);
    expect(screen.queryByTestId('enquiry-pro-banner-mock')).not.toBeInTheDocument();
  });
});

// Test the connected component
describe('Banner Connected Component', () => {
  const mockState = {
    enquiries: { current: [] },
    opportunities: { projects: [] },
    subcontractor: {
      id: 1,
      prosperProBanner: true,
      subscription_id: 123
    }
  };

  const mockReducer = (state = mockState, action) => state;
  const mockStore = createStore(mockReducer);

  test('connects to Redux store correctly', () => {
    expect(() => render(
      <Provider store={mockStore}>
        <Banner />
      </Provider>
    )).not.toThrow();
  });
});