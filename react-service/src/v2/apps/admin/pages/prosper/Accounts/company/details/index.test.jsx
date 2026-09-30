import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CompanyDetails from './index';

// Mock the useTranslation hook
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

// Mock the styled components
jest.mock('../Theme.styled', () => ({
  StyledWithMarginAndLoader: ({ children, ...props }) => (
    <div data-testid="styled-with-margin-and-loader" {...props}>
      {children}
    </div>
  ),
  StyledWrapper: ({ children, ...props }) => (
    <div data-testid="styled-wrapper" {...props}>
      {children}
    </div>
  ),
}));

// Mock the theme components
jest.mock('./themes/prosper', () => {
  return function ProsperCompanyPage(props) {
    return <div data-testid="prosper-company-page">Prosper Company Page</div>;
  };
});

jest.mock('./themes/admin', () => {
  return function AdminCompanyPage(props) {
    return <div data-testid="admin-company-page">Admin Company Page</div>;
  };
});

// Mock clink-components
jest.mock('clink-components', () => ({
  Button: ({ children, ...props }) => {
    // Filter out invalid DOM props
    const { color, layout, ...domProps } = props;
    return <button {...domProps}>{children}</button>;
  },
  Panel: ({ children, headerContent, ...props }) => {
    return (
      <div {...props}>
        {headerContent}
        {children}
      </div>
    );
  },
  Form: ({ children, render, onSubmit, defaultValues, ...props }) => {
    const mockFormHook = {
      formState: {
        errors: {},
        isDirty: false,
        isValid: false,
      },
      register: jest.fn(),
      setValue: jest.fn(),
      trigger: jest.fn(),
      control: {},
      getValues: () => ({}),
    };
    
    return (
      <form
        {...props}
        role="form"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit && onSubmit();
        }}
      >
        {render(mockFormHook)}
      </form>
    );
  },
}));

// Mock MUI components
jest.mock('@mui/material/CircularProgress', () => {
  return function CircularProgress(props) {
    return <div data-testid="circular-progress" {...props} />;
  };
});

describe('CompanyDetails', () => {
  const defaultProps = {
    data: {
      registered_address: '123 Main St',
      operating_company_address: '123 Main St',
    },
    contextType: 'prosper',
    handleUpdate: jest.fn(),
    loading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing', () => {
    render(<CompanyDetails {...defaultProps} />);
    
    expect(screen.getByRole('heading', { name: 'profile-company-details' })).toBeInTheDocument();
  });

  it('should render prosper theme when contextType is prosper', () => {
    render(<CompanyDetails {...defaultProps} />);
    
    expect(screen.getByTestId('prosper-company-page')).toBeInTheDocument();
    expect(screen.queryByTestId('admin-company-page')).not.toBeInTheDocument();
  });

  it('should render admin theme when contextType is adminProsper', () => {
    const adminProps = {
      ...defaultProps,
      contextType: 'adminProsper',
    };
    
    render(<CompanyDetails {...adminProps} />);
    
    expect(screen.getByTestId('admin-company-page')).toBeInTheDocument();
    expect(screen.queryByTestId('prosper-company-page')).not.toBeInTheDocument();
  });

  it('should render submit button', () => {
    render(<CompanyDetails {...defaultProps} />);
    
    const submitButton = screen.getByRole('button', { name: 'save' });
    expect(submitButton).toBeInTheDocument();
  });

  it('should show loading spinner when loading is true', () => {
    const loadingProps = {
      ...defaultProps,
      loading: true,
    };
    
    render(<CompanyDetails {...loadingProps} />);
    
    expect(screen.getByTestId('circular-progress')).toBeInTheDocument();
  });

  it('should not show loading spinner when loading is false', () => {
    render(<CompanyDetails {...defaultProps} />);
    
    expect(screen.queryByTestId('circular-progress')).not.toBeInTheDocument();
  });

  it('should call handleUpdate when form is submitted', () => {
    render(<CompanyDetails {...defaultProps} />);
    
    const form = screen.getByRole('form');
    fireEvent.submit(form);
    
    expect(defaultProps.handleUpdate).toHaveBeenCalled();
  });

  it('should handle data with different addresses', () => {
    const differentAddressProps = {
      ...defaultProps,
      data: {
        registered_address: '123 Main St',
        operating_company_address: '456 Oak Ave',
      },
    };
    
    render(<CompanyDetails {...differentAddressProps} />);
    
    expect(screen.getByRole('heading', { name: 'profile-company-details' })).toBeInTheDocument();
  });

  it('should handle empty operating address', () => {
    const emptyOperatingAddressProps = {
      ...defaultProps,
      data: {
        registered_address: '123 Main St',
        operating_company_address: '',
      },
    };
    
    render(<CompanyDetails {...emptyOperatingAddressProps} />);
    
    expect(screen.getByRole('heading', { name: 'profile-company-details' })).toBeInTheDocument();
  });

  it('should render neither theme for unknown contextType', () => {
    const unknownContextProps = {
      ...defaultProps,
      contextType: 'unknown',
    };
    
    render(<CompanyDetails {...unknownContextProps} />);
    
    expect(screen.queryByTestId('prosper-company-page')).not.toBeInTheDocument();
    expect(screen.queryByTestId('admin-company-page')).not.toBeInTheDocument();
  });
});