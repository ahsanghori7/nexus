import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import CompanyProfile from './index';

// Mock the shared components
jest.mock('v2/apps/shared/components/tabs', () => {
  return jest.fn(({ tabs, lastStepFunction, ...props }) => (
    <div data-testid="mock-tabs" {...props}>
      {tabs && tabs.map((tab, index) => (
        <div key={tab.id || index} data-testid={`tab-${tab.id || index}`}>
          <div data-testid={`tab-title-${tab.id}`}>{tab.title}</div>
          {tab.Content && (
            <div data-testid={`tab-content-${tab.id}`}>
              <tab.Content />
            </div>
          )}
        </div>
      ))}
      {lastStepFunction && (
        <button 
          data-testid="last-step-button" 
          onClick={lastStepFunction}
        >
          Complete
        </button>
      )}
    </div>
  ));
});

jest.mock('v2/apps/shared/components/company-v2/user-details', () => {
  return jest.fn((props) => (
    <div data-testid="mock-user-details" {...props}>
      User Details Component
    </div>
  ));
});

jest.mock('v2/apps/shared/components/company-v2/company-details', () => {
  return jest.fn((props) => (
    <div data-testid="mock-company-details" {...props}>
      Company Details Component
    </div>
  ));
});

jest.mock('v2/apps/shared/components/company-v2/trades-locations', () => {
  return jest.fn((props) => (
    <div data-testid="mock-trades-locations" {...props}>
      Trades Locations Component
    </div>
  ));
});

jest.mock('./ProfileCompleteUpdate', () => {
  return jest.fn(() => (
    <div data-testid="mock-profile-complete-update">
      Profile Complete Update
    </div>
  ));
});

jest.mock('v2/apps/shared/components/Loading', () => {
  return jest.fn(({ status, ...props }) => (
    <div data-testid="mock-loading" data-status={status} {...props}>
      Loading: {status}
    </div>
  ));
});

// Mock hooks/context
jest.mock('hooks/context', () => ({
  useContext: jest.fn(() => ({
    actions: {
      resetFilter: jest.fn(() => ({ type: 'RESET_FILTER' })),
      fetchCompany: jest.fn(() => ({ type: 'FETCH_COMPANY' })),
      updateSubcontractorDescription: jest.fn(() => ({ type: 'UPDATE_SUBCONTRACTOR_DESCRIPTION' })),
      updateProfile: jest.fn(() => Promise.resolve({ type: 'UPDATE_PROFILE' })),
      updateCompanyDetails: jest.fn(() => ({ type: 'UPDATE_COMPANY_DETAILS' })),
      updateOffering: jest.fn(() => ({ type: 'UPDATE_OFFERING' }))
    }
  }))
}));

