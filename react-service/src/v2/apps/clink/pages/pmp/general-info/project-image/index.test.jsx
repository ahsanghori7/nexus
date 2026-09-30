import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import ProjectImageComponent from './index';

// Mock dependencies
jest.mock('v2/helpers/i18n', () => ({
  t: jest.fn((key) => key),
}));

jest.mock('v2/helpers/url', () => ({
  getProjectLogo: jest.fn((id) => id ? `logo-${id}.jpg` : ''),
}));

jest.mock('services/clinkHelpers', () => ({
  postFormData: jest.fn(),
}));

jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: {
        lightPeriwinkle: '#e6e6fa',
      },
    },
  },
}));

jest.mock('./validateImageDimensions', () => ({
  allowedTypes: ['image/jpeg', 'image/png', 'image/gif'],
}));

// Mock MUI components
jest.mock('@mui/material/Button', () => {
  return function MockButton({ children, onClick, startIcon, ...props }) {
    return (
      <button 
        data-testid="button" 
        onClick={onClick}
        {...props}
      >
        {startIcon}
        {children}
      </button>
    );
  };
});

jest.mock('@mui/material/Alert', () => {
  return function MockAlert({ children, severity }) {
    return (
      <div data-testid="alert" data-severity={severity}>
        {children}
      </div>
    );
  };
});

jest.mock('@mui/material/Grid2', () => {
  return function MockGrid2({ children, ...props }) {
    return <div data-testid="grid2" {...props}>{children}</div>;
  };
});

jest.mock('@mui/material/Typography', () => {
  return function MockTypography({ children, ...props }) {
    return <div data-testid="typography" {...props}>{children}</div>;
  };
});

jest.mock('@mui/material/Card', () => {
  return function MockCard({ children, ...props }) {
    return <div data-testid="card" {...props}>{children}</div>;
  };
});

jest.mock('@mui/material/CardActions', () => {
  return function MockCardActions({ children, ...props }) {
    return <div data-testid="card-actions" {...props}>{children}</div>;
  };
});

jest.mock('@mui/material/CardContent', () => {
  return function MockCardContent({ children, ...props }) {
    return <div data-testid="card-content" {...props}>{children}</div>;
  };
});

jest.mock('@mui/material/CardMedia', () => {
  return function MockCardMedia({ title, ...props }) {
    return <div data-testid="card-media" data-title={title} {...props} />;
  };
});

jest.mock('@mui/icons-material/CloudUpload', () => {
  return function MockCloudUploadIcon() {
    return <span data-testid="cloud-upload-icon" />;
  };
});

jest.mock('react-lazy-load-image-component', () => ({
  LazyLoadImage: function MockLazyLoadImage({ src, alt, onError, ...props }) {
    return (
      <img 
        data-testid="lazy-image"
        src={src}
        alt={alt}
        onError={onError}
        {...props}
      />
    );
  },
}));

jest.mock('./UploadBox', () => ({
  __esModule: true,
  default: function MockUploadBox({ handleUpload }) {
    return (
      <div 
        data-testid="upload-box"
        onClick={() =>
          handleUpload &&
          handleUpload({
            target: {
              files: [{ name: 'test.jpg', type: 'image/jpeg' }]
            }
          })
        }
      />
    );
  },
  VisuallyHiddenInput: function MockVisuallyHiddenInput({ onChange, ...props }) {
    return (
      <input
        data-testid="hidden-input"
        type="file"
        onChange={onChange}
        {...props}
      />
    );
  },
}));

// Mock react-redux
jest.mock('react-redux', () => ({
  connect: (mapStateToProps) => (Component) => {
    const ConnectedComponent = (props) => {
      const mockState = {
        project: props.mockProject || {
          data: { id: null }
        }
      };
      const stateProps = mapStateToProps ? mapStateToProps(mockState) : {};
      return <Component {...stateProps} {...props} />;
    };
    ConnectedComponent.mapStateToProps = mapStateToProps;
    return ConnectedComponent;
  },
  Provider: ({ children }) => children,
}));

