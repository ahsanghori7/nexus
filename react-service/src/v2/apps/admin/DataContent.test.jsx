import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import DataContent from './DataContent';

// Mock the tab modules with jest.mock
jest.mock('v2/apps/admin/pages/clink/Accounts/tabs', () => jest.fn());
jest.mock('v2/apps/admin/pages/prosper/Accounts/tabs', () => jest.fn());
jest.mock('v2/apps/admin/pages/clink/Features/tabs', () => jest.fn());

// Import the mocked modules
import clinkTabs from 'v2/apps/admin/pages/clink/Accounts/tabs';
import prosperTabs from 'v2/apps/admin/pages/prosper/Accounts/tabs';
import featuresTabs from 'v2/apps/admin/pages/clink/Features/tabs';

// Create a mock store with the required state structure
const createMockStore = (initialState = {}) => {
  const defaultState = {
    company: {
      userDetails: {
        id: 'test-user-123',
        name: 'Test User',
      },
    },
    engagement: {
      totalEnquiries: 5,
      totalQuotes: 3,
    },
    features: {
      featureList: ['feature1', 'feature2'],
    },
    ...initialState,
  };

  return configureStore({
    reducer: {
      company: (state = defaultState.company) => state,
      engagement: (state = defaultState.engagement) => state,
      features: (state = defaultState.features) => state,
    },
    preloadedState: defaultState,
  });
};

// Helper function to render component with Redux store
const renderWithProvider = (component, store = createMockStore()) => {
  return render(
    <Provider store={store}>
      {component}
    </Provider>
  );
};

