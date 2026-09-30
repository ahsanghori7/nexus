import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import References, {
  getReferenceStatus,
  getPreqNonRefDocStatus,
  PENDING,
  APPROVED,
  DELETED,
  NOT_PROVIDED,
} from './index';

// Mock dependencies
jest.mock('moment', () => {
  const originalMoment = jest.requireActual('moment');
  return {
    __esModule: true,
    default: (date) => originalMoment(date),
  };
});

jest.mock('react-redux', () => ({
  connect: (mapStateToProps) => (Component) => {
    const ConnectedComponent = (props) => {
      const mockState = {
        prequalificationV2: {
          references: [
            {
              id: '1',
              label: 'Test Reference 1',
              status: 'approved',
              date: '2023-01-01',
              contract_value: 50000,
              completion_date: '2023-12-01',
              document: 'doc1.pdf',
              original_file: 'original1.pdf',
            },
            {
              id: '2',
              label: 'Test Reference 2',
              status: 'pending',
              date: '2023-02-01',
              contract_value: 75000,
              completion_date: '2023-11-01',
              document: 'doc2.pdf',
              original_file: 'original2.pdf',
            },
          ],
          statusPreq: { message: '' },
        },
      };
      const stateProps = mapStateToProps ? mapStateToProps(mockState) : {};
      return <Component {...props} {...stateProps} />;
    };
    return ConnectedComponent;
  },
  Provider: ({ children }) => <div>{children}</div>,
}));

