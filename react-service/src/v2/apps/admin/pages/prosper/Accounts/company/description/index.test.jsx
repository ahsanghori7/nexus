import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useTranslation } from 'react-i18next';
import CompanyDescription from './index';

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
}));

jest.mock('./styled', () => ({
  StyledDescriptionItem: ({ children, ...props }) => (
    <div data-testid="styled-description-item" {...props}>
      {children}
    </div>
  ),
  StyledDescriptionItemContent: ({ children, ...props }) => (
    <div data-testid="styled-description-item-content" {...props}>
      {children}
    </div>
  ),
}));

// Mock the useTranslation hook
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

// Mock clink-components
jest.mock('clink-components', () => ({
  Button: ({ children, ...props }) => {
    // Filter out invalid DOM props
    const { color, layout, ...domProps } = props;
    return <button {...domProps}>{children}</button>;
  },
  Panel: ({ children, headerContent, ...props }) => {
    // Filter out invalid DOM props
    const { className, ...domProps } = props;
    return (
      <div {...domProps} className={className}>
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
      getValues: () => ({ description: 'Test description' }),
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
  InputForm: ({ label, name, register, errors, rules, defaultValue, ...props }) => {
    // Filter out invalid DOM props
    const { autoComplete, type, placeholder } = props;
    return (
      <div>
        <label htmlFor={name}>{label}</label>
        <input
          id={name}
          name={name}
          autoComplete={autoComplete}
          type={type}
          placeholder={placeholder}
          defaultValue={defaultValue || ''}
          readOnly
        />
      </div>
    );
  },
  InputFormControlled: ({ label, name, value, ...props }) => {
    // Filter out invalid DOM props
    const { autoComplete } = props;
    return (
      <div>
        <label htmlFor={name}>{label}</label>
        <textarea
          id={name}
          name={name}
          autoComplete={autoComplete}
          defaultValue={value || ''}
          readOnly
        />
      </div>
    );
  },
}));

// Mock MUI components
jest.mock('@mui/material/CircularProgress', () => {
  return function CircularProgress(props) {
    return <div data-testid="circular-progress" {...props} />;
  };
});

describe('CompanyDescription', () => {
  const defaultProps = {
    data: {
      strapline: 'Test strapline',
      description: 'Test description',
    },
    handleUpdate: jest.fn(),
    loading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing', () => {
    render(<CompanyDescription {...defaultProps} />);
    
    // Check for header specifically
    expect(screen.getByRole('heading', { name: 'profile-company-description' })).toBeInTheDocument();
  });

  it('should display the form inputs', () => {
    render(<CompanyDescription {...defaultProps} />);
    
    expect(screen.getByLabelText('profile-company-strapline')).toBeInTheDocument();
    expect(screen.getByLabelText('profile-company-description')).toBeInTheDocument();
  });

  it('should render submit button', () => {
    render(<CompanyDescription {...defaultProps} />);
    
    const submitButton = screen.getByRole('button', { name: 'save' });
    expect(submitButton).toBeInTheDocument();
  });

  it('should show loading spinner when loading is true', () => {
    const loadingProps = {
      ...defaultProps,
      loading: true,
    };
    
    render(<CompanyDescription {...loadingProps} />);
    
    expect(screen.getByTestId('circular-progress')).toBeInTheDocument();
  });

  it('should not show loading spinner when loading is false', () => {
    render(<CompanyDescription {...defaultProps} />);
    
    expect(screen.queryByTestId('circular-progress')).not.toBeInTheDocument();
  });

  it('should call handleUpdate when form is submitted', () => {
    render(<CompanyDescription {...defaultProps} />);
    
    const form = screen.getByRole('form');
    fireEvent.submit(form);
    
    expect(defaultProps.handleUpdate).toHaveBeenCalled();
  });

  it('should render with empty data', () => {
    const emptyDataProps = {
      ...defaultProps,
      data: {},
    };
    
    render(<CompanyDescription {...emptyDataProps} />);
    
    expect(screen.getByRole('heading', { name: 'profile-company-description' })).toBeInTheDocument();
  });

  it('should handle missing strapline gracefully', () => {
    const noStraplineProps = {
      ...defaultProps,
      data: {
        description: 'Test description',
      },
    };
    
    render(<CompanyDescription {...noStraplineProps} />);
    
    expect(screen.getByLabelText('profile-company-strapline')).toBeInTheDocument();
  });
});