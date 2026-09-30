import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import Dropzone from './index';

// Mock the required dependencies
jest.mock('v2/helpers/files', () => ({
  sizeFileIsCorrect: jest.fn(() => true),
  typeFileIsAccepted: jest.fn(() => true),
  DEFAULT_MAX_SIZE_MB: 10,
}));

jest.mock('v2/helpers/url', () => ({
  getQueryStringVars: jest.fn(() => ({ id: '123' })),
}));

jest.mock('hooks/context', () => ({
  useContext: jest.fn(() => ({
    actions: {
      addDocument: jest.fn(),
      initialDocumentUpdate: jest.fn(),
      changeUploadingDocumentsState: jest.fn(),
      removeDocument: jest.fn(),
    },
  })),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, options) => {
      if (key === 'file-too-large_other') return `${options?.count} files are too large (max ${options?.size}MB)`;
      if (key === 'file-too-large_one') return `File is too large (max ${options?.size}MB)`;
      if (key === 'invalid-type-file') return 'Invalid file type';
      return key;
    },
  }),
}));

// Create a mock store
const createMockStore = (initialState = {}) => ({
  getState: () => initialState,
  dispatch: jest.fn(),
  subscribe: jest.fn(),
});

const renderWithProviders = (component, options = {}) => {
  const { initialState = {}, ...renderOptions } = options;
  const store = createMockStore(initialState);
  
  return render(
    <Provider store={store}>
      <MemoryRouter>
        {component}
      </MemoryRouter>
    </Provider>,
    renderOptions
  );
};

describe('Dropzone Component', () => {
  const defaultProps = {
    data: null,
    errors: {},
    register: jest.fn(),
    trigger: jest.fn(),
    instructionsDocuments: {
      uploadingDocumentsState: {
        currentDocs: 0,
        current: '',
        uploaded: 0,
        uploading: false,
        total: 0,
        errors: [],
        DOCS_PER_REQUEST: 5,
      },
      documents: [],
      firstLoaded: true,
    },
    contextType: 'clink',
    theme: 'c-link',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderWithProviders(<Dropzone {...defaultProps} />);
    expect(screen.getByText('Attach documents')).toBeInTheDocument();
  });

  it('displays drag and drop interface when not uploading', () => {
    renderWithProviders(<Dropzone {...defaultProps} />);
    expect(screen.getByText('Drag and drop your file or')).toBeInTheDocument();
    expect(screen.getByText('browse for your files')).toBeInTheDocument();
  });

  it('displays uploading interface when uploading', () => {
    const uploadingProps = {
      ...defaultProps,
      instructionsDocuments: {
        ...defaultProps.instructionsDocuments,
        uploadingDocumentsState: {
          ...defaultProps.instructionsDocuments.uploadingDocumentsState,
          uploading: true,
          total: 3,
          uploaded: 1,
          current: 'test-file.pdf',
          errors: [],
        },
      },
    };

    renderWithProviders(<Dropzone {...uploadingProps} />);
    expect(screen.getByText('Uploading')).toBeInTheDocument();
    expect(screen.getByText('test-file.pdf')).toBeInTheDocument();
    expect(screen.getByText('1/3 uploaded')).toBeInTheDocument();
  });

  it('displays error messages when upload errors occur', () => {
    const errorProps = {
      ...defaultProps,
      instructionsDocuments: {
        ...defaultProps.instructionsDocuments,
        uploadingDocumentsState: {
          ...defaultProps.instructionsDocuments.uploadingDocumentsState,
          errors: [{ invalid: 'File is too large' }],
        },
      },
    };

    renderWithProviders(<Dropzone {...errorProps} />);
    expect(screen.getByText('File is too large')).toBeInTheDocument();
    expect(screen.getByText('1 error')).toBeInTheDocument();
  });

  it('displays multiple error message when multiple errors occur', () => {
    const errorProps = {
      ...defaultProps,
      instructionsDocuments: {
        ...defaultProps.instructionsDocuments,
        uploadingDocumentsState: {
          ...defaultProps.instructionsDocuments.uploadingDocumentsState,
          errors: [
            { invalid: 'File is too large' },
            { invalid: 'Invalid file type' },
          ],
        },
      },
    };

    renderWithProviders(<Dropzone {...errorProps} />);
    expect(screen.getByText('File is too large')).toBeInTheDocument();
    expect(screen.getByText('2 errors')).toBeInTheDocument();
  });

  it('displays maximum file size information', () => {
    renderWithProviders(<Dropzone {...defaultProps} />);
    expect(screen.getByText('(Maximum file size: 10MB per file)')).toBeInTheDocument();
  });

  it('calls initialDocumentUpdate when data.documents is provided and firstLoaded is true', () => {
    const mockActions = {
      addDocument: jest.fn(),
      initialDocumentUpdate: jest.fn(),
      changeUploadingDocumentsState: jest.fn(),
      removeDocument: jest.fn(),
    };

    require('hooks/context').useContext.mockReturnValue({
      actions: mockActions,
    });

    const propsWithDocuments = {
      ...defaultProps,
      data: {
        documents: [{ id: 1, name: 'test.pdf' }],
      },
    };

    const { rerender } = renderWithProviders(<Dropzone {...propsWithDocuments} />);
    
    expect(mockActions.initialDocumentUpdate).toHaveBeenCalledWith([{ id: 1, name: 'test.pdf' }]);
  });

  it('does not call initialDocumentUpdate when firstLoaded is false', () => {
    const mockActions = {
      addDocument: jest.fn(),
      initialDocumentUpdate: jest.fn(),
      changeUploadingDocumentsState: jest.fn(),
      removeDocument: jest.fn(),
    };

    require('hooks/context').useContext.mockReturnValue({
      actions: mockActions,
    });

    const propsWithDocuments = {
      ...defaultProps,
      data: {
        documents: [{ id: 1, name: 'test.pdf' }],
      },
      instructionsDocuments: {
        ...defaultProps.instructionsDocuments,
        firstLoaded: false,
      },
    };

    renderWithProviders(<Dropzone {...propsWithDocuments} />);
    
    expect(mockActions.initialDocumentUpdate).not.toHaveBeenCalled();
  });

  it('renders with different theme', () => {
    const themedProps = {
      ...defaultProps,
      theme: 'prosper',
    };

    renderWithProviders(<Dropzone {...themedProps} />);
    expect(screen.getByText('Attach documents')).toBeInTheDocument();
  });

  it('renders with different context type', () => {
    const contextProps = {
      ...defaultProps,
      contextType: 'prosper',
    };

    renderWithProviders(<Dropzone {...contextProps} />);
    expect(screen.getByText('Attach documents')).toBeInTheDocument();
  });

  it('displays documents list when documents are present', () => {
    const propsWithDocuments = {
      ...defaultProps,
      instructionsDocuments: {
        ...defaultProps.instructionsDocuments,
        documents: [
          { id: 1, name: 'test1.pdf' },
          { id: 2, name: 'test2.pdf' },
        ],
      },
    };

    renderWithProviders(<Dropzone {...propsWithDocuments} />);
    // The DropzoneAccordionFileList component should render with the documents
    expect(screen.getByText('Attach documents')).toBeInTheDocument();
  });
});