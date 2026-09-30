import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock react-pdf first to avoid ES module issues
jest.mock('react-pdf', () => {
  const React = require('react');
  return {
    pdfjs: {
      GlobalWorkerOptions: {
        workerSrc: '',
      },
      version: 'mock-version',
    },
    Document: ({ children, onLoadSuccess }) => {
      const [loaded, setLoaded] = React.useState(false);
      React.useEffect(() => {
        const timer = setTimeout(() => {
          if (onLoadSuccess) onLoadSuccess({ numPages: 10 });
          setLoaded(true);
        }, 10);
        return () => clearTimeout(timer);
      }, [onLoadSuccess]);
      return React.createElement('div', { 'data-testid': 'pdf-document' }, loaded ? children : null);
    },
    Page: ({ pageNumber, scale, onLoadSuccess }) => {
      React.useEffect(() => {
        if (onLoadSuccess) {
          setTimeout(() => onLoadSuccess({ width: 800, height: 1200 }), 10);
        }
      }, [onLoadSuccess]);
      return React.createElement('div', { 'data-testid': 'pdf-page', 'data-page-number': pageNumber });
    },
  };
});

// Mock all styled-components first to avoid any issues
jest.mock('@mui/material/styles', () => ({
  styled: (component) => (templateOrOptions) => {
    const React = require('react');
    if (typeof templateOrOptions === 'function') {
      return React.forwardRef((props, ref) => {
        const { children, ...rest } = props;
        return React.createElement(component, { ref, ...rest }, children);
      });
    }
    return React.forwardRef((props, ref) => {
      const { children, ...rest } = props;
      return React.createElement(component, { ref, ...rest }, children);
    });
  },
  useTheme: () => ({
    palette: {
      divider: '#e0e0e0',
      text: {
        primary: '#000000',
        secondary: '#757575',
      },
    },
  }),
}));

// Import the component AFTER setting up the mocks
import EnquiriesV2 from './index';

// Mock all dependencies
jest.mock('react-infinite-scroll-component', () => {
  const React = require('react');
  return React.forwardRef(({ children, dataLength, next, hasMore, loader, scrollableTarget, ...props }, ref) => (
    <div 
      ref={ref} 
      data-testid="infinite-scroll" 
      data-length={dataLength}
      data-has-more={hasMore ? 'true' : 'false'}
      {...props}
    >
      {children}
      {hasMore && loader}
    </div>
  ));
});

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'text-create-quote': 'Create Quote',
        'access-digital-price-breakdown': 'Access Digital Price Breakdown',
      };
      return translations[key] || key.toUpperCase();
    },
  }),
}));

jest.mock('react-redux', () => ({
  connect: (mapStateToProps) => (component) => {
    const ConnectedComponent = (props) => {
      const React = require('react');
      // Use the props passed to the component instead of a fixed mock state
      return React.createElement(component, props);
    };
    ConnectedComponent.displayName = `Connected(${component.displayName || component.name})`;
    return ConnectedComponent;
  },
}));

// Mock the context hook
jest.mock('v2/hooks/context', () => ({
  useContext: jest.fn(() => ({
    actions: {
      fetchEnquiries: jest.fn(),
      fetchDocumentsHistory: jest.fn(),
      nextBatch: jest.fn(),
      tenderIsDownloaded: jest.fn(),
      patchEnquiriesStatus: jest.fn(),
    },
  })),
}));

// Mock the expanded hook
jest.mock('v2/hooks/useExpanded', () => {
  return jest.fn(() => ({
    expanded: [1],
    handleChangeExpanded: jest.fn(),
  }));
});

// Mock the status helper
jest.mock('v2/helpers/status/enquiries', () => ({
  getStatus: jest.fn((data) => ({
    status: data?.status || 'TENDER_RECEIVED',
  })),
}));

// Mock analytics
jest.mock('v2/services/helpers', () => ({
  analytics: jest.fn((event, authorId, groupId, callback) => {
    if (callback) callback();
  }),
}));

// Mock subscription helper
jest.mock('v2/helpers/user/subscription', () => {
  return function Subscription() {
    this.isTokenUser = jest.fn().mockReturnValue(false);
    this.isActivatedSupplyChain = jest.fn().mockReturnValue(true);
  };
});

