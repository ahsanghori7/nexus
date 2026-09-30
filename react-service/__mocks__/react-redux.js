// Mock for react-redux
import React from 'react';

// Store the current store for connect to use
let currentStore = null;

export const Provider = ({ children, store }) => {
  currentStore = store;
  return children;
};

export const connect = (mapStateToProps, mapDispatchToProps) => (Component) => {
  const ConnectedComponent = (props) => {
    const defaultMockState = {
      admin: {},
      logs: {
        list: [
          {
            id: 1,
            action_date: '2024-10-30T10:00:00Z',
            action: 'User Login',
            user_id: 123,
            description: 'User logged into system',
            ip_address: '192.168.1.1',
            user_agent: 'Mozilla/5.0 Chrome/129.0'
          },
          {
            id: 2,
            action_date: '2024-10-30T11:30:00Z',
            action: 'Data Export',
            user_id: 456,
            description: 'Exported user data',
            ip_address: '192.168.1.2',
            user_agent: 'Mozilla/5.0 Firefox/128.0'
          }
        ],
        listCount: 2
      },
      users: {
        list: [
          {
            id: 1,
            account_id: 123,
            company: 'Test Company 1',
            subscription: 'Basic Plan',
            subscription_id: 1,
            frequency: 'Monthly'
          },
          {
            id: 2,
            account_id: 456,
            company: 'Test Company 2',
            subscription: 'Premium Plan',
            subscription_id: 2,
            frequency: 'Annual'
          }
        ],
        listCount: 2
      },
      subscription: {
        subscriptionsList: [
          {
            id: 1,
            label: 'Basic Plan',
            interval_type: 'monthly'
          },
          {
            id: 2,
            label: 'Premium Plan',
            interval_type: 'annual'
          }
        ]
      },
      projects: {},
      project: {
        status: 'idle',
        projectEnquiries: [],
        loadingSummary: false,
        loadingStatus: false,
        openedDatePickerId: null,
        data: { id: 1, start: '2024-01-01', version: 1 }
      },
      account: {
        roles: [],
        approvalThresholds: {}
      },
      company: {
        userDetails: {
          id: 'test-user-123',
          name: 'Test User'
        }
      },
      engagement: {
        totalEnquiries: 0,
        totalQuotes: 0
      },
      features: {
        featureList: []
      },
      quotesTender: {
        loadingQuotes: false
      },
      order: {
        list: [],
        loadingOrders: false
      },
      constants: {},
      clinkAccount: {},
      analytics: {
        issuedpaidweek: [],
        issuedpaidday: [],
        usedfreeday: [],
        usedfreeweek: []
      },
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
      procurementSchedule: {
        interests: [],
        packages: [],
        submittingProcurement: true,
        errorProcurement: false,
        submittingInterest: true,
        submittingChain: true,
        errorInterest: false,
        enquiryProOnLoad: {},
        approvers: [],
        fetchingApprovers: false,
        deletingShortlisted: false,
        requestingApproval: false,
      }
    };

    // Use the store if available, otherwise use default mock state
    const state = currentStore ? currentStore.getState() : defaultMockState;
    const mockProps = mapStateToProps ? mapStateToProps(state) : {};
    const mockDispatch = jest.fn(() => Promise.resolve());

    return React.createElement(Component, {
      ...mockProps,
      dispatch: mockDispatch,
      ...props
    });
  };

  ConnectedComponent.displayName = `Connected(${Component.displayName || Component.name})`;
  return ConnectedComponent;
};

export const useSelector = jest.fn((selector) => {
  const defaultMockState = {
    admin: {},
    logs: {
      list: [
        {
          id: 1,
          action_date: '2024-10-30T10:00:00Z',
          action: 'User Login',
          user_id: 123,
          description: 'User logged into system',
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0 Chrome/129.0'
        },
        {
          id: 2,
          action_date: '2024-10-30T11:30:00Z',
          action: 'Data Export',
          user_id: 456,
          description: 'Exported user data',
          ip_address: '192.168.1.2',
          user_agent: 'Mozilla/5.0 Firefox/128.0'
        }
      ],
      listCount: 2
    },
    users: {
      list: [
        {
          id: 1,
          account_id: 123,
          company: 'Test Company 1',
          subscription: 'Basic Plan',
          subscription_id: 1,
          frequency: 'Monthly'
        },
        {
          id: 2,
          account_id: 456,
          company: 'Test Company 2',
          subscription: 'Premium Plan',
          subscription_id: 2,
          frequency: 'Annual'
        }
      ],
      listCount: 2
    },
    subscription: {
      subscriptionsList: [
        {
          id: 1,
          label: 'Basic Plan',
          interval_type: 'monthly'
        },
        {
          id: 2,
          label: 'Premium Plan',
          interval_type: 'annual'
        }
      ]
    },
    projects: {},
    project: {
      status: 'idle',
      projectEnquiries: [],
      loadingSummary: false,
      loadingStatus: false,
      openedDatePickerId: null,
      data: { id: 1, start: '2024-01-01', version: 1 }
    },
    account: {
      roles: [],
      approvalThresholds: {}
    },
    company: {
      userDetails: {
        id: 'test-user-123',
        name: 'Test User'
      }
    },
    engagement: {
      totalEnquiries: 0,
      totalQuotes: 0
    },
    features: {
      featureList: []
    },
    quotesTender: {
      loadingQuotes: false
    },
    order: {
      list: [],
      loadingOrders: false
    },
    constants: {},
    clinkAccount: {},
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
    procurementSchedule: {
      interests: [],
      packages: [],
      submittingProcurement: true,
      errorProcurement: false,
      submittingInterest: true,
      submittingChain: true,
      errorInterest: false,
      enquiryProOnLoad: {},
      approvers: [],
      fetchingApprovers: false,
      deletingShortlisted: false,
      requestingApproval: false,
    }
  };

  // Use the store if available, otherwise use default mock state
  const state = currentStore ? currentStore.getState() : defaultMockState;
  return selector(state);
});

export const useDispatch = jest.fn(() => jest.fn());
