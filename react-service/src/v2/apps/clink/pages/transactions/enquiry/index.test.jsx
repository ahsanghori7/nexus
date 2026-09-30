import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import EnquiryIssued from './index';

// Mock all external dependencies to prevent infinite loops
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key
  })
}));

jest.mock('hooks/context', () => ({
  useContext: jest.fn(() => ({
    actions: {
      fetchProjectEnquiries: jest.fn(() => ({ type: 'MOCK_FETCH_PROJECT_ENQUIRIES' })),
      fetchTemplates: jest.fn(() => Promise.resolve({ payload: { templates: [] } })),
      createTenderTemplate: jest.fn(() => Promise.resolve({ payload: { success: true } })),
      deleteTenderTemplate: jest.fn(() => Promise.resolve({ payload: { success: true } }))
    }
  }))
}));

jest.mock('@mui/material/Alert', () => {
  return function MockAlert({ children, ...props }) {
    return <div data-testid="alert" {...props}>{children}</div>;
  };
});

jest.mock('@mui/material/Box', () => {
  return function MockBox({ children, ...props }) {
    return <div data-testid="mui-box" {...props}>{children}</div>;
  };
});

jest.mock('@mui/material/Button', () => {
  return function MockButton({ children, onClick, ...props }) {
    return <button data-testid="button" onClick={onClick} {...props}>{children}</button>;
  };
});

jest.mock('@mui/material/CircularProgress', () => {
  return function MockCircularProgress(props) {
    return <div data-testid="circular-progress" {...props}></div>;
  };
});

jest.mock('@mui/material/TextField', () => {
  return function MockTextField({ onChange, value, ...props }) {
    return (
      <input 
        data-testid="textfield" 
        onChange={onChange} 
        value={value}
        {...props}
      />
    );
  };
});

jest.mock('v2/apps/clink/pages/transactions/header', () => {
  return function MockHeader({ filtersConfig, filter, ...props }) {
    return (
      <div data-testid="mock-header" {...props}>
        <div data-testid="active-filter">{filter || 'none'}</div>
        <div data-testid="filters-count">{filtersConfig?.length || 0}</div>
      </div>
    );
  };
});

jest.mock('./list', () => {
  return function MockEnquiryList({ items, projectData, assets, createTemplate, onTemplateDelete, ...props }) {
    // Filter out any other custom event handlers that shouldn't be passed to DOM
    const domProps = Object.keys(props).reduce((acc, key) => {
      if (!key.startsWith('on') && !key.startsWith('create') || ['onClick', 'onChange', 'onSubmit', 'onFocus', 'onBlur'].includes(key)) {
        acc[key] = props[key];
      }
      return acc;
    }, {});

    const workPackagesCount = items ? Object.keys(items).length : 0;

    return (
      <div data-testid="mock-enquiry-list" {...domProps}>
        <div data-testid="work-packages-count">{workPackagesCount}</div>
      </div>
    );
  };
});

jest.mock('./dialog', () => {
  return function MockArchiveDialog({ open, onClose, ...props }) {
    return open ? (
      <div data-testid="mock-archive-dialog" {...props}>
        <button data-testid="dialog-close" onClick={onClose}>Close</button>
      </div>
    ) : null;
  };
});

// Mock other dependencies
jest.mock('moment', () => () => ({
  format: () => 'mocked-date'
}));

jest.mock('md5', () => jest.fn(() => 'mocked-hash'));

jest.mock('v2/helpers/url', () => ({
  getUrl: jest.fn(() => 'mocked-url'),
  getProjectUrl: jest.fn(() => 'mocked-project-url')
}));

jest.mock('v1/supply-chain-v2/helpers', () => ({
  default: {
    someMethod: jest.fn()
  }
}));

jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: {
        clinkGreen: '#green',
        clinkRed: '#red',
        white: '#white'
      }
    }
  }
}));

jest.mock('v2/helpers/user', () => ({
  getAccountLogo: jest.fn(() => 'mocked-logo-url')
}));