// Mock query string helper
jest.mock('v2/helpers/url', () => ({
  getQueryStringVars: jest.fn(() => ({ enquiry_id: '1' })),
}));

// Mock the global BASE_DIRS
global.BASE_DIRS = {
  V2: {
    PROSPER: 'prosper'
  }
};

// Mock MUI components
jest.mock('@mui/material', () => {
  const React = require('react');
  
  const createMockComponent = (name, tag = 'div') => {
    const Component = React.forwardRef(({ children, sx, ...props }, ref) =>
      React.createElement(tag, { ref, 'data-testid': `mui-${name.toLowerCase()}`, ...props }, children)
    );
    Component.displayName = name;
    return Component;
  };

  return {
    __esModule: true,
    Box: createMockComponent('Box'),
    Card: createMockComponent('Card'),
    Paper: createMockComponent('Paper'),
    Grid: createMockComponent('Grid'),
    List: createMockComponent('List', 'ul'),
    ListItem: createMockComponent('ListItem', 'li'),
    Link: createMockComponent('Link', 'a'),
    Skeleton: createMockComponent('Skeleton'),
    ListItemButton: createMockComponent('ListItemButton', 'button'),
    styled: (component) => () => component,
  };
});

// Mock MUI icons
jest.mock('@mui/icons-material/FormatListNumbered', () => {
  const React = require('react');
  return React.forwardRef((props, ref) => 
    React.createElement('svg', { ref, 'data-testid': 'format-list-icon', ...props })
  );
});

// Mock Loading component
jest.mock('v2/apps/shared/components/Loading', () => {
  const React = require('react');
  return ({ status }) => status ? React.createElement('div', { 'data-testid': 'loading' }, 'Loading...') : null;
});

// Mock all the child components
jest.mock('./enquiry-modal', () => {
  const React = require('react');
  return React.forwardRef((props, ref) => 
    React.createElement('div', { ref, 'data-testid': 'enquiry-modal' }, `Enquiry Modal for ${props.enquiry?.id}`)
  );
});

jest.mock('./Header', () => {
  const React = require('react');
  return ({ title, subheader, ActionCollapse }) => 
    React.createElement('div', { 'data-testid': 'header' }, 
      React.createElement('h3', null, title),
      React.createElement('p', null, subheader),
      ActionCollapse
    );
});

jest.mock('./Content', () => {
  const React = require('react');
  return ({ data, idContact }) => 
    React.createElement('div', { 'data-testid': 'content' }, `Content for ${data?.id}`);
});

jest.mock('./Progress', () => {
  const React = require('react');
  return ({ data }) => 
    React.createElement('div', { 'data-testid': 'progress' }, `Progress for ${data?.id}`);
});

jest.mock('./actions/ActionButtonContent', () => {
  const React = require('react');
  return ({ label, data, handleAction }) => 
    React.createElement('button', { 
      'data-testid': 'action-button',
      onClick: handleAction 
    }, label || 'Action Button');
});

jest.mock('./actions/SignOrder', () => {
  const React = require('react');
  return ({ data }) => 
    React.createElement('div', { 'data-testid': 'sign-order' }, `Sign Order for ${data?.id}`);
});

jest.mock('./collapse/CollapseEnquiries', () => {
  const React = require('react');
  return (props) => 
    React.createElement('div', { 'data-testid': 'collapse-enquiries' }, 'Collapse Enquiries');
});

jest.mock('./ProjectContent', () => {
  const React = require('react');
  return ({ data }) => 
    React.createElement('div', { 'data-testid': 'project-content' }, `Project Content for ${data?.id}`);
});

jest.mock('./actions/AcceptDeclineEnquiry', () => {
  const React = require('react');
  return ({ data, accept, decline, handleOpen, handleClose, openConfirm }) => 
    React.createElement('div', { 'data-testid': 'accept-decline' }, 
      React.createElement('button', { 'data-testid': 'accept-btn', onClick: accept }, 'Accept'),
      React.createElement('button', { 'data-testid': 'decline-btn', onClick: decline }, 'Decline')
    );
});

jest.mock('./NoView', () => {
  const React = require('react');
  return ({ subcontractor }) => 
    React.createElement('div', { 'data-testid': 'no-view' }, 'No View Component');
});

