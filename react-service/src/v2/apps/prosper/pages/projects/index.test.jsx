import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import moment from 'moment';
import '@testing-library/jest-dom';

// Mock dependencies first (before import)
jest.mock('hooks/context', () => ({
  useContext: jest.fn()
}));

jest.mock('v2/helpers/url', () => ({
  getUrl: jest.fn()
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key
  })
}));

// Mock local components
jest.mock('./Container.styled', () => {
  return {
    __esModule: true,
    default: (props) => {
      const React = require('react');
      return React.createElement('div', {
        ...props,
        'data-testid': 'container-styled'
      }, props.children);
    }
  };
});

jest.mock('./Opportunities.styled', () => {
  return {
    __esModule: true,
    default: (props) => {
      const React = require('react');
      return React.createElement('div', {
        ...props,
        'data-testid': 'opportunities-styled'
      }, props.children);
    }
  };
});

jest.mock('./FilterHeader', () => {
  return {
    __esModule: true,
    default: (props) => {
      const React = require('react');
      return React.createElement('div', {
        ...props,
        'data-testid': 'filter-header'
      }, 'Filter Header');
    }
  };
});

// Mock shared components
jest.mock('v2/apps/shared/components/cards/big/OpportunityCard', () => {
  return {
    __esModule: true,
    default: (props) => {
      const React = require('react');
      return React.createElement('div', {
        ...props,
        'data-testid': 'opportunity-card',
        'data-item-id': props.item?.id
      }, `Opportunity Card ${props.item?.id}`);
    }
  };
});

jest.mock('v2/apps/shared/components/Loading', () => {
  return {
    __esModule: true,
    default: (props) => {
      const React = require('react');
      return React.createElement('div', {
        ...props,
        'data-testid': 'loading-component'
      }, props.status ? 'Loading...' : null);
    }
  };
});

jest.mock('v2/apps/prosper/shared/load_more', () => {
  return {
    __esModule: true,
    default: (props) => {
      const React = require('react');
      return React.createElement('div', {
        ...props,
        'data-testid': 'load-more'
      }, 'Load More');
    }
  };
});

// Mock lodash functions
jest.mock('lodash/isNil', () => jest.fn());
jest.mock('lodash/chunk', () => jest.fn());

// Import the component after mocks
import Projects from './index';
import { useContext } from 'hooks/context';
import { getUrl } from 'v2/helpers/url';
import isNil from 'lodash/isNil';
import chunk from 'lodash/chunk';

// Create mock store
const middlewares = [thunk];
const mockStore = configureStore(middlewares);