describe('DataContent', () => {
  beforeEach(() => {
    // Set up mock implementations
    clinkTabs.mockImplementation((contextType, totalEnquiries = 0, totalQuotes = 0) => [
      {
        id: 0,
        label: 'engagement',
        content: React.createElement('div', { 'data-testid': 'clink-engagement-tab' }, 
          `Enquiries: ${totalEnquiries}, Quotes: ${totalQuotes}, Context: ${contextType}`
        ),
      },
      {
        id: 1,
        label: 'activity',
        content: React.createElement('div', { 'data-testid': 'clink-activity-tab' }, 
          `Activity tab for context: ${contextType}`
        ),
      },
    ]);

    prosperTabs.mockImplementation((contextType, uid) => [
      {
        id: 0,
        label: 'profile-information',
        content: React.createElement('div', { 'data-testid': 'prosper-profile-tab' }, 
          `Profile tab for context: ${contextType}, UID: ${uid}`
        ),
      },
      {
        id: 1,
        label: 'prequalification-information',
        content: React.createElement('div', { 'data-testid': 'prosper-prequalification-tab' }, 
          `Prequalification tab for context: ${contextType}`
        ),
      },
      {
        id: 2,
        label: 'activity',
        content: React.createElement('div', { 'data-testid': 'prosper-activity-tab' }, 
          `Activity tab for context: ${contextType}`
        ),
      },
    ]);

    featuresTabs.mockImplementation((contextType, featureList) => [
      {
        id: 0,
        label: 'envelopes',
        content: React.createElement('div', { 'data-testid': 'features-envelopes-tab' }, 
          `Envelopes tab for context: ${contextType}, Features: ${JSON.stringify(featureList)}`
        ),
      },
    ]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      renderWithProvider(
        <DataContent tabs="admin" contextType="test-context" />
      );
      
      expect(screen.getByTestId('preq-tab-wrapper')).toBeInTheDocument();
    });

    it('renders with correct CSS class', () => {
      renderWithProvider(
        <DataContent tabs="admin" contextType="test-context" />
      );
      
      const wrapper = screen.getByTestId('preq-tab-wrapper');
      expect(wrapper).toHaveClass('tabs-component');
    });

    it('renders the outer wrapper with correct class', () => {
      const { container } = renderWithProvider(
        <DataContent tabs="admin" contextType="test-context" />
      );
      
      const outerWrapper = container.querySelector('.preq-tab-wrapper');
      expect(outerWrapper).toBeInTheDocument();
    });
  });

  describe('Admin Tabs', () => {
    it('renders admin tabs with correct data', () => {
      const store = createMockStore({
        engagement: {
          totalEnquiries: 10,
          totalQuotes: 7,
        },
      });

      renderWithProvider(
        <DataContent tabs="admin" contextType="admin-context" />,
        store
      );

      expect(screen.getByTestId('clink-engagement-tab')).toBeInTheDocument();
      expect(screen.getByText(/Enquiries: 10, Quotes: 7, Context: admin-context/)).toBeInTheDocument();
    });

    it('handles zero enquiries and quotes for admin tabs', () => {
      const store = createMockStore({
        engagement: {
          totalEnquiries: 0,
          totalQuotes: 0,
        },
      });

      renderWithProvider(
        <DataContent tabs="admin" contextType="admin-context" />,
        store
      );

      expect(screen.getByText(/Enquiries: 0, Quotes: 0, Context: admin-context/)).toBeInTheDocument();
    });
  });

  describe('Admin Prosper Tabs', () => {
    it('renders adminProsper tabs with correct user ID', () => {
      const store = createMockStore({
        company: {
          userDetails: {
            id: 'prosper-user-456',
            name: 'Prosper User',
          },
        },
      });

      renderWithProvider(
        <DataContent tabs="adminProsper" contextType="prosper-context" />,
        store
      );

      expect(screen.getByTestId('prosper-profile-tab')).toBeInTheDocument();
      expect(screen.getByText(/Profile tab for context: prosper-context, UID: prosper-user-456/)).toBeInTheDocument();
    });

    it('renders multiple prosper tabs', () => {
      renderWithProvider(
        <DataContent tabs="adminProsper" contextType="prosper-context" />
      );

      expect(screen.getByTestId('prosper-profile-tab')).toBeInTheDocument();
      expect(screen.getByTestId('prosper-prequalification-tab')).toBeInTheDocument();
      expect(screen.getByTestId('prosper-activity-tab')).toBeInTheDocument();
    });
  });

  describe('Features Tabs', () => {
    it('renders features tabs with feature list', () => {
      const store = createMockStore({
        features: {
          featureList: ['envelope-feature', 'report-feature'],
        },
      });

      renderWithProvider(
        <DataContent tabs="features" contextType="features-context" />,
        store
      );

      expect(screen.getByTestId('features-envelopes-tab')).toBeInTheDocument();
      expect(screen.getByText(/Envelopes tab for context: features-context/)).toBeInTheDocument();
      expect(screen.getByText(/Features: \["envelope-feature","report-feature"\]/)).toBeInTheDocument();
    });

    it('handles empty feature list', () => {
      const store = createMockStore({
        features: {
          featureList: [],
        },
      });

      renderWithProvider(
        <DataContent tabs="features" contextType="features-context" />,
        store
      );

      expect(screen.getByTestId('features-envelopes-tab')).toBeInTheDocument();
      expect(screen.getByText(/Features: \[\]/)).toBeInTheDocument();
    });
  });

  describe('Default Case', () => {
    it('renders empty tabs component when tabs prop is unknown', () => {
      renderWithProvider(
        <DataContent tabs="unknown" contextType="test-context" />
      );

      const wrapper = screen.getByTestId('preq-tab-wrapper');
      expect(wrapper).toBeInTheDocument();
      
      // Should not render any specific tab content
      expect(screen.queryByTestId('clink-engagement-tab')).not.toBeInTheDocument();
      expect(screen.queryByTestId('prosper-profile-tab')).not.toBeInTheDocument();
      expect(screen.queryByTestId('features-envelopes-tab')).not.toBeInTheDocument();
    });

    it('renders empty tabs component when tabs prop is missing', () => {
      renderWithProvider(
        <DataContent contextType="test-context" />
      );

      const wrapper = screen.getByTestId('preq-tab-wrapper');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('Redux State Integration', () => {
    it('correctly extracts company data from Redux state', () => {
      const store = createMockStore({
        company: {
          userDetails: {
            id: 'state-test-123',
            name: 'State Test User',
            email: 'test@example.com',
          },
        },
      });

      renderWithProvider(
        <DataContent tabs="adminProsper" contextType="state-test" />,
        store
      );

      expect(screen.getByText(/UID: state-test-123/)).toBeInTheDocument();
    });

    it('correctly extracts engagement data from Redux state', () => {
      const store = createMockStore({
        engagement: {
          totalEnquiries: 25,
          totalQuotes: 18,
          otherData: 'ignored',
        },
      });

      renderWithProvider(
        <DataContent tabs="admin" contextType="engagement-test" />,
        store
      );

      expect(screen.getByText(/Enquiries: 25, Quotes: 18/)).toBeInTheDocument();
    });

    it('correctly extracts features data from Redux state', () => {
      const store = createMockStore({
        features: {
          featureList: ['test-feature-1', 'test-feature-2'],
          otherFeatureData: 'ignored',
        },
      });

      renderWithProvider(
        <DataContent tabs="features" contextType="features-test" />,
        store
      );

      expect(screen.getByText(/Features: \["test-feature-1","test-feature-2"\]/)).toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    it('passes contextType correctly to tab functions', () => {
      const customContext = 'custom-context-type';
      
      renderWithProvider(
        <DataContent tabs="admin" contextType={customContext} />
      );

      expect(screen.getByText(new RegExp(`Context: ${customContext}`))).toBeInTheDocument();
    });

    it('handles different contextType values', () => {
      const contexts = ['context1', 'context2', 'special-context'];
      
      contexts.forEach(context => {
        const { unmount } = renderWithProvider(
          <DataContent tabs="admin" contextType={context} />
        );
        
        expect(screen.getByText(new RegExp(`Context: ${context}`))).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Component Structure', () => {
    it('renders correct number of tab options for admin tabs', () => {
      renderWithProvider(
        <DataContent tabs="admin" contextType="test-context" />
      );

      // Admin tabs should have 2 options
      expect(screen.getByTestId('tab-option-0')).toBeInTheDocument();
      expect(screen.getByTestId('tab-option-1')).toBeInTheDocument();
      expect(screen.queryByTestId('tab-option-2')).not.toBeInTheDocument();
    });

    it('renders correct number of tab options for prosper tabs', () => {
      renderWithProvider(
        <DataContent tabs="adminProsper" contextType="test-context" />
      );

      // Prosper tabs should have 3 options
      expect(screen.getByTestId('tab-option-0')).toBeInTheDocument();
      expect(screen.getByTestId('tab-option-1')).toBeInTheDocument();
      expect(screen.getByTestId('tab-option-2')).toBeInTheDocument();
      expect(screen.queryByTestId('tab-option-3')).not.toBeInTheDocument();
    });

    it('renders correct number of tab options for features tabs', () => {
      renderWithProvider(
        <DataContent tabs="features" contextType="test-context" />
      );

      // Features tabs should have 1 option
      expect(screen.getByTestId('tab-option-0')).toBeInTheDocument();
      expect(screen.queryByTestId('tab-option-1')).not.toBeInTheDocument();
    });
  });

  describe('Component Snapshot', () => {
    it('matches snapshot for admin tabs', () => {
      const { container } = renderWithProvider(
        <DataContent tabs="admin" contextType="snapshot-test" />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for adminProsper tabs', () => {
      const { container } = renderWithProvider(
        <DataContent tabs="adminProsper" contextType="snapshot-test" />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for features tabs', () => {
      const { container } = renderWithProvider(
        <DataContent tabs="features" contextType="snapshot-test" />
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});