jest.mock('./document-history', () => {
  const React = require('react');
  return ({ selected, documents, tenderId }) => 
    React.createElement('div', { 'data-testid': 'document-history' }, 'Document History');
});

// Mock Subheader
jest.mock('v2/apps/prosper/shared/Subheader', () => {
  const React = require('react');
  return ({ data }) => 
    React.createElement('div', { 'data-testid': 'subheader' }, `Subheader for ${data?.id}`);
});

// Mock Container
jest.mock('../Container.styled', () => ({
  __esModule: true,
  default: ({ children, ...props }) => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'container', ...props }, children);
  },
  StyledEnquiryModal: ({ children, ...props }) => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'styled-enquiry-modal', ...props }, children);
  },
}));

// Mock tender-insights actions
jest.mock('v2/store/reducers/prosper/tender-insights', () => ({
  fetchTenderInsights: jest.fn(() => ({ type: 'mock_fetch' })),
  createTenderInsights: jest.fn(() => ({ type: 'mock_create' })),
}));

// Mock AIAnalysisModal component
jest.mock('./components/AIAnalysisModal', () => {
  const React = require('react');
  return ({ open, onClose, tenderId, dispatch, enquiry }) => 
    open ? React.createElement('div', { 'data-testid': 'ai-analysis-modal' }, `AI Analysis Modal for ${tenderId}`) : null;
});

