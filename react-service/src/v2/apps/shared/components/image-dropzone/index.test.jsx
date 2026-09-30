import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useTranslation } from 'react-i18next';
import ImageDropzone from './index';

// Mock the clink-components
jest.mock('clink-components', () => ({
  DropzoneWrapper: ({ children, theme }) => <div data-testid="dropzone-wrapper" data-theme={theme}>{children}</div>,
  DropzoneContent: ({ children, theme }) => <div data-testid="dropzone-content" data-theme={theme}>{children}</div>,
  DropzoneIcon: ({ children, theme }) => <div data-testid="dropzone-icon" data-theme={theme}>{children}</div>,
  DropzoneFileList: ({ theme, files }) => <div data-testid="dropzone-file-list" data-theme={theme} data-files-length={files.length}></div>,
  DropzoneFooter: ({ children, theme }) => <div data-testid="dropzone-footer" data-theme={theme}>{children}</div>,
  InputForm: ({ children, errors, name, type, theme, register, className, rules, documents }) => (
    <div data-testid="input-form" data-name={name} data-type={type} data-theme={theme} className={className}>
      {children}
    </div>
  ),
  Image: ({ src }) => <img data-testid="image" src={src} alt="" />,
  CONSTANTS: {
    s3: {
      upload: 'mock-upload-icon.svg'
    }
  }
}));

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'drag-and-drop-image': 'Drag and drop an image here',
        'or': 'or',
        'choose-file': 'Choose file',
        'file-size-no-bigger-than': 'File size no bigger than',
        'image-should-be-jpg-png': 'image should be JPG or PNG'
      };
      return translations[key] || key;
    }
  })
}));

// Mock the company-v2 components
jest.mock('../company-v2/Mui.styled', () => ({
  MuiCompanyAvatar: ({ picSrc, onDelete }) => (
    <div data-testid="mui-company-avatar" data-pic-src={picSrc}>
      <button onClick={onDelete}>Delete</button>
    </div>
  ),
  MuiInvalidInput: ({ children }) => <div data-testid="mui-invalid-input">{children}</div>
}));

describe('ImageDropzone', () => {
  const defaultProps = {
    theme: 'prosper',
    name: 'image',
    maxSize: 0.5,
    onFileSelect: jest.fn(),
    onDelete: jest.fn(),
    register: jest.fn(),
    errors: {},
    rules: {}
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<ImageDropzone {...defaultProps} />);
    expect(screen.getByTestId('input-form')).toBeInTheDocument();
  });

  it('renders dropzone elements when no existing image', () => {
    render(<ImageDropzone {...defaultProps} />);
    
    expect(screen.getByTestId('dropzone-wrapper')).toBeInTheDocument();
    expect(screen.getByTestId('dropzone-icon')).toBeInTheDocument();
    expect(screen.getByTestId('dropzone-content')).toBeInTheDocument();
    expect(screen.getByTestId('dropzone-footer')).toBeInTheDocument();
    expect(screen.getByText('Drag and drop an image here')).toBeInTheDocument();
    expect(screen.getByText('or')).toBeInTheDocument();
    expect(screen.getByText('Choose file')).toBeInTheDocument();
  });

  it('displays correct file size information', () => {
    const maxSize = 2;
    render(<ImageDropzone {...defaultProps} maxSize={maxSize} />);
    
    expect(screen.getByText('File size no bigger than 2000k, image should be JPG or PNG')).toBeInTheDocument();
  });

  it('uses correct theme', () => {
    const theme = 'clink';
    render(<ImageDropzone {...defaultProps} theme={theme} />);
    
    expect(screen.getByTestId('dropzone-wrapper')).toHaveAttribute('data-theme', theme);
    expect(screen.getByTestId('input-form')).toHaveAttribute('data-theme', theme);
  });

  it('displays error message when provided', () => {
    const errorMessage = 'File too large';
    render(<ImageDropzone {...defaultProps} fileErrorMessage={errorMessage} />);
    
    expect(screen.getByTestId('mui-invalid-input')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('shows MuiCompanyAvatar when existingImageUrl is provided and hideDropzoneIfPreview is true', () => {
    const existingImageUrl = 'https://example.com/image.jpg';
    render(
      <ImageDropzone 
        {...defaultProps} 
        existingImageUrl={existingImageUrl} 
        hideDropzoneIfPreview={true} 
      />
    );
    
    expect(screen.getByTestId('mui-company-avatar')).toBeInTheDocument();
    expect(screen.getByTestId('mui-company-avatar')).toHaveAttribute('data-pic-src', existingImageUrl);
    expect(screen.queryByTestId('dropzone-icon')).not.toBeInTheDocument();
  });

  it('shows both avatar and dropzone elements when existingImageUrl is provided but hideDropzoneIfPreview is false', () => {
    const existingImageUrl = 'https://example.com/image.jpg';
    render(
      <ImageDropzone 
        {...defaultProps} 
        existingImageUrl={existingImageUrl} 
        hideDropzoneIfPreview={false} 
      />
    );
    
    expect(screen.getByTestId('dropzone-icon')).toBeInTheDocument();
    expect(screen.getByTestId('dropzone-content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const className = 'custom-class';
    render(<ImageDropzone {...defaultProps} className={className} />);
    
    expect(screen.getByTestId('input-form')).toHaveClass(className);
  });

  it('uses custom name prop', () => {
    const name = 'avatar';
    render(<ImageDropzone {...defaultProps} name={name} />);
    
    expect(screen.getByTestId('input-form')).toHaveAttribute('data-name', name);
  });

  it('renders upload icon', () => {
    render(<ImageDropzone {...defaultProps} />);
    
    expect(screen.getByTestId('image')).toHaveAttribute('src', 'mock-upload-icon.svg');
  });
});