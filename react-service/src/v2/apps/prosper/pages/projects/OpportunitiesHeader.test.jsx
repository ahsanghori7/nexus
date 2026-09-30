import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import OpportunitiesHeader from './OpportunitiesHeader';

// Mock helper functions
jest.mock('v2/helpers/data', () => ({
  renderHtmlInText: jest.fn((text) => text)
}));

jest.mock('v2/helpers/url', () => ({
  getUrlWithoutParamers: jest.fn(() => '/prosper/projects/find-opportunities')
}));

// Mock Settings component
jest.mock('v2/apps/prosper/pages/projects/view-project-v3/packages/Settings', () => {
  return function MockSettings({ text }) {
    return <div data-testid="settings-component">{text}</div>;
  };
});

describe('OpportunitiesHeader.jsx', () => {
  const createMockStore = (initialState = {}) => {
    const defaultState = {
      opportunities: {
        project: null,
        projects: [],
        status: false,
        statusProject: false
      },
      subcontractor: {
        trades: {}
      },
      account: {
        account: null
      }
    };

    const reducer = (state = { ...defaultState, ...initialState }) => state;
    return createStore(reducer);
  };

  const renderWithProviders = (component, store) => {
    return render(
      <Provider store={store}>
        {component}
      </Provider>
    );
  };

  beforeEach(() => {
    // Reset mocks before each test
    require('v2/helpers/url').getUrlWithoutParamers.mockReturnValue('/prosper/projects/find-opportunities');
  });

  it('renders without crashing', () => {
    const store = createMockStore();
    const { container } = renderWithProviders(<OpportunitiesHeader />, store);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders with correct data-cy attribute', () => {
    const store = createMockStore();
    const { container } = renderWithProviders(<OpportunitiesHeader />, store);
    expect(container.querySelector('[data-cy="opportunities-header"]')).toBeInTheDocument();
  });

  it('renders opportunities title when on find-opportunities page', () => {
    const store = createMockStore();
    const { getByRole } = renderWithProviders(<OpportunitiesHeader />, store);
    
    const heading = getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('opportunities');
  });

  it('renders project name when not on find-opportunities page', () => {
    require('v2/helpers/url').getUrlWithoutParamers.mockReturnValue('/prosper/projects/other');
    
    const mockState = {
      opportunities: {
        project: { project: 'Test Project Name' },
        projects: [],
        status: false,
        statusProject: false
      }
    };
    
    const store = createMockStore(mockState);
    const { getByRole } = renderWithProviders(<OpportunitiesHeader />, store);
    
    const heading = getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Test Project Name');
  });

  it('renders company name when no project data and not on find-opportunities page', () => {
    require('v2/helpers/url').getUrlWithoutParamers.mockReturnValue('/prosper/projects/other');
    
    const mockState = {
      opportunities: {
        project: null,
        projects: [],
        status: false,
        statusProject: false
      },
      account: {
        account: { name: 'Test Company' }
      }
    };
    
    const store = createMockStore(mockState);
    const { getByRole } = renderWithProviders(<OpportunitiesHeader />, store);
    
    const heading = getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Test Company');
  });

  it('does not render title when isTitle is false', () => {
    const store = createMockStore();
    const { container } = renderWithProviders(<OpportunitiesHeader isTitle={false} />, store);
    
    const heading = container.querySelector('h1');
    expect(heading).toBeEmptyDOMElement();
  });

  it('renders Settings component when conditions are met', () => {
    const mockState = {
      opportunities: {
        project: null,
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
        ],
        status: false,
        statusProject: false
      },
      subcontractor: {
        trades: { 1: 'Trade 1', 2: 'Trade 2' }
      }
    };
    
    const store = createMockStore(mockState);
    const { getByTestId } = renderWithProviders(
      <OpportunitiesHeader isTitle={false} />, 
      store
    );
    
    expect(getByTestId('settings-component')).toBeInTheDocument();
  });

  it('does not render Settings when status is true', () => {
    const mockState = {
      opportunities: {
        project: null,
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
        ],
        status: true,
        statusProject: false
      },
      subcontractor: {
        trades: { 1: 'Trade 1', 2: 'Trade 2' }
      }
    };
    
    const store = createMockStore(mockState);
    const { queryByTestId } = renderWithProviders(
      <OpportunitiesHeader isTitle={false} />, 
      store
    );
    
    expect(queryByTestId('settings-component')).not.toBeInTheDocument();
  });

  it('does not render Settings when statusProject is true', () => {
    const mockState = {
      opportunities: {
        project: null,
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
        ],
        status: false,
        statusProject: true
      },
      subcontractor: {
        trades: { 1: 'Trade 1', 2: 'Trade 2' }
      }
    };
    
    const store = createMockStore(mockState);
    const { queryByTestId } = renderWithProviders(
      <OpportunitiesHeader isTitle={false} />, 
      store
    );
    
    expect(queryByTestId('settings-component')).not.toBeInTheDocument();
  });

  it('does not render Settings when not on find-opportunities page', () => {
    require('v2/helpers/url').getUrlWithoutParamers.mockReturnValue('/prosper/projects/other');
    
    const mockState = {
      opportunities: {
        project: null,
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
        ],
        status: false,
        statusProject: false
      },
      subcontractor: {
        trades: { 1: 'Trade 1', 2: 'Trade 2' }
      }
    };
    
    const store = createMockStore(mockState);
    const { queryByTestId } = renderWithProviders(
      <OpportunitiesHeader isTitle={false} />, 
      store
    );
    
    expect(queryByTestId('settings-component')).not.toBeInTheDocument();
  });

  it('filters matches correctly based on trades', () => {
    const mockState = {
      opportunities: {
        project: null,
        projects: [
          {
            tenders: [
              {
                packages: [1, 2, 3],
                registered: false,
                awarded: false
              },
              {
                packages: [4, 5],
                registered: false,
                awarded: false
              }
            ]
          }
        ],
        status: false,
        statusProject: false
      },
      subcontractor: {
        trades: { 1: 'Trade 1', 2: 'Trade 2' } // Only trades 1 and 2
      }
    };
    
    const store = createMockStore(mockState);
    const { getByTestId } = renderWithProviders(
      <OpportunitiesHeader isTitle={false} />, 
      store
    );
    
    // Should only match the first tender since it has packages 1 and 2
    expect(getByTestId('settings-component')).toBeInTheDocument();
  });

  it('filters out tenders that are both registered and awarded', () => {
    const mockState = {
      opportunities: {
        project: null,
        projects: [
          {
            tenders: [
              {
                packages: [1, 2],
                registered: true,
                awarded: true // Both registered AND awarded - should be filtered out
              },
              {
                packages: [1, 2],
                registered: true,
                awarded: false // Only registered - should be kept
              },
              {
                packages: [1, 2],
                registered: false,
                awarded: true // Only awarded - should be kept
              }
            ]
          }
        ],
        status: false,
        statusProject: false
      },
      subcontractor: {
        trades: { 1: 'Trade 1', 2: 'Trade 2' }
      }
    };
    
    const store = createMockStore(mockState);
    const { getByTestId } = renderWithProviders(
      <OpportunitiesHeader isTitle={false} />, 
      store
    );
    
    // Should render Settings since we have tenders that are not both registered AND awarded
    expect(getByTestId('settings-component')).toBeInTheDocument();
  });

  it('renders Settings with empty matches when all tenders are both registered and awarded', () => {
    const mockState = {
      opportunities: {
        project: null,
        projects: [
          {
            tenders: [
              {
                packages: [1, 2], // Should match trades 1 and 2
                registered: true,
                awarded: true // Both registered AND awarded - should be filtered out
              }
            ]
          }
        ],
        status: false,
        statusProject: false
      },
      subcontractor: {
        trades: { '1': 'Trade 1', '2': 'Trade 2' }
      }
    };
    
    const store = createMockStore(mockState);
    const { getByTestId } = renderWithProviders(
      <OpportunitiesHeader isTitle={false} />, 
      store
    );
    
    // Should render Settings but with 0 matches since tender is both registered AND awarded
    const settingsComponent = getByTestId('settings-component');
    expect(settingsComponent).toBeInTheDocument();
    expect(settingsComponent).toHaveTextContent('interest-results'); // 0 matches = plural form
  });

  it('matches snapshot with default state', () => {
    const store = createMockStore();
    const { container } = renderWithProviders(<OpportunitiesHeader />, store);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot with project data', () => {
    const mockState = {
      opportunities: {
        project: { project: 'Test Project' },
        projects: [],
        status: false,
        statusProject: false
      }
    };
    
    const store = createMockStore(mockState);
    const { container } = renderWithProviders(<OpportunitiesHeader />, store);
    expect(container.firstChild).toMatchSnapshot();
  });
});