import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import UserDetails from './index';

// Mock react-redux connect for Redux-connected components
jest.mock('react-redux', () => {
  const mockReact = require('react');
  const originalReactRedux = jest.requireActual('react-redux');
  
  return {
    ...originalReactRedux, // Keep Provider and other react-redux exports
    connect: jest.fn((mapStateToProps) => (Component) => {
      return mockReact.forwardRef((props, ref) => {
        // Mock dispatch function that returns promises
        const mockDispatch = jest.fn(() => Promise.resolve({ success: true }));
        
        // Use the real useSelector to get state from the actual Redux store
        const state = originalReactRedux.useSelector(state => state);
        
        // Apply mapStateToProps if provided
        let stateProps = {};
        if (typeof mapStateToProps === 'function') {
          stateProps = mapStateToProps(state);
        }
        
        return mockReact.createElement(Component, { 
          ...props, 
          dispatch: mockDispatch,
          ...stateProps,
          ref 
        });
      });
    }),
  };
});

// Mock dependencies
jest.mock('hooks/context', () => ({
  useContext: jest.fn(),
}));

jest.mock('v2/helpers/files', () => ({
  sizeFileIsCorrect: jest.fn(),
  typeFileIsAccepted: jest.fn(),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

jest.mock('v2/helpers/url', () => ({
  checkIfImageExists: jest.fn(),
}));

jest.mock('v2/apps/shared/components/Loading', () => {
  return function MockLoading({ status }) {
    return <div data-testid="loading">{status}</div>;
  };
});

jest.mock('clink-components', () => ({
  Form: ({ children, onSubmit, render }) => {
    const mockFormHook = {
      formState: { errors: {}, isValid: true },
      register: jest.fn(),
      trigger: jest.fn(),
    };
    return (
      <form data-testid="clink-form" onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ test: 'data' });
      }}>
        {render(mockFormHook)}
      </form>
    );
  },
}));

jest.mock('./UserDetailsInputs', () => {
  return function MockUserDetailsInputs({ data, register, errors }) {
    return (
      <div data-testid="user-details-inputs">
        UserDetailsInputs - data: {String(!!data)}, register: {String(!!register)}, errors: {String(!!errors)}
      </div>
    );
  };
});

jest.mock('v2/apps/shared/components/image-dropzone', () => {
  return function MockImageDropzone({
    theme,
    name,
    maxSize,
    acceptedTypes,
    existingImageUrl,
    onFileSelect,
    onDelete,
    register,
    errors,
    fileErrorMessage,
    hideDropzoneIfPreview,
    className,
  }) {
    return (
      <div data-testid="image-dropzone" className={className}>
        <div>Theme: {theme}</div>
        <div>Name: {name}</div>
        <div>MaxSize: {maxSize}</div>
        <div>AcceptedTypes: {JSON.stringify(acceptedTypes)}</div>
        <div>ExistingImageUrl: {existingImageUrl || 'none'}</div>
        <div>FileErrorMessage: {fileErrorMessage || 'none'}</div>
        <div>HideDropzoneIfPreview: {String(hideDropzoneIfPreview)}</div>
        <input
          data-testid="file-input"
          type="file"
          onChange={(e) => onFileSelect && onFileSelect(e)}
        />
        <button
          data-testid="delete-button"
          onClick={() => onDelete && onDelete()}
          type="button"
        >
          Delete Image
        </button>
      </div>
    );
  };
});

// Mock MUI styled components
jest.mock('../Mui.styled', () => ({
  MuiSubtitle: ({ children }) => <h3 data-testid="mui-subtitle">{children}</h3>,
  MuiSubmitWrapper: ({ children }) => <div data-testid="mui-submit-wrapper">{children}</div>,
}));