describe('EnquiriesV2 Component', () => {
  const mockDispatch = jest.fn();
  
  const mockProps = {
    enquiries: {
      latest: [
        { id: 1, project: 'Project 1', package: 'Package 1' },
        { id: 2, project: 'Project 2', package: 'Package 2' },
      ],
      current: [
        {
          id: 1,
          project: 'Project 1',
          package: 'Package 1',
          contractor: 'Contractor 1',
          trades: 'Trade 1',
          period_start: '2024-01-01',
          period_end: '2024-12-31',
          period_amount: 100000,
          tender_amount: 1000000,
          author_id: 'author1',
          group_id: 1,
          project_id: 1,
          slug: 'project-1',
          status: 'TENDER_RECEIVED',
          document: {
            enquiry: {
              has_boq: true,
            },
          },
        },
        {
          id: 2,
          project: 'Project 2',
          package: 'Package 2',
          contractor: 'Contractor 2',
          trades: 'Trade 2',
          period_start: '2024-02-01',
          period_end: '2024-11-30',
          period_amount: 200000,
          tender_amount: 2000000,
          author_id: 'author2',
          group_id: 2,
          project_id: 2,
          slug: 'project-2',
          status: 'TENDER_ACCEPTED',
          document: {
            enquiry: {
              has_boq: false,
            },
          },
        },
      ],
      status: false,
      documents: [],
    },
    subcontractor: {
      id: 1,
      subscription_id: 1,
    },
    tenderInsights: {
      insights: {},
    },
    dispatch: mockDispatch,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    // Minimal test to debug the component import issue
    const minimalProps = {
      enquiries: { current: [], status: '', latest: [] },
      subcontractor: { id: 1 },
      tenderInsights: { insights: {} },
      dispatch: jest.fn()
    };
    
    render(<EnquiriesV2 {...minimalProps} />);
    expect(screen.getByTestId('container')).toBeInTheDocument();
  });

  it('shows loading component when status is loading', () => {
    const loadingProps = {
      ...mockProps,
      enquiries: {
        ...mockProps.enquiries,
        status: true,
      },
    };

    render(<EnquiriesV2 {...loadingProps} />);
    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('shows no view component when there are no enquiries and user is token user', () => {
    // Mock subscription helper for this specific test
    const Subscription = require('v2/helpers/user/subscription');
    const subscriptionInstance = new Subscription();
    subscriptionInstance.isTokenUser.mockReturnValue(true);
    subscriptionInstance.isActivatedSupplyChain.mockReturnValue(false);

    const noEnquiriesProps = {
      ...mockProps,
      enquiries: {
        latest: [],
        current: [],
        status: false,
        documents: [],
      },
    };

    render(<EnquiriesV2 {...noEnquiriesProps} />);
    expect(screen.getByTestId('no-view')).toBeInTheDocument();
  });

  it('renders enquiries list on desktop view', () => {
    render(<EnquiriesV2 {...mockProps} />);
    
    expect(screen.getByTestId('infinite-scroll')).toBeInTheDocument();
    expect(screen.getAllByText('Project 1')[0]).toBeInTheDocument();
    expect(screen.getByText('Project 2')).toBeInTheDocument();
  });

  it('renders selected enquiry content', () => {
    render(<EnquiriesV2 {...mockProps} />);
    
    expect(screen.getByTestId('content')).toBeInTheDocument();
    expect(screen.getByTestId('progress')).toBeInTheDocument();
    expect(screen.getByTestId('project-content')).toBeInTheDocument();
  });

  it('renders accept/decline component for TENDER_RECEIVED status', () => {
    render(<EnquiriesV2 {...mockProps} />);
    
    expect(screen.getByTestId('accept-decline')).toBeInTheDocument();
    expect(screen.getByTestId('accept-btn')).toBeInTheDocument();
    expect(screen.getByTestId('decline-btn')).toBeInTheDocument();
  });

  it('renders action button for appropriate statuses', () => {
    const actionButtonProps = {
      ...mockProps,
      enquiries: {
        ...mockProps.enquiries,
        current: [
          {
            ...mockProps.enquiries.current[0],
            status: 'TENDER_ACCEPTED',
          },
        ],
      },
    };

    render(<EnquiriesV2 {...actionButtonProps} />);
    expect(screen.getByTestId('action-button')).toBeInTheDocument();
  });

  it('renders sign order component for PENDING_SIGNATURE status', () => {
    const signOrderProps = {
      ...mockProps,
      enquiries: {
        ...mockProps.enquiries,
        current: [
          {
            ...mockProps.enquiries.current[0],
            status: 'PENDING_SIGNATURE',
          },
        ],
      },
    };

    render(<EnquiriesV2 {...signOrderProps} />);
    expect(screen.getByTestId('sign-order')).toBeInTheDocument();
  });

  it('renders BOQ link for appropriate enquiries', () => {
    const boqProps = {
      ...mockProps,
      enquiries: {
        ...mockProps.enquiries,
        current: [
          {
            ...mockProps.enquiries.current[0],
            status: 'QUOTE_SENT',
            document: {
              enquiry: {
                has_boq: true,
              },
            },
          },
        ],
      },
    };

    render(<EnquiriesV2 {...boqProps} />);
    expect(screen.getByTestId('format-list-icon')).toBeInTheDocument();
    expect(screen.getByText('Access Digital Price Breakdown')).toBeInTheDocument();
  });

  it('renders document history component', () => {
    render(<EnquiriesV2 {...mockProps} />);
    expect(screen.getByTestId('document-history')).toBeInTheDocument();
  });

  it('renders collapse enquiries for mobile view', () => {
    render(<EnquiriesV2 {...mockProps} />);
    expect(screen.getByTestId('collapse-enquiries')).toBeInTheDocument();
  });

  it('handles empty enquiries list', () => {
    const emptyProps = {
      ...mockProps,
      enquiries: {
        latest: [],
        current: [],
        status: false,
        documents: [],
      },
    };

    render(<EnquiriesV2 {...emptyProps} />);
    expect(screen.getByTestId('no-view')).toBeInTheDocument();
  });

  it('handles enquiries without documents', () => {
    const noDocProps = {
      ...mockProps,
      enquiries: {
        ...mockProps.enquiries,
        current: [
          {
            ...mockProps.enquiries.current[0],
            document: null,
          },
        ],
      },
    };

    render(<EnquiriesV2 {...noDocProps} />);
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  it('handles subcontractor without subscription', () => {
    const noSubProps = {
      ...mockProps,
      subcontractor: {
        id: 1,
      },
    };

    render(<EnquiriesV2 {...noSubProps} />);
    expect(screen.getByTestId('container')).toBeInTheDocument();
  });

  it('renders correctly with minimal enquiry data', () => {
    const minimalProps = {
      ...mockProps,
      enquiries: {
        ...mockProps.enquiries,
        current: [
          {
            id: 1,
            project: 'Minimal Project',
            package: 'Minimal Package',
            author_id: 'author1',
            group_id: 1,
            project_id: 1,
          },
        ],
      },
    };

    render(<EnquiriesV2 {...minimalProps} />);
    expect(screen.getAllByText('Minimal Project')[0]).toBeInTheDocument();
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });
});