import React from 'react';

// Mock state for prosper projects page testing
export const mockInitialState = {
  opportunities: {
    projects: [
      {
        id: 1,
        region: 'Victoria',
        type: 'Construction',
        phase: 'Planning',
        packages: {
          '1': {
            id: 1,
            published_at: '2023-10-01T10:00:00Z',
            packages: [101, 102]
          }
        }
      },
      {
        id: 2,
        region: 'New South Wales',
        type: 'Renovation',
        phase: 'Execution',
        packages: {
          '2': {
            id: 2,
            published_at: '2023-10-15T10:00:00Z',
            packages: [103, 104]
          }
        }
      }
    ],
    status: false
  },
  filters: {
    selected: {
      region: null,
      type: null,
      phase: null,
      trades: null
    },
    loaded: 12
  },
  subcontractor: {
    trades: {
      '101': [{ id: 101, label: 'Electrical' }],
      '102': [{ id: 102, label: 'Plumbing' }],
      '103': [{ id: 103, label: 'Carpentry' }],
      '104': [{ id: 104, label: 'Painting' }]
    }
  },
  account: {
    distance: []
  }
};

// Mock actions
export const mockActions = {
  fetchOpportunities: jest.fn(() => ({ type: 'FETCH_OPPORTUNITIES' })),
  initFilter: jest.fn((filters) => ({ type: 'INIT_FILTER', payload: filters })),
  increaseLoaded: jest.fn((projects) => ({ type: 'INCREASE_LOADED', payload: projects })),
  distance: jest.fn((params) => ({ type: 'DISTANCE', payload: params }))
};

// Mock context
export const mockContext = {
  actions: mockActions
};

// Mock FilterHeader component
export const MockFilterHeader = () => (
  <div data-testid="filter-header">Filter Header</div>
);

// Mock OpportunityCard component
export const MockOpportunityCard = ({ item, distanceData }) => (
  <div data-testid="opportunity-card" data-item-id={item.id}>
    <div data-testid="card-id">{item.id}</div>
    <div data-testid="card-region">{item.region}</div>
    <div data-testid="card-type">{item.type}</div>
    <div data-testid="card-phase">{item.phase}</div>
    {item.isNew && <div data-testid="new-badge">New</div>}
    {distanceData && <div data-testid="distance-data">{distanceData.distance}</div>}
  </div>
);

export default {
  mockInitialState,
  mockActions,
  mockContext,
  MockFilterHeader,
  MockOpportunityCard
};

// Named exports for individual mocking
export { MockFilterHeader as default };
export const OpportunityCard = MockOpportunityCard;