describe('UserDetails', () => {
  let mockStore;
  let mockContext;
  let mockActions;
  let mockUseContext;
  let mockSizeFileIsCorrect;
  let mockTypeFileIsAccepted;
  let mockCheckIfImageExists;

  const defaultProps = {
    data: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      jobDescription: 'Software Developer',
    },
    id: 'company-123',
    contextType: 'test-context',
    handleUpdate: jest.fn(),
    page: 1,
    setTabSelected: jest.fn(),
  };

  const defaultCompanyState = {
    logos: {
      logo: 'https://example.com/logo.png',
    },
  };

  beforeEach(() => {
    mockActions = {
      updateCompanyImage: jest.fn().mockReturnValue({ type: 'UPDATE_COMPANY_IMAGE' }),
      removeCompanyImage: jest.fn().mockReturnValue({ type: 'REMOVE_COMPANY_IMAGE' }),
    };
    mockContext = { actions: mockActions };

    mockStore = configureStore({
      reducer: {
        company: (state = defaultCompanyState) => state,
        subcontractor: (state = {}) => state,
      },
    });

    // Mock hooks
    mockUseContext = require('hooks/context').useContext;
    mockUseContext.mockReturnValue(mockContext);

    // Mock helper functions
    const filesHelpers = require('v2/helpers/files');
    mockSizeFileIsCorrect = filesHelpers.sizeFileIsCorrect;
    mockTypeFileIsAccepted = filesHelpers.typeFileIsAccepted;
    mockSizeFileIsCorrect.mockReturnValue(true);
    mockTypeFileIsAccepted.mockReturnValue(true);

    // Mock URL helper
    const urlHelpers = require('v2/helpers/url');
    mockCheckIfImageExists = urlHelpers.checkIfImageExists;
    mockCheckIfImageExists.mockImplementation((url, callback) => {
      callback(true); // Mock that image exists
    });

    jest.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    return render(
      <Provider store={mockStore}>
        <UserDetails {...defaultProps} {...props} />
      </Provider>
    );
  };

  it('renders without crashing', () => {
    renderComponent();
    expect(screen.getByTestId('clink-form')).toBeInTheDocument();
  });

  it('displays loading state initially', () => {
    // Mock checkIfImageExists to not call the callback immediately
    mockCheckIfImageExists.mockImplementation((url, callback) => {
      // Don't call callback immediately to keep loading state
    });
    
    renderComponent();
    expect(screen.getByTestId('loading')).toBeInTheDocument();
    expect(screen.getByText('Loading profile logo...')).toBeInTheDocument();
  });

  it('renders profile picture subtitle', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByTestId('mui-subtitle')).toBeInTheDocument();
      expect(screen.getByText('profile-picture')).toBeInTheDocument();
    });
  });

  it('renders UserDetailsInputs component with correct props', async () => {
    renderComponent();
    
    await waitFor(() => {
      const userDetailsInputs = screen.getByTestId('user-details-inputs');
      expect(userDetailsInputs).toBeInTheDocument();
      expect(userDetailsInputs).toHaveTextContent('data: true, register: true, errors: true');
    });
  });

  it('renders ImageDropzone with correct props when not loading', async () => {
    renderComponent();
    
    await waitFor(() => {
      const imageDropzone = screen.getByTestId('image-dropzone');
      expect(imageDropzone).toBeInTheDocument();
      expect(imageDropzone).toHaveTextContent('Theme: prosper-preq-v2');
      expect(imageDropzone).toHaveTextContent('Name: profile-image');
      expect(imageDropzone).toHaveTextContent('MaxSize: 0.5');
      expect(imageDropzone).toHaveTextContent('AcceptedTypes: ["image/jpeg","image/png"]');
      expect(imageDropzone).toHaveTextContent('HideDropzoneIfPreview: true');
      expect(imageDropzone).toHaveClass('company-profile-input');
    });
  });

  it('renders submit button with correct text and enabled state', async () => {
    renderComponent();
    
    await waitFor(() => {
      const submitButton = screen.getByRole('button', { name: 'save-continue' });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toHaveAttribute('type', 'submit');
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('handles form submission correctly', async () => {
    const mockHandleUpdate = jest.fn();
    const mockSetTabSelected = jest.fn();
    
    renderComponent({
      handleUpdate: mockHandleUpdate,
      setTabSelected: mockSetTabSelected,
      page: 2,
    });

    await waitFor(() => {
      const form = screen.getByTestId('clink-form');
      fireEvent.submit(form);
    });

    expect(mockHandleUpdate).toHaveBeenCalledWith({ test: 'data' });
    expect(mockSetTabSelected).toHaveBeenCalledWith(3); // page + 1
  });

  describe('Image Upload Handling', () => {
    it('handles successful image upload', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const mockEvent = {
        target: { files: [mockFile] },
      };

      mockSizeFileIsCorrect.mockReturnValue(true);
      mockTypeFileIsAccepted.mockReturnValue(true);

      renderComponent();

      await waitFor(() => {
        const fileInput = screen.getByTestId('file-input');
        fireEvent.change(fileInput, mockEvent);
      });

      expect(mockSizeFileIsCorrect).toHaveBeenCalledWith(mockFile, 0.5);
      expect(mockTypeFileIsAccepted).toHaveBeenCalledWith(mockFile, ['image/jpeg', 'image/png']);
      expect(mockActions.updateCompanyImage).toHaveBeenCalledWith({
        id: 'company-123',
        files: [mockFile],
        type: 'logo',
      });
    });

    it('handles file size validation error', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const mockEvent = {
        target: { files: [mockFile] },
      };

      mockSizeFileIsCorrect.mockReturnValue(false);
      mockTypeFileIsAccepted.mockReturnValue(true);

      renderComponent();

      await waitFor(() => {
        const fileInput = screen.getByTestId('file-input');
        fireEvent.change(fileInput, mockEvent);
      });

      expect(mockSizeFileIsCorrect).toHaveBeenCalledWith(mockFile, 0.5);
      expect(mockActions.updateCompanyImage).not.toHaveBeenCalled();
      
      await waitFor(() => {
        const imageDropzone = screen.getByTestId('image-dropzone');
        expect(imageDropzone).toHaveTextContent('FileErrorMessage: file-too-large_one');
      });
    });

    it('handles file type validation error', async () => {
      const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      const mockEvent = {
        target: { files: [mockFile] },
      };

      mockSizeFileIsCorrect.mockReturnValue(true);
      mockTypeFileIsAccepted.mockReturnValue(false);

      renderComponent();

      await waitFor(() => {
        const fileInput = screen.getByTestId('file-input');
        fireEvent.change(fileInput, mockEvent);
      });

      expect(mockTypeFileIsAccepted).toHaveBeenCalledWith(mockFile, ['image/jpeg', 'image/png']);
      expect(mockActions.updateCompanyImage).not.toHaveBeenCalled();
      
      await waitFor(() => {
        const imageDropzone = screen.getByTestId('image-dropzone');
        expect(imageDropzone).toHaveTextContent('FileErrorMessage: invalid-type-file_one');
      });
    });

    it('handles image deletion', async () => {
      renderComponent();

      await waitFor(() => {
        const deleteButton = screen.getByTestId('delete-button');
        fireEvent.click(deleteButton);
      });

      expect(mockActions.removeCompanyImage).toHaveBeenCalledWith({
        id: 'company-123',
        profileLogo: 'https://example.com/logo.png',
        type: 'logo',
      });
    });
  });

  describe('Image URL Checking', () => {
    it('checks if profile logo exists on mount', () => {
      renderComponent();
      
      expect(mockCheckIfImageExists).toHaveBeenCalledWith(
        'https://example.com/logo.png',
        expect.any(Function)
      );
    });

    it('handles case when image does not exist', async () => {
      mockCheckIfImageExists.mockImplementation((url, callback) => {
        callback(false); // Mock that image does not exist
      });

      renderComponent();

      await waitFor(() => {
        const imageDropzone = screen.getByTestId('image-dropzone');
        expect(imageDropzone).toHaveTextContent('ExistingImageUrl: none');
      });
    });
  });

  describe('Props Handling', () => {
    it('handles missing data prop', async () => {
      renderComponent({ data: null });
      
      await waitFor(() => {
        const userDetailsInputs = screen.getByTestId('user-details-inputs');
        expect(userDetailsInputs).toHaveTextContent('data: false');
      });
    });

    it('handles different page values', async () => {
      const mockSetTabSelected = jest.fn();
      renderComponent({ page: 5, setTabSelected: mockSetTabSelected });

      await waitFor(() => {
        const form = screen.getByTestId('clink-form');
        fireEvent.submit(form);
      });

      expect(mockSetTabSelected).toHaveBeenCalledWith(6); // page + 1
    });
  });

  describe('Redux Integration', () => {
    it('connects to Redux store correctly', () => {
      renderComponent();
      
      // Verify that the component receives company data from Redux
      expect(mockCheckIfImageExists).toHaveBeenCalledWith(
        'https://example.com/logo.png',
        expect.any(Function)
      );
    });

    it('handles missing company logos', () => {
      const storeWithoutLogos = configureStore({
        reducer: {
          company: () => ({ logos: {} }),
          subcontractor: () => ({}),
        },
      });

      render(
        <Provider store={storeWithoutLogos}>
          <UserDetails {...defaultProps} />
        </Provider>
      );

      expect(mockCheckIfImageExists).toHaveBeenCalledWith(
        undefined,
        expect.any(Function)
      );
    });
  });
});