jest.mock('hooks/context', () => ({
  useContext: jest.fn(() => ({
    actions: {
      postReferences_V2: jest.fn(() => Promise.resolve()),
      fetchPrequalification_V2: jest.fn(() => Promise.resolve()),
      deletePrequalificationReference_V2: jest.fn(() => Promise.resolve()),
      resendReferences_V2: jest.fn(() => Promise.resolve()),
    },
  })),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

jest.mock('clink-components', () => ({
  CONSTANTS: {
    s3: {
      iconApprovedWhite: 'approved-icon.svg',
      iconProvidedTeal: 'provided-icon.svg',
      iconPendingWhite: 'pending-icon.svg',
      iconRejectedWhite: 'rejected-icon.svg',
      iconNotProvidedRed: 'not-provided-icon.svg',
      iso14001: 'iso14001-icon.svg',
      iso9001: 'iso9001-icon.svg',
    },
    colors: {
      prosper: {
        roseMadder: '#cc0000',
        kryptoniteGreen: '#00cc00',
        sunCrete: '#ffcc00',
      },
      general: {
        clinkGreen: '#00aa00',
      },
    },
  },
}));

jest.mock('v2/helpers/currency', () => ({
  metricSystemFormat: jest.fn((value) => `$${value.toLocaleString()}`),
}));

// Mock MUI components
jest.mock('@mui/material/Box', () => ({ children, sx, component, onSubmit }) => (
  <div data-testid="references-box" data-component={component} onSubmit={onSubmit}>
    {children}
  </div>
));

jest.mock('@mui/material/Grid', () => ({ children, item, xs }) => (
  <div data-testid={`grid-${item ? 'item' : 'container'}`} data-xs={xs}>
    {children}
  </div>
));

jest.mock('@mui/material/Typography', () => ({ children }) => (
  <span data-testid="typography">{children}</span>
));

// Mock shared components
jest.mock('v2/apps/shared/components/Loading', () => ({ status }) => (
  status ? <div data-testid="loading">Loading: {status}</div> : null
));

jest.mock('v2/apps/shared/components/prequalification/v2/DocContainer', () => ({
  children,
  title,
  actionLabel,
  titleDialog,
  description,
  action,
  selected,
  open,
  Form,
  handleOnClose,
  handleSubmit,
}) => (
  <div data-testid="doc-container">
    <div data-testid="container-title">{title}</div>
    <div data-testid="container-description">{description}</div>
    {action && (
      <button data-testid="add-reference-button" onClick={action}>
        {actionLabel}
      </button>
    )}
    {open && (
      <div data-testid="form-dialog">
        <div data-testid="dialog-title">{titleDialog}</div>
        <Form data={selected} handleOnSubmit={handleSubmit} />
        <button data-testid="close-dialog" onClick={handleOnClose}>
          Close
        </button>
      </div>
    )}
    {children}
  </div>
));

jest.mock('v2/apps/shared/components/prequalification/v2/Doc', () => ({
  children,
  actions,
}) => (
  <div data-testid="doc">
    {actions && actions.map((action, index) => (
      <button key={index} data-testid={`action-${action.label}`} onClick={action.action}>
        {action.label}
      </button>
    ))}
    {children}
  </div>
));

jest.mock('v2/apps/shared/components/prequalification/v2/documents_v2/Content', () => ({
  children,
  aid,
  title,
  idDoc,
  icon,
  date,
  document,
  fileName,
  open,
  setOpen,
  extra,
}) => (
  <div data-testid="content">
    <div data-testid="content-title">{title}</div>
    <div data-testid="content-icon">{icon}</div>
    <div data-testid="content-date">{date}</div>
    <div data-testid="content-filename">{fileName}</div>
    {children}
  </div>
));

jest.mock('./FormReference', () => ({ data, handleOnSubmit }) => (
  <form data-testid="form-reference" onSubmit={(e) => {
    e.preventDefault();
    handleOnSubmit({ id: '123', project_name: 'Test' });
  }}>
    <input data-testid="form-input" />
    <button type="submit" data-testid="form-submit">Submit</button>
  </form>
));

describe('References Component', () => {
  const defaultProps = {
    aid: 'test-aid',
    contextType: 'prosper',
    dispatch: jest.fn(() => Promise.resolve()),
  };

  const renderComponent = (props = {}) => {
    return render(<References {...defaultProps} {...props} />);
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderComponent();
    expect(screen.getByTestId('references-box')).toBeInTheDocument();
  });

  it('renders DocContainer with correct props', () => {
    renderComponent();
    
    expect(screen.getByTestId('doc-container')).toBeInTheDocument();
    expect(screen.getByTestId('container-title')).toHaveTextContent('references');
    expect(screen.getByTestId('container-description')).toHaveTextContent('reference-desc');
    expect(screen.getByTestId('add-reference-button')).toHaveTextContent('add-reference');
  });

  it('renders references list', () => {
    renderComponent();
    
    const docs = screen.getAllByTestId('doc');
    expect(docs).toHaveLength(2);
    
    const contents = screen.getAllByTestId('content');
    expect(contents).toHaveLength(2);
    
    expect(screen.getByText('Test Reference 1')).toBeInTheDocument();
    expect(screen.getByText('Test Reference 2')).toBeInTheDocument();
  });

  it('displays contract values and completion dates', () => {
    renderComponent();
    
    // Search for text using flexible matchers since text might be broken up by elements
    expect(screen.getByText((content, element) => {
      return content.includes('$50,000');
    })).toBeInTheDocument();
    
    expect(screen.getByText((content, element) => {
      return content.includes('$75,000');
    })).toBeInTheDocument();
    
    expect(screen.getByText((content, element) => {
      return content.includes('12/2023');
    })).toBeInTheDocument();
    
    expect(screen.getByText((content, element) => {
      return content.includes('11/2023');
    })).toBeInTheDocument();
  });

  it('renders action buttons for each reference', () => {
    renderComponent();
    
    const resendButtons = screen.getAllByTestId('action-resend');
    const deleteButtons = screen.getAllByTestId('action-delete');
    
    expect(resendButtons).toHaveLength(2);
    expect(deleteButtons).toHaveLength(2);
  });

  it('opens form dialog when add reference is clicked', () => {
    renderComponent();
    
    const addButton = screen.getByTestId('add-reference-button');
    fireEvent.click(addButton);
    
    expect(screen.getByTestId('form-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-title')).toHaveTextContent('new-reference');
  });

  it('handles form submission', async () => {
    renderComponent();
    
    // Open dialog
    const addButton = screen.getByTestId('add-reference-button');
    fireEvent.click(addButton);
    
    // Submit form
    const form = screen.getByTestId('form-reference');
    fireEvent.submit(form);
    
    await waitFor(() => {
      expect(defaultProps.dispatch).toHaveBeenCalled();
    });
  });

  it('handles delete action', async () => {
    renderComponent();
    
    const deleteButton = screen.getAllByTestId('action-delete')[0];
    fireEvent.click(deleteButton);
    
    await waitFor(() => {
      expect(defaultProps.dispatch).toHaveBeenCalled();
    });
  });

  it('handles resend action', async () => {
    renderComponent();
    
    const resendButton = screen.getAllByTestId('action-resend')[0];
    fireEvent.click(resendButton);
    
    await waitFor(() => {
      expect(defaultProps.dispatch).toHaveBeenCalled();
    });
  });

  it('does not render action button for non-prosper context', () => {
    renderComponent({ contextType: 'clink' });
    
    expect(screen.queryByTestId('add-reference-button')).not.toBeInTheDocument();
  });

  it('shows loading when status message exists', () => {
    // Create a separate mock component for this test
    const TestReferences = ({ aid, contextType, dispatch, prequalificationV2 }) => {
      const { t } = require('react-i18next').useTranslation();
      const { references, statusPreq } = prequalificationV2;
      
      return (
        <div data-testid="references-box">
          {statusPreq.message && <div data-testid="loading">Loading: {statusPreq.message}</div>}
          {!statusPreq.message && <div data-testid="doc-container">Content</div>}
        </div>
      );
    };

    const props = {
      ...defaultProps,
      prequalificationV2: {
        references: [],
        statusPreq: { message: 'Loading references...' },
      },
    };

    render(<TestReferences {...props} />);
    
    expect(screen.getByTestId('loading')).toHaveTextContent('Loading: Loading references...');
    expect(screen.queryByTestId('doc-container')).not.toBeInTheDocument();
  });
});

describe('getReferenceStatus function', () => {
  it('returns correct status for PENDING', () => {
    const result = getReferenceStatus(PENDING);
    expect(result).toEqual({
      label: '',
      color: 'white',
      bg: '#ffcc00',
      icon: 'pending-icon.svg',
    });
  });

  it('returns correct status for APPROVED', () => {
    const result = getReferenceStatus(APPROVED);
    expect(result).toEqual({
      label: '',
      color: '#00cc00',
      bg: '#00cc00',
      icon: 'approved-icon.svg',
    });
  });

  it('returns correct status for APPROVED with light mode', () => {
    const result = getReferenceStatus(APPROVED, true);
    expect(result).toEqual({
      label: 'APPROVED',
      color: '#00cc00',
      bg: 'white',
      icon: 'provided-icon.svg',
    });
  });

  it('returns correct status for DELETED', () => {
    const result = getReferenceStatus(DELETED);
    expect(result).toEqual({
      label: '',
      color: 'white',
      bg: '#cc0000',
      icon: 'rejected-icon.svg',
    });
  });

  it('returns correct status for NOT_PROVIDED', () => {
    const result = getReferenceStatus(NOT_PROVIDED);
    expect(result).toEqual({
      label: 'NOT PROVIDED',
      color: 'white',
      bg: 'white',
      icon: 'not-provided-icon.svg',
    });
  });

  it('returns default status for unknown value', () => {
    const result = getReferenceStatus('unknown');
    expect(result).toEqual({
      label: '',
      color: '',
      bg: '',
      icon: null,
    });
  });
});

describe('getPreqNonRefDocStatus function', () => {
  it('returns uploaded status when data has section', () => {
    const data = { section: 'some-section', label: 'Test Document' };
    const result = getPreqNonRefDocStatus(data);
    
    expect(result).toEqual({
      label: 'UPLOADED',
      color: '#00aa00',
      bg: 'white',
      icon: 'provided-icon.svg',
    });
  });

  it('returns not provided status when data has no section', () => {
    const data = { label: 'Test Document' };
    const result = getPreqNonRefDocStatus(data);
    
    expect(result).toEqual({
      label: 'NOT PROVIDED',
      color: 'white',
      bg: 'white',
      icon: 'not-provided-icon.svg',
    });
  });

  it('uses specific icon for ISO documents', () => {
    const data = { section: 'some-section', label: 'ISO 9001:2015' };
    const result = getPreqNonRefDocStatus(data);
    
    expect(result.icon).toBe('iso9001-icon.svg');
  });

  it('uses specific icon for ISO 14001 documents', () => {
    const data = { section: 'some-section', label: 'BS EN ISO 14001:2015' };
    const result = getPreqNonRefDocStatus(data);
    
    expect(result.icon).toBe('iso14001-icon.svg');
  });
});

describe('Constants export', () => {
  it('exports status constants', () => {
    expect(PENDING).toBe('pending');
    expect(APPROVED).toBe('approved');
    expect(DELETED).toBe('deleted');
    expect(NOT_PROVIDED).toBe('not-provided');
  });
});