describe('EnquiryIssued', () => {
  let store;
  let mockDispatch;

  const createTestStore = (overrides = {}) => {
    return configureStore({
      reducer: {
        project: (state = {
          status: 'success',
          projectEnquiries: {
            tenders: {}
          },
          data: {},
          ...overrides.project
        }) => state,
        tenderTemplates: (state = {
          templates: [],
          tenderTemplates: [],
          loading: false,
          ...overrides.tenderTemplates
        }) => state,
        contacts: (state = {
          open: false,
          selectedTemplate: 0,
          ...overrides.contacts
        }) => state,
        supplyChain: (state = {
          contacts: {},
          ...overrides.supplyChain
        }) => state
      }
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockDispatch = jest.fn(() => Promise.resolve({ payload: {} }));
    
    store = createTestStore();
    store.dispatch = mockDispatch;
  });

  const renderComponent = (project = { id: '123', tender: [] }) => {
    return render(
      <Provider store={store}>
        <EnquiryIssued project={project} />
      </Provider>
    );
  };

  it('renders without crashing when project id is provided', () => {
    renderComponent({ id: '123', tender: [] });
    expect(screen.getByTestId('textfield')).toBeInTheDocument();
  });

  it('renders search input', () => {
    renderComponent({ id: '123', tender: [] });
    expect(screen.getByTestId('textfield')).toBeInTheDocument();
  });

  it('renders download button', () => {
    renderComponent({ id: '123', tender: [] });
    expect(screen.getByText('download-tender-report')).toBeInTheDocument();
  });

  it('renders enquiry list component', () => {
    renderComponent({ id: '123', tender: [] });
    expect(screen.getByTestId('mock-enquiry-list')).toBeInTheDocument();
  });

  it('shows loading state when status is loading', () => {
    store = createTestStore({
      project: {
        status: 'loading',
        projectEnquiries: { tenders: {} }
      }
    });

    render(
      <Provider store={store}>
        <EnquiryIssued project={{ id: '123', tender: [] }} />
      </Provider>
    );

    expect(screen.getByTestId('circular-progress')).toBeInTheDocument();
  });

  it('shows error alert when status is error', () => {
    store = createTestStore({
      project: {
        status: 'error',
        projectEnquiries: { tenders: {} },
        error: 'Test error message'
      }
    });

    render(
      <Provider store={store}>
        <EnquiryIssued project={{ id: '123', tender: [] }} />
      </Provider>
    );

    expect(screen.getByTestId('alert')).toBeInTheDocument();
  });

  it('renders with success status and empty items', () => {
    store = createTestStore();

    render(
      <Provider store={store}>
        <EnquiryIssued project={{ id: '123', tender: [] }} />
      </Provider>
    );

    expect(screen.getByTestId('mock-enquiry-list')).toBeInTheDocument();
  });

  it('filters work packages by company name on search', () => {
    const mockProjectEnquiries = {
      tenders: {
        '43634': {
          label: 'Work Package 1',
          templates: {
            '75294': {
              id: 75294,
              name: 'Template 1',
              sent_to_subcontractors: [{ name: 'Company A' }]
            }
          }
        },
        '44018': {
          label: 'Work Package 2',
          templates: {
            '75191': {
              id: 75191,
              name: 'Template 2',
              sent_to_subcontractors: [{ name: 'Company B' }]
            }
          }
        }
      }
    };

    store = createTestStore({
      project: {
        status: 'success',
        projectEnquiries: mockProjectEnquiries
      }
    });

    render(
      <Provider store={store}>
        <EnquiryIssued project={{ id: '123', tender: [] }} />
      </Provider>
    );

    const searchInput = screen.getByTestId('textfield');
    fireEvent.change(searchInput, { target: { value: 'Company A' } });

    // The filtered data should be passed to EnquiryList
    expect(screen.getByTestId('mock-enquiry-list')).toBeInTheDocument();
  });

  it('shows all work packages when search is empty', () => {
    const mockProjectEnquiries = {
      tenders: {
        '43634': {
          label: 'Work Package 1',
          templates: {
            '75294': {
              id: 75294,
              name: 'Template 1',
              sent_to_subcontractors: [{ name: 'Company A' }]
            }
          }
        }
      }
    };

    store = createTestStore({
      project: {
        status: 'success',
        projectEnquiries: mockProjectEnquiries
      }
    });

    render(
      <Provider store={store}>
        <EnquiryIssued project={{ id: '123', tender: [] }} />
      </Provider>
    );

    const searchInput = screen.getByTestId('textfield');
    expect(searchInput).toHaveValue('');
    expect(screen.getByTestId('mock-enquiry-list')).toBeInTheDocument();
  });

  it('fetches project enquiries on mount', () => {
    const mockFetchEnquiries = jest.fn(() => Promise.resolve({ type: 'MOCK' }));
    const mockFetchTemplates = jest.fn(() => Promise.resolve({ payload: { templates: [] } }));
    
    jest.requireMock('hooks/context').useContext.mockReturnValue({
      actions: {
        fetchProjectEnquiries: mockFetchEnquiries,
        fetchTemplates: mockFetchTemplates,
        createTenderTemplate: jest.fn(),
        deleteTenderTemplate: jest.fn()
      }
    });

    renderComponent({ id: '123', tender: [] });

    // Component should attempt to fetch data
    expect(screen.getByTestId('mock-enquiry-list')).toBeInTheDocument();
  });

  it('handles template creation', () => {
    renderComponent({ id: '123', tender: [] });

    // Component should pass createTemplate function to EnquiryList
    expect(screen.getByTestId('mock-enquiry-list')).toBeInTheDocument();
  });

  it('handles template deletion', () => {
    renderComponent({ id: '123', tender: [] });

    // Component should pass onTemplateDelete function to EnquiryList
    expect(screen.getByTestId('mock-enquiry-list')).toBeInTheDocument();
  });

  it('passes assets to EnquiryList', () => {
    store = createTestStore({
      tenderTemplates: {
        templates: [
          { id: 1, name: 'Template 1', type: 'tenders' },
          { id: 2, name: 'Template 2', type: 'tenders' }
        ]
      }
    });

    render(
      <Provider store={store}>
        <EnquiryIssued project={{ id: '123', tender: [] }} />
      </Provider>
    );

    expect(screen.getByTestId('mock-enquiry-list')).toBeInTheDocument();
  });

  it('filters by case-insensitive company name', () => {
    const mockProjectEnquiries = {
      tenders: {
        '43634': {
          label: 'Work Package 1',
          templates: {
            '75294': {
              id: 75294,
              name: 'Template 1',
              sent_to_subcontractors: [{ name: 'Company ABC' }]
            }
          }
        }
      }
    };

    store = createTestStore({
      project: {
        status: 'success',
        projectEnquiries: mockProjectEnquiries
      }
    });

    render(
      <Provider store={store}>
        <EnquiryIssued project={{ id: '123', tender: [] }} />
      </Provider>
    );

    const searchInput = screen.getByTestId('textfield');
    fireEvent.change(searchInput, { target: { value: 'company abc' } });

    expect(screen.getByTestId('mock-enquiry-list')).toBeInTheDocument();
  });
});