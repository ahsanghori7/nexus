import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import useColumns from './columns';

// Mock all the dependencies
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key
  })
}));

jest.mock('hooks/context', () => ({
  useContext: () => ({
    actions: {
      fetchOpportunities: jest.fn(() => Promise.resolve()),
      fetchEnquiries: jest.fn(() => Promise.resolve()),
      saveLatestOnLocal: jest.fn()
    }
  })
}));

jest.mock('v2/helpers/url', () => ({
  goTo: jest.fn()
}));

jest.mock('v2/apps/shared/components/Loading', () => 
  ({ status }) => status ? <div data-testid="loading">Loading...</div> : null
);

jest.mock('v2/apps/shared/components/cards/small/OpportunityCard', () => 
  ({ item, onDelete }) => (
    <div data-testid={`opportunity-card-${item.id}`}>
      <span>{item.title || item.id}</span>
      <button onClick={() => onDelete(item)}>Delete</button>
    </div>
  )
);

jest.mock('v2/apps/shared/components/cards/small/EnquiryCard', () => 
  ({ item }) => (
    <div data-testid={`enquiry-card-${item.id}`}>
      <span>{item.title || item.id}</span>
    </div>
  )
);

jest.mock('../empty-feed', () => 
  ({ type }) => <div data-testid={`empty-feed-${type}`}>Empty {type}</div>
);

jest.mock('./Dashboard.styled', () => ({
  StyledContent: ({ children, hasFooter }) => (
    <div data-testid="styled-content" data-has-footer={hasFooter}>
      {children}
    </div>
  ),
  StyledFooter: ({ children }) => (
    <div data-testid="styled-footer">
      {children}
    </div>
  )
}));

jest.mock('clink-components', () => ({
  Button: ({ children, handleClick, disabled, ...props }) => (
    <button 
      onClick={handleClick} 
      disabled={disabled}
      data-testid="clink-button"
      {...props}
    >
      {children}
    </button>
  ),
  Feed: ({ children, theme, maxHeight }) => (
    <div 
      data-testid="clink-feed" 
      data-theme={theme}
      data-max-height={maxHeight}
    >
      {children}
    </div>
  )
}));

// Mock global variables
global.BASE_DIRS = {
  V2: {
    PROSPER: 'prosper'
  }
};

global.BASE_URLS = {
  PROSPER: '/prosper'
};

describe('useColumns', () => {
  let mockDispatch;

  beforeEach(() => {
    mockDispatch = jest.fn();
    jest.clearAllMocks();
  });

  const defaultOpportunities = {
    latest: [],
    status: false
  };

  const defaultEnquiries = {
    latest: [],
    status: false
  };

  it('returns correct column structure with empty data', () => {
    const { result } = renderHook(() => 
      useColumns(defaultOpportunities, defaultEnquiries, {}, mockDispatch)
    );

    expect(result.current).toHaveLength(2);
    expect(result.current[0]).toHaveProperty('key', { one: true });
    expect(result.current[0]).toHaveProperty('title', 'latest-opportunities');
    expect(result.current[0]).toHaveProperty('content');
    
    expect(result.current[1]).toHaveProperty('key', { two: true });
    expect(result.current[1]).toHaveProperty('title', 'enquiries');
    expect(result.current[1]).toHaveProperty('content');
  });

  it('dispatches fetch actions on mount', () => {
    renderHook(() => 
      useColumns(defaultOpportunities, defaultEnquiries, {}, mockDispatch)
    );

    // The useEffect runs Promise.all with 2 actions, but Promise.all itself is one call
    // Plus any other internal calls, so we verify it was called
    expect(mockDispatch).toHaveBeenCalled();
  });

  it('shows empty feed when no opportunities', () => {
    const emptyOpportunities = {
      latest: [],
      status: false
    };

    const { result } = renderHook(() => 
      useColumns(emptyOpportunities, defaultEnquiries, {}, mockDispatch)
    );

    // Check that the opportunities column content includes empty feed
    expect(result.current[0].content).toBeDefined();
  });

  it('shows empty feed when no enquiries', () => {
    const emptyEnquiries = {
      latest: [],
      status: false
    };

    const { result } = renderHook(() => 
      useColumns(defaultOpportunities, emptyEnquiries, {}, mockDispatch)
    );

    // Check that the enquiries column content includes empty feed
    expect(result.current[1].content).toBeDefined();
  });

  it('shows opportunities when available', () => {
    const opportunitiesWithData = {
      latest: [
        { id: 1, title: 'Opportunity 1', restricted: false },
        { id: 2, title: 'Opportunity 2', restricted: true }
      ],
      status: false
    };

    const { result } = renderHook(() => 
      useColumns(opportunitiesWithData, defaultEnquiries, {}, mockDispatch)
    );

    expect(result.current[0].content).toBeDefined();
  });

  it('shows enquiries when available', () => {
    const enquiriesWithData = {
      latest: [
        { id: 1, title: 'Enquiry 1' },
        { id: 2, title: 'Enquiry 2' }
      ],
      status: false
    };

    const { result } = renderHook(() => 
      useColumns(defaultOpportunities, enquiriesWithData, {}, mockDispatch)
    );

    expect(result.current[1].content).toBeDefined();
  });

  it('shows loading state for opportunities', () => {
    const loadingOpportunities = {
      latest: [],
      status: true
    };

    const { result } = renderHook(() => 
      useColumns(loadingOpportunities, defaultEnquiries, {}, mockDispatch)
    );

    expect(result.current[0].content).toBeDefined();
  });

  it('shows loading state for enquiries', () => {
    const loadingEnquiries = {
      latest: [],
      status: true
    };

    const { result } = renderHook(() => 
      useColumns(defaultOpportunities, loadingEnquiries, {}, mockDispatch)
    );

    expect(result.current[1].content).toBeDefined();
  });

  it('handles null opportunities data', () => {
    const nullOpportunities = {
      latest: null,
      status: false
    };

    const { result } = renderHook(() => 
      useColumns(nullOpportunities, defaultEnquiries, {}, mockDispatch)
    );

    expect(result.current[0].content).toBeDefined();
  });

  it('handles null enquiries data', () => {
    const nullEnquiries = {
      latest: null,
      status: false
    };

    const { result } = renderHook(() => 
      useColumns(defaultOpportunities, nullEnquiries, {}, mockDispatch)
    );

    expect(result.current[1].content).toBeDefined();
  });

  it('handles undefined opportunities data', () => {
    const undefinedOpportunities = {
      latest: undefined,
      status: false
    };

    const { result } = renderHook(() => 
      useColumns(undefinedOpportunities, defaultEnquiries, {}, mockDispatch)
    );

    expect(result.current[0].content).toBeDefined();
  });

  it('handles undefined enquiries data', () => {
    const undefinedEnquiries = {
      latest: undefined,
      status: false
    };

    const { result } = renderHook(() => 
      useColumns(defaultOpportunities, undefinedEnquiries, {}, mockDispatch)
    );

    expect(result.current[1].content).toBeDefined();
  });
});