// Mock setup for admin modal components
import React from 'react';

// Mock ActionsDropdown component
export const mockActionsDropdown = jest.fn(() =>
  React.createElement('div', { 'data-testid': 'actions-dropdown' }, 'Actions Dropdown')
);

// Mock i18next
export const mockI18next = {
  t: jest.fn((key) => key),
};

// Mock subscription data
export const mockSubscriptionData = {
  subscription: {
    subscriptionsList: [
      {
        id: 1,
        label: 'Basic Plan',
        interval_type: 'monthly',
      },
      {
        id: 2,
        label: 'Premium Plan',
        interval_type: 'annual',
      },
    ],
  },
};

// Mock admin context
export const mockAdminContext = {
  actions: {
    createAccount: jest.fn(),
    fetchActivities: jest.fn(),
    fetchOpportunitiesByAccount: jest.fn(),
    fetchEngagement: jest.fn(),
    fetchAdminSupplyChain: jest.fn(),
    fetchTokens: jest.fn(),
    fetchSupplyChainAnalytics: jest.fn(),
  },
  account: {
    activity: [],
    opportunities: [],
    engagement: [],
    engagement_projects: [],
    supply_chain: [],
  },
  pages: {
    search: {
      acceptedModels: ['projects', 'users', 'accounts', 'accountsProsper', 'accountsProsperSupplyChain']
    }
  }
};

// Mock async helper functions
export const mockAsyncHelpers = {
  checkValid: jest.fn((value, field, setError, onSuccess, setOptions, regex) => {
    // Simulate success callback
    if (onSuccess) {
      onSuccess();
    }
    // Simulate setting options
    if (setOptions && field === 'company_name') {
      setOptions([
        { name: 'Test Company', number: '12345', address: { line1: 'Test Address' }, has_account: false }
      ]);
    }
  }),
  messages1: {
    company_name: 'Company already has account',
  },
};

// Mock data helper
export const mockDataHelper = {
  getAddress: jest.fn((address) => {
    if (address && address.line1) {
      return address.line1;
    }
    return 'Default Address';
  }),
};