describe('ProjectImage Component', () => {
  let mockStore;

  beforeEach(() => {
    mockStore = {
      getState: () => ({
        project: {
          data: { id: '123' }
        }
      }),
      subscribe: jest.fn(),
      dispatch: jest.fn(),
    };

    // Reset mocks
    require('v2/helpers/i18n').t.mockClear();
    require('v2/helpers/url').getProjectLogo.mockClear();
    require('services/clinkHelpers').postFormData.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Structure', () => {
    it('should render the component', () => {
      render(
        <Provider store={mockStore}>
          <ProjectImageComponent />
        </Provider>
      );
      
      expect(screen.getAllByTestId('grid2')[0]).toBeInTheDocument();
    });

    it('should render the project image title', () => {
      render(
        <Provider store={mockStore}>
          <ProjectImageComponent />
        </Provider>
      );
      
      expect(screen.getByTestId('typography')).toBeInTheDocument();
      const i18next = require('v2/helpers/i18n');
      expect(i18next.t).toHaveBeenCalledWith('project-image');
    });

    it('should render the card component', () => {
      render(
        <Provider store={mockStore}>
          <ProjectImageComponent />
        </Provider>
      );
      
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('should render card actions with upload button', () => {
      render(
        <Provider store={mockStore}>
          <ProjectImageComponent />
        </Provider>
      );
      
      expect(screen.getByTestId('card-actions')).toBeInTheDocument();
      expect(screen.getByTestId('upload-project-image-button')).toBeInTheDocument();
    });
  });

  describe('Image Display Logic', () => {
    it('should display image when project has ID and image exists', () => {
      const { getProjectLogo } = require('v2/helpers/url');
      getProjectLogo.mockReturnValue('logo-123.jpg');

      render(
        <Provider store={mockStore}>
          <ProjectImageComponent mockProject={{ data: { id: '123' } }} />
        </Provider>
      );

      expect(screen.getByTestId('card-media')).toBeInTheDocument();
      expect(screen.getByTestId('lazy-image')).toBeInTheDocument();
    });

    it('should show upload box when no image exists', () => {
      const { getProjectLogo } = require('v2/helpers/url');
      getProjectLogo.mockReturnValue('');

      render(
        <Provider store={mockStore}>
          <ProjectImageComponent mockProject={{ data: { id: '123' } }} />
        </Provider>
      );

      expect(screen.getByTestId('card-content')).toBeInTheDocument();
      expect(screen.getByTestId('upload-box')).toBeInTheDocument();
    });

    it('should handle different image states correctly', () => {
      const { getProjectLogo } = require('v2/helpers/url');
      
      // Test with image present
      getProjectLogo.mockReturnValue('logo-123.jpg');

      const { rerender } = render(
        <Provider store={mockStore}>
          <ProjectImageComponent mockProject={{ data: { id: '123' } }} />
        </Provider>
      );

      expect(screen.getByTestId('lazy-image')).toBeInTheDocument();
      expect(screen.getByTestId('card-media')).toBeInTheDocument();
      
      // Test without image
      getProjectLogo.mockReturnValue('');
      
      rerender(
        <Provider store={mockStore}>
          <ProjectImageComponent mockProject={{ data: { id: '456' } }} />
        </Provider>
      );

      expect(screen.queryByTestId('lazy-image')).not.toBeInTheDocument();
      expect(screen.queryByTestId('card-media')).not.toBeInTheDocument();
      expect(screen.getByTestId('card-content')).toBeInTheDocument();
    });
  });

  describe('Upload Button Text', () => {
    it('should show "upload-image" text when no image exists', () => {
      const { getProjectLogo } = require('v2/helpers/url');
      getProjectLogo.mockReturnValue('');
      
      const i18next = require('v2/helpers/i18n');
      i18next.t.mockClear();

      render(
        <Provider store={mockStore}>
          <ProjectImageComponent mockProject={{ data: { id: '123' } }} />
        </Provider>
      );

      expect(i18next.t).toHaveBeenCalledWith('upload-image');
    });

    it('should show "replace-image" text when image exists', () => {
      const { getProjectLogo } = require('v2/helpers/url');
      getProjectLogo.mockReturnValue('logo-123.jpg');
      
      const i18next = require('v2/helpers/i18n');
      i18next.t.mockClear();

      render(
        <Provider store={mockStore}>
          <ProjectImageComponent mockProject={{ data: { id: '123' } }} />
        </Provider>
      );

      expect(i18next.t).toHaveBeenCalledWith('replace-image');
    });
  });

  describe('File Upload Handling', () => {
    it('should handle valid file upload', async () => {
      const { postFormData } = require('services/clinkHelpers');
      postFormData.mockResolvedValue({
        json: () => Promise.resolve({ success: true })
      });

      render(
        <Provider store={mockStore}>
          <ProjectImageComponent mockProject={{ data: { id: '123' } }} />
        </Provider>
      );

      const hiddenInput = screen.getByTestId('hidden-input');
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      fireEvent.change(hiddenInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(postFormData).toHaveBeenCalledWith(
          'project',
          'addLogo',
          { file },
          { pid: '123' }
        );
      });
    });

    it('should handle invalid file type', async () => {
      render(
        <Provider store={mockStore}>
          <ProjectImageComponent mockProject={{ data: { id: '123' } }} />
        </Provider>
      );

      const hiddenInput = screen.getByTestId('hidden-input');
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      
      fireEvent.change(hiddenInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByTestId('alert')).toBeInTheDocument();
      });

      const i18next = require('v2/helpers/i18n');
      expect(i18next.t).toHaveBeenCalledWith('unsupported-format');
    });

    it('should handle upload failure', async () => {
      const { postFormData } = require('services/clinkHelpers');
      postFormData.mockResolvedValue({
        json: () => Promise.resolve({ success: false })
      });

      render(
        <Provider store={mockStore}>
          <ProjectImageComponent mockProject={{ data: { id: '123' } }} />
        </Provider>
      );

      const hiddenInput = screen.getByTestId('hidden-input');
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      fireEvent.change(hiddenInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByTestId('alert')).toBeInTheDocument();
      });
    });
  });

  describe('useEffect Hook', () => {
    it('should update image source when project ID changes', () => {
      const { getProjectLogo } = require('v2/helpers/url');
      getProjectLogo.mockReturnValue('logo-456.jpg');

      const { rerender } = render(
        <Provider store={mockStore}>
          <ProjectImageComponent mockProject={{ data: { id: '123' } }} />
        </Provider>
      );

      rerender(
        <Provider store={mockStore}>
          <ProjectImageComponent mockProject={{ data: { id: '456' } }} />
        </Provider>
      );

      expect(getProjectLogo).toHaveBeenCalledWith('456');
    });

    it('should clear image source when project ID is null', () => {
      const { getProjectLogo } = require('v2/helpers/url');

      render(
        <Provider store={mockStore}>
          <ProjectImageComponent mockProject={{ data: { id: null } }} />
        </Provider>
      );

      expect(screen.queryByTestId('card-media')).not.toBeInTheDocument();
    });
  });

  describe('Redux Integration', () => {
    it('should have mapStateToProps function', () => {
      expect(ProjectImageComponent.mapStateToProps).toBeDefined();
      expect(typeof ProjectImageComponent.mapStateToProps).toBe('function');
    });

    it('should correctly map project from state', () => {
      const mockState = {
        project: { data: { id: '789' } },
        otherProperty: 'should not be included',
      };

      const result = ProjectImageComponent.mapStateToProps(mockState);

      expect(result).toEqual({
        project: { data: { id: '789' } },
      });
    });
  });

  describe('Error Handling', () => {
    it('should clear error when valid file is selected after invalid file', async () => {
      const { postFormData } = require('services/clinkHelpers');
      postFormData.mockResolvedValue({
        json: () => Promise.resolve({ success: true })
      });

      render(
        <Provider store={mockStore}>
          <ProjectImageComponent mockProject={{ data: { id: '123' } }} />
        </Provider>
      );

      const hiddenInput = screen.getByTestId('hidden-input');
      
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      fireEvent.change(hiddenInput, { target: { files: [invalidFile] } });

      await waitFor(() => {
        expect(screen.getByTestId('alert')).toBeInTheDocument();
      });

      const validFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      fireEvent.change(hiddenInput, { target: { files: [validFile] } });

      await waitFor(() => {
        expect(screen.queryByTestId('alert')).not.toBeInTheDocument();
      });
    });
  });
});