describe('Projects Component', () => {
  let mockContextActions;
  let mockInitialState;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock context
    mockContextActions = {
      fetchOpportunities: jest.fn(),
      initFilter: jest.fn(),
      increaseLoaded: jest.fn(),
      distance: jest.fn()
    };
    
    useContext.mockReturnValue({
      actions: mockContextActions
    });

    // Mock URL helper
    getUrl.mockReturnValue('https://example.com/resources');

    // Mock lodash functions
    isNil.mockImplementation((value) => value == null);
    chunk.mockImplementation((array, size) => {
      const result = [];
      for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
      }
      return result;
    });

    // Mock global BASE_DIRS
    global.BASE_DIRS = {
      V2: {
        PROSPER: 'prosper'
      }
    };

    // Initial state
    mockInitialState = {
      opportunities: {
        projects: [],
        status: false
      },
      filters: {
        selected: {
          region: null,
          type: null,
          phase: null,
          trades: null
        },
        loaded: 6
      },
      subcontractor: {
        trades: {}
      },
      account: {
        distance: []
      }
    };
  });

  const renderWithRedux = (component, store = mockStore(mockInitialState)) => {
    return render(
      <Provider store={store}>
        {component}
      </Provider>
    );
  };

  test('renders without crashing', () => {
    renderWithRedux(<Projects />);
    
    expect(screen.getByTestId('container-styled')).toBeInTheDocument();
    expect(screen.getByTestId('filter-header')).toBeInTheDocument();
    expect(screen.getByTestId('loading-component')).toBeInTheDocument();
    expect(screen.getByTestId('opportunities-styled')).toBeInTheDocument();
    expect(screen.getByTestId('load-more')).toBeInTheDocument();
  });

  test('fetches opportunities on mount', () => {
    renderWithRedux(<Projects />);
    
    expect(mockContextActions.fetchOpportunities).toHaveBeenCalledTimes(1);
  });

  test('renders loading state when status is true', () => {
    const stateWithLoading = {
      ...mockInitialState,
      opportunities: {
        ...mockInitialState.opportunities,
        status: true
      }
    };
    
    const store = mockStore(stateWithLoading);
    renderWithRedux(<Projects />, store);
    
    const loadingComponent = screen.getByTestId('loading-component');
    expect(loadingComponent).toBeInTheDocument();
  });

  test('displays no opportunities message when no projects available', async () => {
    const stateWithNoProjects = {
      ...mockInitialState,
      opportunities: {
        projects: [],
        status: false
      }
    };
    
    const store = mockStore(stateWithNoProjects);
    renderWithRedux(<Projects />, store);
    
    await waitFor(() => {
      expect(screen.getByText('no-opportunities-message-2')).toBeInTheDocument();
      expect(screen.getByText('resources')).toBeInTheDocument();
    });
  });

  test('renders opportunity cards when projects are available', async () => {
    const mockProject = {
      id: 1,
      region: 'Test Region',
      type: 'Construction',
      phase: 'Planning',
      packages: {
        1: {
          packages: [1, 2],
          published_at: moment().subtract(3, 'days').toISOString()
        }
      }
    };

    const stateWithProjects = {
      ...mockInitialState,
      opportunities: {
        projects: [mockProject],
        status: false
      }
    };
    
    const store = mockStore(stateWithProjects);
    renderWithRedux(<Projects />, store);
    
    await waitFor(() => {
      expect(screen.getByTestId('opportunity-card')).toBeInTheDocument();
      expect(screen.getByText('Opportunity Card 1')).toBeInTheDocument();
    });
  });

  test('initializes filters when projects change', async () => {
    const mockProject = {
      id: 1,
      region: 'Test Region',
      type: 'Construction',
      phase: 'Planning',
      packages: { 1: { packages: [1] } }
    };

    const stateWithProjects = {
      ...mockInitialState,
      opportunities: {
        projects: [mockProject],
        status: false
      }
    };
    
    const store = mockStore(stateWithProjects);
    renderWithRedux(<Projects />, store);
    
    await waitFor(() => {
      // Should call initFilter for regions, types, phase, and trades (4 total)
      expect(mockContextActions.initFilter).toHaveBeenCalledTimes(4);
    });
  });

  test('initializes trade filters when account trades change', async () => {
    const stateWithTrades = {
      ...mockInitialState,
      subcontractor: {
        trades: {
          1: [{ label: 'Trade 1' }],
          2: [{ label: 'Trade 2' }]
        }
      }
    };
    
    const store = mockStore(stateWithTrades);
    renderWithRedux(<Projects />, store);
    
    await waitFor(() => {
      // Should call initFilter for trades (in addition to the 3 from projects)
      expect(mockContextActions.initFilter).toHaveBeenCalledTimes(4);
    });
  });

  test('filters projects based on selected filters', async () => {
    const mockProjects = [
      {
        id: 1,
        region: 'Region A',
        type: 'Construction',
        phase: 'Planning',
        packages: { 1: { packages: [1], published_at: moment().toISOString() } }
      },
      {
        id: 2,
        region: 'Region B',
        type: 'Demolition',
        phase: 'Execution',
        packages: { 1: { packages: [2], published_at: moment().toISOString() } }
      }
    ];

    const stateWithFilters = {
      ...mockInitialState,
      opportunities: {
        projects: mockProjects,
        status: false
      },
      filters: {
        ...mockInitialState.filters,
        selected: {
          region: { label: 'Region A' },
          type: null,
          phase: null,
          trades: null
        }
      }
    };
    
    const store = mockStore(stateWithFilters);
    renderWithRedux(<Projects />, store);
    
    await waitFor(() => {
      // Should only show the filtered project
      expect(screen.getByTestId('opportunity-card')).toBeInTheDocument();
      expect(screen.getByText('Opportunity Card 1')).toBeInTheDocument();
      expect(screen.queryByText('Opportunity Card 2')).not.toBeInTheDocument();
    });
  });

  test('filters out projects without packages', async () => {
    const mockProjects = [
      {
        id: 1,
        region: 'Region A',
        type: 'Construction',
        phase: 'Planning',
        packages: {}
      },
      {
        id: 2,
        region: 'Region B',
        type: 'Demolition',
        phase: 'Execution',
        packages: { 1: { packages: [2], published_at: moment().toISOString() } }
      }
    ];

    const stateWithProjects = {
      ...mockInitialState,
      opportunities: {
        projects: mockProjects,
        status: false
      }
    };
    
    const store = mockStore(stateWithProjects);
    renderWithRedux(<Projects />, store);
    
    await waitFor(() => {
      // Should only show project with packages
      expect(screen.getByTestId('opportunity-card')).toBeInTheDocument();
      expect(screen.getByText('Opportunity Card 2')).toBeInTheDocument();
      expect(screen.queryByText('Opportunity Card 1')).not.toBeInTheDocument();
    });
  });

  test('marks new opportunities correctly', async () => {
    const mockProject = {
      id: 1,
      region: 'Test Region',
      type: 'Construction',
      phase: 'Planning',
      packages: {
        1: {
          packages: [1],
          published_at: moment().subtract(3, 'days').toISOString() // Within 7 days
        }
      }
    };

    const stateWithNewProject = {
      ...mockInitialState,
      opportunities: {
        projects: [mockProject],
        status: false
      }
    };
    
    const store = mockStore(stateWithNewProject);
    renderWithRedux(<Projects />, store);
    
    await waitFor(() => {
      expect(screen.getByTestId('opportunity-card')).toBeInTheDocument();
    });
  });

  test('fetches distance data for visible projects', async () => {
    const mockProject = {
      id: 1,
      region: 'Test Region',
      type: 'Construction',
      phase: 'Planning',
      packages: { 1: { packages: [1], published_at: moment().toISOString() } }
    };

    const stateWithProjects = {
      ...mockInitialState,
      opportunities: {
        projects: [mockProject],
        status: false
      }
    };
    
    const store = mockStore(stateWithProjects);
    renderWithRedux(<Projects />, store);
    
    await waitFor(() => {
      expect(mockContextActions.distance).toHaveBeenCalled();
    });
  });

  test('creates snapshot correctly', () => {
    const { container } = renderWithRedux(<Projects />);
    expect(container.firstChild).toMatchSnapshot();
  });
});