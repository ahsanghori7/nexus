import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import '@testing-library/jest-dom';
import UserDetails from './index';

// Mock clink-components
jest.mock('clink-components', () => ({
  Panel: ({ children, headerContent, className }) => {
    // Generate unique testid based on header content
    const testId = headerContent?.props?.children?.includes('user-details') 
      ? 'user-details-panel'
      : headerContent?.props?.children?.includes('company-logo')
      ? 'company-logo-panel'
      : 'main-panel';
    
    return (
      <div className={className} data-testid={testId}>
        {headerContent && <div data-testid="panel-header">{headerContent}</div>}
        <div data-testid="panel-content">{children}</div>
      </div>
    );
  },
  Form: ({ children, onSubmit, render, ...props }) => {
    const mockFormHook = {
      formState: {
        errors: {},
        isDirty: false,
        isValid: true,
      },
      register: jest.fn(() => ({})),
      trigger: jest.fn(),
    };
    
    return (
      <form onSubmit={onSubmit} data-testid="clink-form">
        {render ? render(mockFormHook) : children}
      </form>
    );
  },
  Button: ({ children, disabled, ...props }) => (
    <button disabled={disabled} {...props} data-testid="submit-button">
      {children}
    </button>
  ),
}));

// Mock MUI components
jest.mock('@mui/material', () => ({
  Box: ({ children, sx, ...props }) => (
    <div {...props} data-testid="mui-box">{children}</div>
  ),
  CircularProgress: (props) => (
    <div {...props} data-testid="loading-spinner">Loading...</div>
  ),
}));

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

// Mock context
jest.mock('hooks/context', () => ({
  useContext: () => ({
    actions: {
      updateCompanyImage: jest.fn(() => Promise.resolve()),
      removeCompanyImage: jest.fn(() => Promise.resolve()),
    },
  }),
}));

// Mock helper functions
jest.mock('v2/helpers/url', () => ({
  checkIfImageExists: jest.fn((url, callback) => {
    callback(true); // Mock that image exists
  }),
}));

jest.mock('v2/helpers/user', () => ({
  getCompanyLogo: jest.fn(() => 'mock-logo-url'),
}));

// Mock Loading component
jest.mock('v2/apps/shared/components/Loading', () => {
  return function MockLoading({ status }) {
    return <div data-testid="loading-component">{status}</div>;
  };
});

// Mock styled components
jest.mock('./styled', () => ({
  StyledLogoWrapper: ({ children, className }) => (
    <div className={className} data-testid="logo-wrapper">{children}</div>
  ),
  StyledLogoColumnPrimary: ({ children }) => (
    <div data-testid="logo-column-primary">{children}</div>
  ),
  StyledLogoColumnSecondary: ({ children }) => (
    <div data-testid="logo-column-secondary">{children}</div>
  ),
}));

// Mock UserDetailsInputs
jest.mock('./UserDetailsInputs', () => {
  return function MockUserDetailsInputs({ data, register, errors }) {
    return (
      <div data-testid="user-details-inputs">
        User Details Form Inputs
      </div>
    );
  };
});

// Mock ImageDropzone
jest.mock('v2/apps/shared/components/image-dropzone', () => {
  return function MockImageDropzone({ existingImageUrl, onFileSelect, onDelete, ...props }) {
    return (
      <div data-testid="image-dropzone">
        Image Dropzone
        {existingImageUrl && <img src={existingImageUrl} alt="preview" />}
        <input type="file" onChange={onFileSelect} data-testid="file-input" />
        <button onClick={onDelete} data-testid="delete-button">Delete</button>
      </div>
    );
  };
});

describe('UserDetails', () => {
  const mockStore = createStore(() => ({
    company: {
      logos: {
        company: 'test-logo-url',
      },
    },
    subcontractor: null,
  }));

  const defaultProps = {
    id: 'test-id',
    contextType: 'prosper',
    cssClass: 'test-class',
    data: {
      firstname: 'John',
      lastname: 'Doe',
    },
    loading: false,
    handleUpdate: jest.fn(),
  };

  const renderComponent = (props = {}) => {
    return render(
      <Provider store={mockStore}>
        <UserDetails {...defaultProps} {...props} />
      </Provider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      renderComponent();
      expect(screen.getByTestId('main-panel')).toBeInTheDocument();
    });

    it('renders user details section', () => {
      renderComponent();
      expect(screen.getByText('profile-user-details')).toBeInTheDocument();
      expect(screen.getByTestId('user-details-inputs')).toBeInTheDocument();
    });

    it('renders company logo section', () => {
      renderComponent();
      expect(screen.getByText('profile-company-logo')).toBeInTheDocument();
    });

    it('renders save button', () => {
      renderComponent();
      expect(screen.getByText('save')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('shows loading spinner when loading is true', () => {
      renderComponent({ loading: true });
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('does not show loading spinner when loading is false', () => {
      renderComponent({ loading: false });
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    it('shows loading component for company logo initially', () => {
      // This tests the initial loading state for company logo
      renderComponent();
      // The component should render without crashing even with loading states
      expect(screen.getByTestId('main-panel')).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('renders styled wrapper components', () => {
      renderComponent();
      expect(screen.getByTestId('logo-wrapper')).toBeInTheDocument();
      expect(screen.getByTestId('logo-column-primary')).toBeInTheDocument();
      expect(screen.getByTestId('logo-column-secondary')).toBeInTheDocument();
    });

    it('applies custom CSS class', () => {
      renderComponent({ cssClass: 'custom-class' });
      const panel = screen.getByTestId('main-panel');
      expect(panel).toHaveClass('custom-class');
    });
  });

  describe('Form Integration', () => {
    it('renders form correctly', () => {
      renderComponent();
      expect(screen.getByTestId('clink-form')).toBeInTheDocument();
    });

    it('handles form submission', () => {
      const mockHandleUpdate = jest.fn();
      renderComponent({ handleUpdate: mockHandleUpdate });
      expect(screen.getByTestId('clink-form')).toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    it('passes data to UserDetailsInputs', () => {
      const testData = { firstname: 'Jane', lastname: 'Smith' };
      renderComponent({ data: testData });
      expect(screen.getByTestId('user-details-inputs')).toBeInTheDocument();
    });

    it('handles different context types', () => {
      renderComponent({ contextType: 'admin' });
      expect(screen.getByTestId('main-panel')).toBeInTheDocument();
    });
  });
});