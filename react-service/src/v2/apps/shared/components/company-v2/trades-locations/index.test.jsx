import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import TradesLocations from './index';

// Mock the context hook
const mockUseContext = jest.fn();
jest.mock('hooks/context', () => ({
  useContext: () => mockUseContext(),
}));

// Mock SelectDialog component
jest.mock('v2/apps/shared/components/select', () => {
  return function SelectDialog({ name, title }) {
    return (
      <div data-testid={`select-dialog-${name}`}>
        <div data-testid={`title-${name}`}>{title}</div>
      </div>
    );
  };
});

// Mock MuiSubtitle component
jest.mock('../Mui.styled', () => ({
  MuiSubtitle: ({ children }) => <div data-testid="mui-subtitle">{children}</div>,
}));

// Mock lodash uniqBy
jest.mock('lodash/uniqBy', () => 
  jest.fn((array) => array || [])
);

// Mock i18n
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

describe('TradesLocations Component', () => {
  let store;
  const mockDispatch = jest.fn();
  
  // Mock window.scrollTo
  const mockScrollTo = jest.fn();
  Object.defineProperty(window, 'scrollTo', {
    value: mockScrollTo,
    writable: true,
  });

  const defaultProps = {
    contextType: 'someContext',
    data: {
      trades: [],
      regions: [],
      types: [],
    },
    attributes: {
      loading: false,
      trades: [],
      regions: [],
      projectType: [],
      loading1: false,
      loading2: false,
      loading3: false,
    },
    subcontractor: {
      loading: false,
    },
  };

  beforeEach(() => {
    // Setup basic Redux store
    store = configureStore({
      reducer: {
        attributes: (state = {
          loading: false,
          trades: [],
          regions: [],
          projectTypes: [],
        }) => state,
        subcontractor: (state = {
          loading: false,
        }) => state,
      },
      dispatch: mockDispatch,
    });

    // Mock useContext to return actions with proper Redux action objects
    mockUseContext.mockReturnValue({
      actions: {
        fetchAttrRegions: jest.fn(() => ({ type: 'FETCH_ATTR_REGIONS' })),
        fetchAttrTrades: jest.fn(() => ({ type: 'FETCH_ATTR_TRADES' })),
        fetchAttrProjectType: jest.fn(() => ({ type: 'FETCH_ATTR_PROJECT_TYPE' })),
        fetchAttributes: jest.fn(() => ({ type: 'FETCH_ATTRIBUTES' })),
        fetchSubcontractorData: jest.fn(() => ({ type: 'FETCH_SUBCONTRACTOR_DATA' })),
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockScrollTo.mockClear();
  });

  const renderComponent = (props = {}) => {
    const finalProps = { ...defaultProps, ...props };
    return render(
      <Provider store={store}>
        <TradesLocations {...finalProps} />
      </Provider>
    );
  };

  describe('Component Rendering', () => {
    it('renders without crashing', () => {
      expect(() => renderComponent()).not.toThrow();
    });

    it('renders trade selection dialog', () => {
      renderComponent();
      expect(screen.getByTestId('select-dialog-trades')).toBeInTheDocument();
    });

    it('renders region selection dialog', () => {
      renderComponent();
      expect(screen.getByTestId('select-dialog-regions')).toBeInTheDocument();
    });

    it('renders project type selection dialog', () => {
      renderComponent();
      expect(screen.getByTestId('select-dialog-types')).toBeInTheDocument();
    });

    it('displays correct titles for select dialogs', () => {
      renderComponent();
      expect(screen.getByTestId('title-trades')).toHaveTextContent('trades-cover');
      expect(screen.getByTestId('title-regions')).toHaveTextContent('locations');
      expect(screen.getByTestId('title-types')).toHaveTextContent('project-types-cover');
    });
  });

  describe('Props Handling', () => {
    it('handles empty props gracefully', () => {
      expect(() => renderComponent({})).not.toThrow();
    });

    it('handles loading state', () => {
      const props = {
        attributes: {
          loading: true,
          trades: [],
          regions: [],
          projectTypes: [],
        },
      };
      expect(() => renderComponent(props)).not.toThrow();
    });

    it('handles data arrays', () => {
      const props = {
        attributes: {
          loading: false,
          trades: [{ id: 1, name: 'Trade 1' }],
          regions: [{ id: 1, name: 'Region 1' }],
          projectTypes: [{ id: 1, name: 'Project Type 1' }],
        },
      };
      expect(() => renderComponent(props)).not.toThrow();
    });
  });
});