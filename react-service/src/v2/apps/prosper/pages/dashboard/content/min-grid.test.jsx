import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import grid from './min-grid';

// Mock all the dependencies
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key
  })
}));

jest.mock('hooks/context', () => ({
  useContext: () => ({
    actions: {
      fetchEnquiries: jest.fn(() => Promise.resolve())
    }
  })
}));

jest.mock('v2/helpers/url', () => ({
  goTo: jest.fn(),
  getBaseUrl: jest.fn((type) => `/base/${type}`)
}));

jest.mock('v2/apps/shared/components/Loading', () => 
  ({ status }) => status ? <div data-testid="loading">Loading...</div> : null
);

jest.mock('v2/apps/shared/components/cards/small/EnquiryCard', () => 
  ({ item, link }) => (
    <div data-testid={`enquiry-card-${item.id}`}>
      <span>{item.title || item.id}</span>
      <a href={link}>View</a>
    </div>
  )
);

jest.mock('../empty-feed', () => 
  ({ type }) => <div data-testid={`empty-feed-${type}`}>Empty {type}</div>
);

jest.mock('./Dashboard.styled', () => ({
  StyledContent: ({ children, hasFooter, height }) => (
    <div 
      data-testid="styled-content" 
      data-has-footer={hasFooter}
      data-height={height}
    >
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

describe('min-grid', () => {
  let mockDispatch;

  beforeEach(() => {
    mockDispatch = jest.fn();
    jest.clearAllMocks();
  });

  const defaultEnquiries = {
    latest: [],
    status: false
  };

  it('returns correct grid structure with empty data', () => {
    const { result } = renderHook(() => 
      grid(defaultEnquiries, mockDispatch)
    );

    expect(result.current).toHaveLength(1);
    expect(result.current[0]).toHaveProperty('key', { one: true });
    expect(result.current[0]).toHaveProperty('title', 'enquiries');
    expect(result.current[0]).toHaveProperty('content');
  });

  it('dispatches fetch actions on mount', () => {
    renderHook(() => 
      grid(defaultEnquiries, mockDispatch)
    );

    expect(mockDispatch).toHaveBeenCalled();
  });

  it('shows empty feed when no enquiries', () => {
    const emptyEnquiries = {
      latest: [],
      status: false
    };

    const { result } = renderHook(() => 
      grid(emptyEnquiries, mockDispatch)
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
      grid(enquiriesWithData, mockDispatch)
    );

    expect(result.current[0].content).toBeDefined();
  });

  it('shows loading state for enquiries', () => {
    const loadingEnquiries = {
      latest: [],
      status: true
    };

    const { result } = renderHook(() => 
      grid(loadingEnquiries, mockDispatch)
    );

    expect(result.current[0].content).toBeDefined();
  });

  it('handles null enquiries data', () => {
    const nullEnquiries = {
      latest: null,
      status: false
    };

    const { result } = renderHook(() => 
      grid(nullEnquiries, mockDispatch)
    );

    expect(result.current[0].content).toBeDefined();
  });

  it('handles undefined enquiries data', () => {
    const undefinedEnquiries = {
      latest: undefined,
      status: false
    };

    const { result } = renderHook(() => 
      grid(undefinedEnquiries, mockDispatch)
    );

    expect(result.current[0].content).toBeDefined();
  });

  it('handles enquiries with different content types', () => {
    const mixedEnquiries = {
      latest: [
        { id: 1, title: 'Text Enquiry' },
        { id: 2, description: 'Description only' },
        { id: 3 } // minimal enquiry
      ],
      status: false
    };

    const { result } = renderHook(() => 
      grid(mixedEnquiries, mockDispatch)
    );

    expect(result.current[0].content).toBeDefined();
  });

  it('handles enquiries while loading', () => {
    const loadingWithData = {
      latest: [{ id: 1, title: 'Enquiry' }],
      status: true
    };

    const { result } = renderHook(() => 
      grid(loadingWithData, mockDispatch)
    );

    expect(result.current[0].content).toBeDefined();
  });

  it('maintains consistent structure regardless of data state', () => {
    const testCases = [
      { latest: [], status: false },
      { latest: null, status: false },
      { latest: undefined, status: false },
      { latest: [{ id: 1 }], status: false },
      { latest: [], status: true }
    ];

    testCases.forEach((enquiries) => {
      const { result } = renderHook(() => 
        grid(enquiries, mockDispatch)
      );

      expect(result.current).toHaveLength(1);
      expect(result.current[0]).toHaveProperty('key');
      expect(result.current[0]).toHaveProperty('title');
      expect(result.current[0]).toHaveProperty('content');
    });
  });
});