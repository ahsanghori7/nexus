// Mock for Prosper Dashboard components and dependencies
import React from 'react';

// Mock Redux store state
export const mockReduxState = {
  subcontractor: {
    id: 1,
    created_at: '2023-01-01T00:00:00Z',
    name: 'Test Subcontractor',
    subscription: {
      active: true,
      tokens: 100
    }
  },
  opportunities: {
    data: [
      {
        id: 1,
        title: 'Test Opportunity',
        status: 'active'
      }
    ],
    loading: false
  },
  enquiries: {
    data: [
      {
        id: 1,
        title: 'Test Enquiry',
        status: 'pending'
      }
    ],
    loading: false
  }
};

// Mock moment
export const mockMoment = {
  diff: jest.fn(() => 30), // 30 days difference
  __esModule: true,
  default: jest.fn(() => mockMoment)
};

// Mock flags helper
export const mockFlag = jest.fn((flagName) => {
  if (flagName === 'PROSPER_DASHBOARD_LAYOUT') return 'columns';
  return false;
});

// Mock WISTIA constants
export const mockWistiaConstants = {
  WHAT_ARE_TOKENS_MODAL: true
};

// Mock useConfig hook
export const mockUseConfig = jest.fn(() => ({
  one: { component: 'MockComponent1', props: {} },
  two: { component: 'MockComponent2', props: {} },
  three: { component: 'MockComponent3', props: {} }
}));

// Mock Layout component
export const MockLayout = ({ config }) => (
  <div data-testid="mock-layout">
    <div data-testid="layout-config">{JSON.stringify(config)}</div>
  </div>
);

// Mock EpochModal component
export const MockEpochModal = ({ createdAtDate, subcontractor }) => (
  <div data-testid="mock-epoch-modal">
    <div data-testid="created-at-date">{createdAtDate}</div>
    <div data-testid="subcontractor-id">{subcontractor?.id}</div>
  </div>
);

// Mock StyledContainer
export const MockStyledContainer = ({ children, ...props }) => (
  <div data-testid="mock-styled-container" {...props}>
    {children}
  </div>
);
