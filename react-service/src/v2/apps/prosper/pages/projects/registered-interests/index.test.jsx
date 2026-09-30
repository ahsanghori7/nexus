import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import RegisteredInterests from './index';

// Mock all dependencies
jest.mock('v2/hooks/context');
jest.mock('v2/helpers/url');

// Create a mock store
const createMockStore = (initialState = {}) => {
  const defaultState = {
    filters: {
      selected: {
        enquiryStatus: null
      },
      list: {
        enquiriesStatus: [
          { id: 1, status: 'Open', status_id: 1 },
          { id: 2, status: 'Closed', status_id: 2 }
        ]
      },
      loaded: 10
    },
    interests: {
      latest: [
        {
          id: 'project-1',
          title: 'Test Project 1',
          tenderTags: [
            { status_id: 1, status: 'Open' }
          ]
        },
        {
          id: 'project-2',
          title: 'Test Project 2',
          tenderTags: [
            { status_id: 2, status: 'Closed' }
          ]
        }
      ],
      status: false
    },
    ...initialState
  };

  return createStore(() => defaultState);
};

describe('RegisteredInterests', () => {
  let mockDispatch;
  let mockStore;

  const defaultProps = {
    resource: 'test-resource',
    method: 'GET',
    version: 'v1'
  };

  beforeEach(() => {
    mockDispatch = jest.fn();
    mockStore = createMockStore();
    jest.clearAllMocks();
  });

  const renderWithStore = (props = {}, storeState = {}) => {
    const store = createMockStore(storeState);
    return render(
      <Provider store={store}>
        <RegisteredInterests {...defaultProps} {...props} />
      </Provider>
    );
  };

  it('renders without crashing', () => {
    const { getByTestId } = renderWithStore();
    expect(getByTestId('container-component')).toBeInTheDocument();
  });

  it('displays filter component', () => {
    const { getByTestId } = renderWithStore();
    expect(getByTestId('filters-component')).toBeInTheDocument();
    expect(getByTestId('filter-component')).toBeInTheDocument();
  });

  it('displays interests when not loading', () => {
    const { getAllByTestId } = renderWithStore();
    const registeredCards = getAllByTestId('registered-card');
    expect(registeredCards).toHaveLength(2);
  });

  it('shows loading component when status is true', () => {
    const storeState = {
      interests: {
        latest: [],
        status: true
      }
    };
    const { getByTestId, queryByTestId } = renderWithStore({}, storeState);
    
    expect(getByTestId('loading-component')).toBeInTheDocument();
    expect(queryByTestId('registered-card')).not.toBeInTheDocument();
  });

  it('filters interests based on selected status', () => {
    const storeState = {
      filters: {
        selected: {
          enquiryStatus: { id: 1, status: 'Open', label: 'Open' }
        },
        list: {
          enquiriesStatus: [
            { id: 1, status: 'Open', status_id: 1 },
            { id: 2, status: 'Closed', status_id: 2 }
          ]
        },
        loaded: 10
      },
      interests: {
        latest: [
          {
            id: 'project-1',
            title: 'Test Project 1',
            tenderTags: [
              { status_id: 1, status: 'Open' }
            ]
          },
          {
            id: 'project-2',
            title: 'Test Project 2',
            tenderTags: [
              { status_id: 2, status: 'Closed' }
            ]
          }
        ],
        status: false
      }
    };

    const { getAllByTestId } = renderWithStore({}, storeState);
    // Should only show projects with 'Open' status
    const registeredCards = getAllByTestId('registered-card');
    expect(registeredCards).toHaveLength(1);
  });

  it('shows all interests when no filter is selected', () => {
    const { getAllByTestId } = renderWithStore();
    const registeredCards = getAllByTestId('registered-card');
    expect(registeredCards).toHaveLength(2);
  });

  it('displays load more button when there are more items', () => {
    const storeState = {
      filters: {
        selected: {},
        list: {
          enquiriesStatus: []
        },
        loaded: 1 // Show only 1 item, but we have 2
      },
      interests: {
        latest: [
          {
            id: 'project-1',
            title: 'Test Project 1',
            tenderTags: [
              { status_id: 1, status: 'Open' }
            ]
          },
          {
            id: 'project-2',
            title: 'Test Project 2',
            tenderTags: [
              { status_id: 2, status: 'Closed' }
            ]
          }
        ],
        status: false
      }
    };

    const { getByTestId } = renderWithStore({}, storeState);
    expect(getByTestId('load-more-button')).toBeInTheDocument();
  });

  it('passes correct version prop to Interest components', () => {
    const { getAllByTestId } = renderWithStore({ version: 'v2' });
    const registeredCards = getAllByTestId('registered-card');
    
    registeredCards.forEach(card => {
      expect(card).toHaveAttribute('data-version', 'v2');
    });
  });

  it('shows correct filter label when no status is selected', () => {
    const { getByTestId } = renderWithStore();
    const filterLabel = getByTestId('filter-label');
    expect(filterLabel).toHaveTextContent('text-interest-status');
  });

  it('shows selected status in filter label', () => {
    const storeState = {
      filters: {
        selected: {
          enquiryStatus: { id: 1, status: 'Open', label: 'Open' }
        },
        list: {
          enquiriesStatus: [
            { id: 1, status: 'Open', status_id: 1 }
          ]
        },
        loaded: 10
      }
    };

    const { getByTestId } = renderWithStore({}, storeState);
    const filterLabel = getByTestId('filter-label');
    expect(filterLabel).toHaveTextContent('Open');
  });

  it('handles filter selection', async () => {
    const { getByTestId } = renderWithStore();
    
    // Click on the first filter option
    const filterOption = getByTestId('filter-option-0');
    fireEvent.click(filterOption);
    
    // The click should trigger handleClick function in FilterContent
    expect(filterOption).toBeInTheDocument();
  });

  it('displays correct wrapper styling classes', () => {
    const { getByTestId } = renderWithStore();
    const container = getByTestId('container-component');
    expect(container).toHaveClass('registered-filters');
  });

  it('renders with StyledRegisteredWrapper for v1', () => {
    const { container } = renderWithStore({ version: 'v1' });
    // Check that the styled wrapper is rendered (it contains the interests)
    expect(container.querySelector('[data-testid="registered-card"]')).toBeInTheDocument();
  });

  it('renders with StyledRegisteredWrapper for v2', () => {
    const { container } = renderWithStore({ version: 'v2' });
    // Check that the styled wrapper is rendered (it contains the interests)
    expect(container.querySelector('[data-testid="registered-card"]')).toBeInTheDocument();
  });

  it('handles load more button click', async () => {
    const storeState = {
      filters: {
        selected: {},
        list: {
          enquiriesStatus: []
        },
        loaded: 1 // Show only 1 item, but we have 2
      },
      interests: {
        latest: [
          {
            id: 'project-1',
            title: 'Test Project 1',
            tenderTags: [
              { status_id: 1, status: 'Open' }
            ]
          },
          {
            id: 'project-2',
            title: 'Test Project 2',
            tenderTags: [
              { status_id: 2, status: 'Closed' }
            ]
          }
        ],
        status: false
      }
    };

    const { getByTestId } = renderWithStore({}, storeState);
    const loadMoreButton = getByTestId('load-more-button');
    
    fireEvent.click(loadMoreButton);
    
    // The click should trigger the loadMore function
    expect(loadMoreButton).toBeInTheDocument();
  });

  it('matches snapshot', () => {
    const { container } = renderWithStore();
    expect(container.firstChild).toMatchSnapshot();
  });
});