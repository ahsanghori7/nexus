import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { createStore } from 'redux';
import '@testing-library/jest-dom';
import BOQ from './index';

// Mock the hooks/context
jest.mock('hooks/context', () => ({
  useContext: () => ({
    actions: {
      fetchBoQList: jest.fn(() => ({ type: 'MOCK_FETCH_BOQ_LIST' })),
      fetchUnits: jest.fn(() => ({ type: 'MOCK_FETCH_UNITS' })),
      fetchProjectStatuses: jest.fn(() => ({ type: 'MOCK_FETCH_PROJECT_STATUSES' })),
    },
  }),
}));

// Mock the BoqHeader component
jest.mock('./BoqHeader', () => ({
  BoqHeader: ({ children }) => (
    <div data-testid="boq-header">{children}</div>
  ),
}));

// Mock the Container component
jest.mock('./container', () => {
  return function Container(props) {
    return <div data-testid="boq-container" {...props} />;
  };
});

// Mock the useTheme hook
jest.mock('v2/apps/shared/components/muiTheme', () => () => ({}));

// Mock the styled component
jest.mock('v2/apps/clink/pages/tender-analysis/styled/mui', () => ({
  BoqContainer: ({ children }) => <div data-testid="boq-container-styled">{children}</div>,
}));

// Create a simple reducer for testing
const initialState = {
  boq: {
    entities: [],
    loading: false,
    units: [],
    projectStatuses: [],
  },
  project: {
    data: null,
  },
  layout: {},
};

const testReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'MOCK_FETCH_BOQ_LIST':
    case 'MOCK_FETCH_UNITS':
    case 'MOCK_FETCH_PROJECT_STATUSES':
      return state;
    default:
      return state;
  }
};

const createMockStore = (state = initialState) => createStore(testReducer, state);

const renderBOQWithProvider = (props = {}, routeProps = {}) => {
  const store = createMockStore();
  const defaultProps = {
    boq: initialState.boq,
    project: initialState.project,
    dispatch: jest.fn(),
    contextType: 'clink',
    ...props,
  };

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/test']} {...routeProps}>
        <BOQ {...defaultProps} />
      </MemoryRouter>
    </Provider>
  );
};

describe('BOQ Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderBOQWithProvider();
  });

  it('renders the BoqContainer and BoqHeader', () => {
    const { getByTestId } = renderBOQWithProvider();
    
    expect(getByTestId('boq-container-styled')).toBeInTheDocument();
    expect(getByTestId('boq-header')).toBeInTheDocument();
  });

  it('handles entities correctly when they exist', () => {
    const entitiesData = [
      {
        tender: { id: 1, label: 'Test Tender' },
      },
    ];
    
    const { getByTestId } = renderBOQWithProvider({
      boq: {
        entities: entitiesData,
        loading: false,
        units: [],
        projectStatuses: [],
      },
    });
    
    expect(getByTestId('boq-header')).toBeInTheDocument();
  });

  it('handles empty entities correctly', () => {
    const { getByTestId } = renderBOQWithProvider({
      boq: {
        entities: [],
        loading: false,
        units: [],
        projectStatuses: [],
      },
    });
    
    expect(getByTestId('boq-header')).toBeInTheDocument();
  });

  it('handles loading state', () => {
    const { getByTestId, queryByTestId } = renderBOQWithProvider({
      boq: {
        entities: [],
        loading: { message: 'Loading BoQ list' },
        uiLoading: { boqList: true, updateEntityById: {}, newBoqResetById: {}, aiPollById: {} },
        units: [],
        projectStatuses: [],
      },
    });
    
    expect(getByTestId('boq-page-skeleton')).toBeInTheDocument();
    expect(queryByTestId('boq-header')).toBeNull();
  });

  it('renders with project data', () => {
    const projectData = {
      data: {
        tender: [
          { id: 1, label: 'Test Tender 1' },
          { id: 2, label: 'Test Tender 2' },
        ],
      },
    };
    
    const { getByTestId } = renderBOQWithProvider({
      project: projectData,
    });
    
    expect(getByTestId('boq-header')).toBeInTheDocument();
  });

  it('matches snapshot', () => {
    const { container } = renderBOQWithProvider();
    expect(container.firstChild).toMatchSnapshot();
  });
});
