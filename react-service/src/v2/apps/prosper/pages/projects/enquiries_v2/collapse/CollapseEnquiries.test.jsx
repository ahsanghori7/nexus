import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock all MUI components
jest.mock('@mui/material', () => {
  const React = require('react');
  
  const createMock = (tag, displayName) => {
    const Component = React.forwardRef(({ children, sx, ...props }, ref) =>
      React.createElement(tag, { ref, ...props }, children)
    );
    Component.displayName = displayName || tag;
    return Component;
  };

  return {
    __esModule: true,
    Card: createMock('div', 'Card'),
    Collapse: React.forwardRef(({ children, in: inProp, ...props }, ref) => (
      <div ref={ref} data-testid="collapse" data-in={inProp ? 'true' : 'false'} {...props}>
        {inProp ? children : null}
      </div>
    )),
    Grid: createMock('div', 'Grid'),
    List: createMock('ul', 'List'),
    ListItem: createMock('li', 'ListItem'),
    Skeleton: React.forwardRef(({ variant, width, height, ...props }, ref) => (
      <div ref={ref} data-testid="skeleton" data-variant={variant} {...props} />
    )),
  };
});

// Mock react-infinite-scroll-component
jest.mock('react-infinite-scroll-component', () => {
  const React = require('react');
  return React.forwardRef(({ children, loader, hasMore, dataLength, next, scrollableTarget, ...domProps }, ref) => (
    <div ref={ref} data-testid="infinite-scroll" data-has-more={hasMore ? 'true' : 'false'} data-length={dataLength} {...domProps}>
      {children}
      {hasMore && loader}
    </div>
  ));
});

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

// Mock status helper
jest.mock('v2/helpers/status/enquiries', () => ({
  getStatus: jest.fn((item) => ({ status: item.status || 'DEFAULT_STATUS' })),
}));

// Mock all the child components
jest.mock('v2/apps/prosper/shared/Subheader', () => {
  const React = require('react');
  return React.forwardRef(({ data, ...props }, ref) => (
    <div ref={ref} data-testid="subheader" {...props}>
      Subheader for {data?.id}
    </div>
  ));
});

jest.mock('../Header', () => {
  const React = require('react');
  return React.forwardRef(({ title, subheader, ActionCollapse, ...props }, ref) => (
    <div ref={ref} data-testid="header" {...props}>
      <div data-testid="header-title">{title}</div>
      <div data-testid="header-subheader">{subheader}</div>
      <div data-testid="header-action">{ActionCollapse}</div>
    </div>
  ));
});

jest.mock('./ExpandCollapse', () => {
  const React = require('react');
  return React.forwardRef(({ id, expanded, handleChangeExpanded, ...props }, ref) => (
    <button 
      ref={ref} 
      data-testid={`expand-collapse-${id}`}
      onClick={() => handleChangeExpanded(id)}
      {...props}
    >
      {expanded?.includes(id) ? 'Collapse' : 'Expand'}
    </button>
  ));
});

jest.mock('../Content', () => {
  const React = require('react');
  return React.forwardRef(({ data, idContact, ...props }, ref) => (
    <div ref={ref} data-testid="content" {...props}>
      Content for {data?.id}
    </div>
  ));
});

jest.mock('../Progress', () => {
  const React = require('react');
  return React.forwardRef((props, ref) => (
    <div ref={ref} data-testid="progress">
      Progress for {props.data?.id}
    </div>
  ));
});

jest.mock('../actions/ActionButtonContent', () => {
  const React = require('react');
  return React.forwardRef(({ label, data, handleAction, ...props }, ref) => (
    <button 
      ref={ref} 
      data-testid="action-button"
      onClick={() => handleAction(data)}
      {...props}
    >
      {label || 'Action'}
    </button>
  ));
});

jest.mock('../actions/AcceptDeclineEnquiry', () => {
  const React = require('react');
  return React.forwardRef(({ data, accept, decline, handleOpen, setOpenConfirm, openConfirm, handleClose, ...domProps }, ref) => (
    <div ref={ref} data-testid="accept-decline" {...domProps}>
      Accept/Decline for {data?.id}
    </div>
  ));
});

jest.mock('../actions/SignOrder', () => {
  const React = require('react');
  return React.forwardRef(({ data, ...props }, ref) => (
    <div ref={ref} data-testid="sign-order" {...props}>
      Sign Order for {data?.id}
    </div>
  ));
});

import CollapseEnquiries from './CollapseEnquiries';
import { getStatus } from 'v2/helpers/status/enquiries';

