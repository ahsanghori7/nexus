import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import CompanyProfile from './index';

// Mock the useContext hook
jest.mock('hooks/context', () => ({
  useContext: (contextType) => ({
    actions: {
      fetchCompany: jest.fn().mockReturnValue(Promise.resolve()),
      updateProfile: jest.fn().mockReturnValue(Promise.resolve()),
      updateOffering: jest.fn().mockReturnValue(Promise.resolve()),
      updateSubcontractorDescription: jest.fn().mockReturnValue(Promise.resolve()),
      selectOption: jest.fn(),
    },
  }),
}));

// Mock the child components
jest.mock('v2/apps/shared/components/Loading', () => {
  return function Loading({ status }) {
    return status ? <div data-testid="loading">Loading: {status}</div> : null;
  };
});

jest.mock('./user-description', () => {
  return function UserDetails(props) {
    return <div data-testid="user-details">User Details</div>;
  };
});

jest.mock('./details', () => {
  return function CompanyDetails(props) {
    return <div data-testid="company-details">Company Details</div>;
  };
});

jest.mock('./description', () => {
  return function CompanyDescription(props) {
    return <div data-testid="company-description">Company Description</div>;
  };
});

jest.mock('./offering', () => {
  return function CompanyOffering(props) {
    return <div data-testid="company-offering">Company Offering</div>;
  };
});

// Mock the styled components
jest.mock('./Theme.styled', () => ({
  StyledPegasusContainer: ({ children, className, ...props }) => (
    <div data-testid="styled-pegasus-container" className={className} {...props}>
      {children}
    </div>
  ),
  StyledProsperContainer: ({ children, className, ...props }) => (
    <div data-testid="styled-prosper-container" className={className} {...props}>
      {children}
    </div>
  ),
  StyledFull: ({ children, ...props }) => (
    <div data-testid="styled-full" {...props}>
      {children}
    </div>
  ),
  StyledFullProsper: ({ children, className, ...props }) => (
    <div data-testid="styled-full-prosper" className={className} {...props}>
      {children}
    </div>
  ),
  StyledPegasusColumn: ({ children, className, ...props }) => (
    <div data-testid="styled-pegasus-column" className={className} {...props}>
      {children}
    </div>
  ),
  StyledProsperColumn: ({ children, className, ...props }) => (
    <div data-testid="styled-prosper-column" className={className} {...props}>
      {children}
    </div>
  ),
}));

// Create a mock Redux store
const mockStore = (initialState) => {
  const reducer = (state = initialState, action) => {
    switch (action.type) {
      default:
        return state;
    }
  };
  return createStore(reducer);
};

describe('CompanyProfile', () => {
  const defaultState = {
    company: {
      details: { name: 'Test Company' },
      offering: { services: [] },
      description: { text: 'Test description' },
      status: { message: '' },
      statusActions: { message: '' },
    },
    subcontractor: { name: 'Test Subcontractor' },
  };

  const defaultProps = {
    id: '123',
    contextType: 'adminProsper',
    dispatch: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderWithRedux = (component, state = defaultState) => {
    const store = mockStore(state);
    return render(
      <Provider store={store}>{component}</Provider>
    );
  };

  it('should render without crashing for adminProsper context', () => {
    renderWithRedux(<CompanyProfile {...defaultProps} />);
    
    expect(screen.getByTestId('styled-pegasus-container')).toBeInTheDocument();
    expect(screen.getByTestId('company-details')).toBeInTheDocument();
    expect(screen.getByTestId('company-offering')).toBeInTheDocument();
    expect(screen.getByTestId('company-description')).toBeInTheDocument();
  });

  it('should render without crashing for prosper context', () => {
    const prosperProps = {
      ...defaultProps,
      contextType: 'prosper',
    };
    
    renderWithRedux(<CompanyProfile {...prosperProps} />);
    
    expect(screen.getByTestId('styled-prosper-container')).toBeInTheDocument();
    expect(screen.getByTestId('user-details')).toBeInTheDocument();
    expect(screen.getByTestId('company-details')).toBeInTheDocument();
    expect(screen.getByTestId('company-description')).toBeInTheDocument();
    expect(screen.getByTestId('company-offering')).toBeInTheDocument();
  });

  it('should show loading components when status messages exist', () => {
    const loadingState = {
      ...defaultState,
      company: {
        ...defaultState.company,
        status: { message: 'Loading company...' },
        statusActions: { message: 'Processing action...' },
      },
    };
    
    renderWithRedux(<CompanyProfile {...defaultProps} />, loadingState);
    
    expect(screen.getByText('Loading: Loading company...')).toBeInTheDocument();
    expect(screen.getByText('Loading: Processing action...')).toBeInTheDocument();
  });

  it('should not render content when status message exists', () => {
    const statusState = {
      ...defaultState,
      company: {
        ...defaultState.company,
        status: { message: 'Error loading company' },
      },
    };
    
    renderWithRedux(<CompanyProfile {...defaultProps} />, statusState);
    
    expect(screen.queryByTestId('styled-pegasus-container')).not.toBeInTheDocument();
    expect(screen.queryByTestId('company-details')).not.toBeInTheDocument();
  });

  it('should not render content for unknown context type', () => {
    const unknownContextProps = {
      ...defaultProps,
      contextType: 'unknown',
    };
    
    renderWithRedux(<CompanyProfile {...unknownContextProps} />);
    
    expect(screen.queryByTestId('styled-pegasus-container')).not.toBeInTheDocument();
    expect(screen.queryByTestId('styled-prosper-container')).not.toBeInTheDocument();
  });

  it('should render loading components even when no status messages', () => {
    renderWithRedux(<CompanyProfile {...defaultProps} />);
    
    // Loading components should be rendered but not visible when no status
    expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
  });

  it('should handle missing id gracefully', () => {
    const noIdProps = {
      ...defaultProps,
      id: null,
    };
    
    renderWithRedux(<CompanyProfile {...noIdProps} />);
    
    expect(screen.getByTestId('styled-pegasus-container')).toBeInTheDocument();
  });

  it('should render correct CSS classes for adminProsper context', () => {
    renderWithRedux(<CompanyProfile {...defaultProps} />);
    
    const container = screen.getByTestId('styled-pegasus-container');
    expect(container).toHaveClass('pegasus-company-profile');
    
    const columns = screen.getAllByTestId('styled-pegasus-column');
    columns.forEach(column => {
      expect(column).toHaveClass('pegasus-company-profile__column');
    });
  });

  it('should render correct CSS classes for prosper context', () => {
    const prosperProps = {
      ...defaultProps,
      contextType: 'prosper',
    };
    
    renderWithRedux(<CompanyProfile {...prosperProps} />);
    
    const container = screen.getByTestId('styled-prosper-container');
    expect(container).toHaveClass('prosper-company-profile');
    
    const columns = screen.getAllByTestId('styled-prosper-column');
    columns.forEach(column => {
      expect(column).toHaveClass('prosper-company-profile__column');
    });
    
    const fullProsper = screen.getByTestId('styled-full-prosper');
    expect(fullProsper).toHaveClass('prosper-company-profile__full');
  });
});