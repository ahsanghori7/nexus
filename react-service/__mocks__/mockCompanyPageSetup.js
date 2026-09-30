// Mock for company page components
import React from 'react';

// Mock for shared components used in company pages
export const mockUserDetails = jest.fn(({ children, ...props }) => (
  <div data-testid="mock-user-details" {...props}>
    {children}
  </div>
));

export const mockCompanyDetails = jest.fn(({ children, ...props }) => (
  <div data-testid="mock-company-details" {...props}>
    {children}
  </div>
));

export const mockTradesLocations = jest.fn(({ children, ...props }) => (
  <div data-testid="mock-trades-locations" {...props}>
    {children}
  </div>
));

export const mockTabs = jest.fn(({ children, tabs, ...props }) => (
  <div data-testid="mock-tabs" {...props}>
    {tabs && tabs.map((tab, index) => (
      <div key={tab.id || index} data-testid={`tab-${tab.id || index}`}>
        {tab.title}
        {tab.Content && <tab.Content />}
      </div>
    ))}
    {children}
  </div>
));

export const mockLoading = jest.fn(({ status, children, ...props }) => (
  <div data-testid="mock-loading" data-status={status} {...props}>
    Loading: {status}
    {children}
  </div>
));

// Mock state for company components
export const mockCompanyState = {
  subcontractor: {
    accountId: 'test-account-123',
    status: { message: null },
    statusActions: { message: null },
    info: { account_id: 'test-account-123' },
    country: { code: 'US' }
  },
  company: {
    details: {
      name: 'Test Company',
      description: 'Test company description'
    },
    offering: {
      regions: [{ id: 1, name: 'Region 1' }],
      trades: [{ id: 1, name: 'Trade 1' }],
      types: [{ id: 1, name: 'Type 1' }]
    },
    status: { message: null },
    statusActions: { message: null }
  }
};

// Mock actions for company components
export const mockCompanyActions = {
  resetFilter: jest.fn(() => ({ type: 'RESET_FILTER' })),
  fetchCompany: jest.fn(() => ({ type: 'FETCH_COMPANY' })),
  updateSubcontractorDescription: jest.fn(() => ({ type: 'UPDATE_SUBCONTRACTOR_DESCRIPTION' })),
  updateProfile: jest.fn(() => ({
    type: 'UPDATE_PROFILE',
    then: jest.fn((callback) => {
      if (callback) callback();
      return Promise.resolve();
    })
  })),
  updateCompanyDetails: jest.fn(() => ({ type: 'UPDATE_COMPANY_DETAILS' })),
  updateOffering: jest.fn(() => ({ type: 'UPDATE_OFFERING' }))
};