describe('CollapseEnquiries', () => {
  const mockProps = {
    list: [
      {
        id: 1,
        project: 'Test Project 1',
        package: 'Test Package 1',
        author_id: 'author1',
        status: 'TENDER_RECEIVED',
      },
      {
        id: 2,
        project: 'Test Project 2',
        package: 'Test Package 2',
        author_id: 'author2',
        status: 'PENDING_SIGNATURE',
      },
    ],
    expanded: [1],
    handleChangeExpanded: jest.fn(),
    handleAction: jest.fn(),
    handleClose: jest.fn(),
    openConfirm: false,
    accept: jest.fn(),
    decline: jest.fn(),
    handleOpen: jest.fn(),
    setOpenConfirm: jest.fn(),
    hasMore: false,
    fetchMoreData: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    getStatus.mockImplementation((item) => ({ status: item.status || 'DEFAULT_STATUS' }));
  });

  it('renders without crashing', () => {
    render(<CollapseEnquiries {...mockProps} />);
    expect(screen.getByTestId('infinite-scroll')).toBeInTheDocument();
  });

  it('renders list items for each enquiry', () => {
    render(<CollapseEnquiries {...mockProps} />);
    
    expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    expect(screen.getByText('Test Project 2')).toBeInTheDocument();
    expect(screen.getByText('Test Package 1')).toBeInTheDocument();
    expect(screen.getByText('Test Package 2')).toBeInTheDocument();
  });

  it('renders expand/collapse buttons with correct state', () => {
    render(<CollapseEnquiries {...mockProps} />);
    
    const expandButton1 = screen.getByTestId('expand-collapse-1');
    const expandButton2 = screen.getByTestId('expand-collapse-2');
    
    expect(expandButton1).toHaveTextContent('Collapse');
    expect(expandButton2).toHaveTextContent('Expand');
  });

  it('shows subheader when item is not expanded', () => {
    render(<CollapseEnquiries {...mockProps} />);
    
    // Item 2 is not expanded, so should show subheader
    expect(screen.getByText('Subheader for 2')).toBeInTheDocument();
  });

  it('shows collapsed content when item is expanded', () => {
    render(<CollapseEnquiries {...mockProps} />);
    
    const collapseElements = screen.getAllByTestId('mui-collapse');
    const expandedCollapse = collapseElements.find(el => el.textContent.includes('Content for 1'));
    
    expect(expandedCollapse).toBeInTheDocument();
    expect(screen.getByText('Content for 1')).toBeInTheDocument();
    expect(screen.getByText('Progress for 1')).toBeInTheDocument();
  });

  it('renders AcceptDeclineEnquiry for TENDER_RECEIVED status', () => {
    render(<CollapseEnquiries {...mockProps} />);
    
    expect(screen.getByText('Accept/Decline for 1')).toBeInTheDocument();
  });

  it('renders SignOrder for PENDING_SIGNATURE status', () => {
    // Need to set up props with item 2 expanded to see the sign order content
    const modifiedProps = {
      ...mockProps,
      expanded: [2], // Expand item 2 instead of item 1
    };
    
    render(<CollapseEnquiries {...modifiedProps} />);
    
    expect(screen.getByText('Sign Order for 2')).toBeInTheDocument();
  });

  it('handles infinite scroll with more data', () => {
    const propsWithMoreData = { ...mockProps, hasMore: false }; // hasMore=false makes !hasMore=true in component
    render(<CollapseEnquiries {...propsWithMoreData} />);
    
    const infiniteScroll = screen.getByTestId('infinite-scroll');
    expect(infiniteScroll).toHaveAttribute('data-has-more', 'true'); // !hasMore becomes true
    expect(screen.getByTestId('mui-skeleton')).toBeInTheDocument();
  });

  it('calls handleChangeExpanded when expand button is clicked', () => {
    render(<CollapseEnquiries {...mockProps} />);
    
    const expandButton = screen.getByTestId('expand-collapse-2');
    expandButton.click();
    
    expect(mockProps.handleChangeExpanded).toHaveBeenCalledWith(2);
  });

  it('renders with empty list', () => {
    const emptyProps = { ...mockProps, list: [] };
    render(<CollapseEnquiries {...emptyProps} />);
    
    const infiniteScroll = screen.getByTestId('infinite-scroll');
    expect(infiniteScroll).toBeInTheDocument();
    expect(infiniteScroll).toHaveAttribute('data-length', '0');
  });

  it('handles item without expanded state', () => {
    const propsWithoutExpanded = { ...mockProps, expanded: null };
    render(<CollapseEnquiries {...propsWithoutExpanded} />);
    
    // When expanded is null, no collapse content should be rendered
    // since the Collapse component only renders children when "in" prop is true
    expect(screen.queryByText('Content for 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Content for 2')).not.toBeInTheDocument();
  });

  it('renders ActionButtonContent for TENDER_ACCEPTED status', () => {
    const modifiedProps = {
      ...mockProps,
      list: [
        {
          ...mockProps.list[0],
          status: 'TENDER_ACCEPTED',
        },
      ],
    };
    
    getStatus.mockImplementation((item) => ({ status: 'TENDER_ACCEPTED' }));
    
    render(<CollapseEnquiries {...modifiedProps} />);
    
    expect(screen.getByTestId('action-button')).toBeInTheDocument();
    expect(screen.getByText('text-create-quote')).toBeInTheDocument();
  });

  it('does not render action components for excluded statuses', () => {
    const excludedStatuses = [
      'AWARDED', 'PENDING_SIGNATURE', 'ORDER_SIGNED', 'ORDER_REJECTED',
      'ORDER_RETRACTED', 'INTEREST_DECLINED', 'TENDER_DECLINED',
      'TENDER_RECEIVED', 'UNSUCCESSFUL', 'OTHER_STATUS'
    ];
    
    excludedStatuses.forEach(status => {
      getStatus.mockImplementation(() => ({ status }));
      
      const propsWithStatus = {
        ...mockProps,
        list: [{ ...mockProps.list[0], status }],
      };
      
      const { unmount } = render(<CollapseEnquiries {...propsWithStatus} />);
      
      // Should not render ActionButtonContent for these statuses
      expect(screen.queryByTestId('action-button')).not.toBeInTheDocument();
      
      unmount();
    });
  });
});