describe('CompanyProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    const defaultProps = {
      contextType: 'prosper',
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
      },
      dispatch: jest.fn(),
      ...props
    };
    
    return render(<CompanyProfile {...defaultProps} />);
  };

  it('renders without crashing', () => {
    renderComponent();
    expect(screen.getByTestId('mock-tabs')).toBeInTheDocument();
  });

  it('renders all three tabs with correct titles', () => {
    renderComponent();
    
    expect(screen.getByTestId('tab-title-1')).toHaveTextContent('profile-user-details');
    expect(screen.getByTestId('tab-title-2')).toHaveTextContent('profile-company-details');
    expect(screen.getByTestId('tab-title-3')).toHaveTextContent('trades-and-locations');
  });

  it('renders tab contents correctly', () => {
    renderComponent();
    
    expect(screen.getByTestId('mock-user-details')).toBeInTheDocument();
    expect(screen.getByTestId('mock-company-details')).toBeInTheDocument();
    expect(screen.getByTestId('mock-trades-locations')).toBeInTheDocument();
  });

  it('shows ProfileCompleteUpdate when offering is completed', () => {
    renderComponent();
    
    // Initially, ProfileCompleteUpdate should not be visible
    expect(screen.queryByTestId('mock-profile-complete-update')).not.toBeInTheDocument();
    
    // Simulate completing the offering by triggering the lastStepFunction
    const lastStepButton = screen.getByTestId('last-step-button');
    fireEvent.click(lastStepButton);
    
    // Now ProfileCompleteUpdate should be visible
    expect(screen.getByTestId('mock-profile-complete-update')).toBeInTheDocument();
  });

  it('passes correct contextType prop to child components', () => {
    renderComponent({ contextType: 'custom-context' });
    
    const userDetails = screen.getByTestId('mock-user-details');
    const companyDetails = screen.getByTestId('mock-company-details');
    const tradesLocations = screen.getByTestId('mock-trades-locations');
    
    expect(userDetails).toHaveAttribute('contextType', 'custom-context');
    expect(companyDetails).toHaveAttribute('contextType', 'custom-context');
    expect(tradesLocations).toHaveAttribute('contextType', 'custom-context');
  });

  it('passes correct account ID to child components', () => {
    renderComponent();
    
    const userDetails = screen.getByTestId('mock-user-details');
    const companyDetails = screen.getByTestId('mock-company-details');
    const tradesLocations = screen.getByTestId('mock-trades-locations');
    
    expect(userDetails).toHaveAttribute('id', 'test-account-123');
    expect(companyDetails).toHaveAttribute('id', 'test-account-123');
    expect(tradesLocations).toHaveAttribute('id', 'test-account-123');
  });

  it('sets tabs configuration correctly', () => {
    renderComponent();
    
    const tabs = screen.getByTestId('mock-tabs');
    expect(tabs).toHaveAttribute('countryCode', 'US');
    expect(tabs).toHaveAttribute('hideActionButtonsInTabs', '0,1');
    // Check for presence of pageFromExternal
    expect(tabs).toHaveAttribute('pageFromExternal', '0');
  });

  it('passes correct data to child components', () => {
    renderComponent();
    
    const userDetails = screen.getByTestId('mock-user-details');
    const companyDetails = screen.getByTestId('mock-company-details');
    const tradesLocations = screen.getByTestId('mock-trades-locations');
    
    // Check that theme is passed to UserDetails
    expect(userDetails).toHaveAttribute('theme', 'prosper');
    
    // Check that all components receive the account ID
    expect(userDetails).toHaveAttribute('aid', 'test-account-123');
    expect(companyDetails).toHaveAttribute('aid', 'test-account-123');
    expect(tradesLocations).toHaveAttribute('aid', 'test-account-123');
  });

  it('handles different contextType values correctly', () => {
    renderComponent({ contextType: 'admin' });
    
    const userDetails = screen.getByTestId('mock-user-details');
    expect(userDetails).toHaveAttribute('contextType', 'admin');
  });

  it('renders tabs with proper structure', () => {
    renderComponent();
    
    // Check that all three tabs are rendered
    expect(screen.getByTestId('tab-1')).toBeInTheDocument();
    expect(screen.getByTestId('tab-2')).toBeInTheDocument();
    expect(screen.getByTestId('tab-3')).toBeInTheDocument();
    
    // Check that each tab has both title and content
    expect(screen.getByTestId('tab-content-1')).toBeInTheDocument();
    expect(screen.getByTestId('tab-content-2')).toBeInTheDocument();
    expect(screen.getByTestId('tab-content-3')).toBeInTheDocument();
  });

  it('shows loading when subcontractor status has message', () => {
    renderComponent({
      subcontractor: {
        accountId: 'test-account-123',
        status: { message: 'Loading...' },
        statusActions: { message: null },
        info: { account_id: 'test-account-123' },
        country: { code: 'US' }
      }
    });
    
    expect(screen.getByTestId('mock-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-tabs')).not.toBeInTheDocument();
  });

  it('matches snapshot for UI consistency', () => {
    const { container } = renderComponent();
    expect(container.firstChild).toMatchSnapshot();
  });
});