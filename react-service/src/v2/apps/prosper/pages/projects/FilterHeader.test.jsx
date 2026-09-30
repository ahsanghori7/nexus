import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import FilterHeader from './FilterHeader';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key
  })
}));

// Mock BASE_DIRS global
global.BASE_DIRS = {
  V2: {
    PROSPER: 'prosper'
  }
};

// Mock hooks/context
const mockContext = {
  actions: {
    changeFilter: jest.fn(),
  }
};

jest.mock('hooks/context', () => ({
  useContext: jest.fn(() => mockContext)
}));

// Mock clink-components
jest.mock('clink-components', () => ({
  HOOKS: {
    useWindowDimensions: jest.fn(() => ({
      width: 1200,
      height: 800,
    })),
  },
  CONSTANTS: {
    dimensions: {
      SM_SCREEN: 768,
      MD_SCREEN: 1024,
      XL_SCREEN: 1200,
    },
  },
}));

// Mock OpportunitiesHeader component
jest.mock('./OpportunitiesHeader', () => {
  return function MockOpportunitiesHeader(props) {
    return <div data-testid="opportunities-header">OpportunitiesHeader</div>;
  };
});

// Mock local components with proper Jest factory syntax
jest.mock('./filters/Filter', () => {
  return {
    __esModule: true,
    default: require('react').forwardRef((props, ref) => {
      const React = require('react');
      return React.createElement('div', {
        ...props,
        ref,
        'data-testid': 'filter-component'
      }, 'Filter Component');
    }),
    FilterContent: (props) => {
      const React = require('react');
      return React.createElement('div', {
        ...props,
        'data-testid': 'filter-content'
      }, 'Filter Content');
    }
  };
});

jest.mock('./filters', () => {
  return {
    __esModule: true,
    default: (props) => {
      const React = require('react');
      return React.createElement('div', {
        ...props,
        'data-testid': 'filters-container'
      }, props.children);
    }
  };
});

jest.mock('./OpportunitiesHeader', () => {
  return {
    __esModule: true,
    default: (props) => {
      const React = require('react');
      return React.createElement('div', {
        ...props,
        'data-testid': 'opportunities-header'
      }, 'Opportunities Header');
    }
  };
});

// Mock Filters component
jest.mock('./filters', () => {
  return function MockFilters({ children, filterTitle }) {
    const mockReact = require('react');
    return mockReact.createElement('div', { 'data-testid': 'filters' }, [
      mockReact.createElement('span', { key: 'title' }, filterTitle),
      children
    ]);
  };
});

// Mock initial state for FilterHeader
const mockInitialState = {
  filters: {
    selected: {
      region: null,
      type: null,
      phase: null,
      trades: null
    },
    list: {
      types: [
        { id: 1, label: 'Construction' },
        { id: 2, label: 'Renovation' }
      ],
      phase: [
        { id: 1, label: 'Planning' },
        { id: 2, label: 'Execution' }
      ],
      trades: [
        { id: 101, label: 'Electrical' },
        { id: 102, label: 'Plumbing' }
      ],
      regions: [
        { id: 1, label: 'Victoria' },
        { id: 2, label: 'New South Wales' }
      ]
    }
  }
};

// Create a mock store
const createMockStore = (initialState = mockInitialState) => {
  const rootReducer = (state = initialState) => state;
  return createStore(rootReducer);
};

describe('FilterHeader Component', () => {
  let mockStore;
  let mockDispatch;

  beforeEach(() => {
    mockStore = createMockStore();
    mockDispatch = jest.fn();
    mockStore.dispatch = mockDispatch;
    
    // Reset all mocks
    jest.clearAllMocks();
  });

  const renderWithRedux = (component, store = mockStore) => {
    return render(
      <Provider store={store}>
        {component}
      </Provider>
    );
  };

  test('renders without crashing', () => {
    renderWithRedux(<FilterHeader />);
    expect(screen.getByTestId('opportunities-header')).toBeInTheDocument();
  });

  test('renders filter content sections', () => {
    renderWithRedux(<FilterHeader />);
    
    // Should render the main filters container
    expect(screen.getByTestId('filters')).toBeInTheDocument();
    
    // Should render all filter components
    const filters = screen.getAllByTestId('filter-component');
    expect(filters).toHaveLength(4); // region, type, trades, phase
  });

  test('renders with filters when available', () => {
    const stateWithFilters = {
      ...mockInitialState,
      filters: {
        ...mockInitialState.filters,
        selected: {
          ...mockInitialState.filters.selected,
          type: { id: 1, label: 'Construction' }
        }
      }
    };
    
    const storeWithFilters = createMockStore(stateWithFilters);
    renderWithRedux(<FilterHeader />, storeWithFilters);
    
    expect(screen.getByTestId('filters')).toBeInTheDocument();
    // Test that all filter components are rendered
    const filterComponents = screen.getAllByTestId('filter-component');
    expect(filterComponents).toHaveLength(4);
  });

  test('handles empty filter lists gracefully', () => {
    const stateWithEmptyFilters = {
      ...mockInitialState,
      filters: {
        ...mockInitialState.filters,
        list: {
          types: [],
          phase: [],
          trades: [],
          regions: []
        }
      }
    };
    
    const storeWithEmptyFilters = createMockStore(stateWithEmptyFilters);
    renderWithRedux(<FilterHeader />, storeWithEmptyFilters);
    
    expect(screen.getByTestId('filters')).toBeInTheDocument();
  });

  test('creates snapshot for FilterHeader component', () => {
    const { container } = renderWithRedux(<FilterHeader />);
    expect(container.firstChild).toMatchSnapshot();
  });
});