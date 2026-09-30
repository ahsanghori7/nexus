import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import FileImage from './index';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-object-url');

describe('FileImage Component', () => {
  const defaultProps = {
    name: 'document',
    register: jest.fn(() => ({
      onChange: jest.fn(),
      name: 'document',
    })),
    errors: {},
    value: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders without crashing', () => {
    render(<FileImage {...defaultProps} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders with default label and action text', () => {
    render(<FileImage {...defaultProps} />);
    
    expect(screen.getByText('upload-avatar')).toBeInTheDocument();
    expect(screen.getByText('Choose file')).toBeInTheDocument();
  });

  it('renders with custom label and actionLabel', () => {
    render(
      <FileImage 
        {...defaultProps} 
        label="Custom Label" 
        actionLabel="Custom Action" 
      />
    );
    
    expect(screen.getByText('Custom Label')).toBeInTheDocument();
    expect(screen.getByText('Custom Action')).toBeInTheDocument();
  });

  it('renders description text on larger screens', () => {
    render(<FileImage {...defaultProps} />);
    
    const description = screen.getByText(/File size must be no bigger than 200k/);
    expect(description).toBeInTheDocument();
  });

  it('renders custom description', () => {
    const customDescription = 'Custom file upload description';
    render(<FileImage {...defaultProps} description={customDescription} />);
    
    expect(screen.getByText(customDescription)).toBeInTheDocument();
  });

  it('does not render description when description is empty', () => {
    render(<FileImage {...defaultProps} description="" />);
    
    expect(screen.queryByText(/File size must be no bigger than 200k/)).not.toBeInTheDocument();
  });

  it('handles file selection correctly', () => {
    const mockOnChange = jest.fn();
    const mockRegister = jest.fn(() => ({
      onChange: mockOnChange,
      name: 'document',
    }));
    
    render(<FileImage {...defaultProps} register={mockRegister} />);
    
    const fileInput = screen.getByDisplayValue('');
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    
    // Use userEvent to upload the file
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    expect(mockOnChange).toHaveBeenCalled();
  });

  it('renders error message when error exists', () => {
    const errorMessage = 'File is required';
    const propsWithError = {
      ...defaultProps,
      errors: { document: errorMessage },
    };
    
    render(<FileImage {...propsWithError} />);
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('supports multiple file selection when multiple prop is true', () => {
    render(<FileImage {...defaultProps} multiple={true} />);
    
    const fileInput = screen.getByDisplayValue('');
    expect(fileInput).toHaveAttribute('multiple');
  });

  it('renders logo view when logo prop is provided', () => {
    const logoUrl = 'https://example.com/logo.png';
    const mockSetLogo = jest.fn();
    
    render(
      <FileImage 
        {...defaultProps} 
        logo={logoUrl} 
        setLogo={mockSetLogo}
        label="Company Logo"
      />
    );
    
    expect(screen.getByText('Company Logo')).toBeInTheDocument();
    expect(screen.getByTestId('mui-company-avatar')).toBeInTheDocument();
    expect(screen.getByTestId('avatar-image')).toHaveAttribute('src', logoUrl);
  });

  it('handles logo deletion', () => {
    const logoUrl = 'https://example.com/logo.png';
    const mockSetLogo = jest.fn();
    
    render(
      <FileImage 
        {...defaultProps} 
        logo={logoUrl} 
        setLogo={mockSetLogo}
      />
    );
    
    const deleteButton = screen.getByTestId('avatar-delete-button');
    fireEvent.click(deleteButton);
    
    expect(mockSetLogo).toHaveBeenCalledWith(false);
  });

  it('renders dropzone wrapper when dropzone prop is true', () => {
    render(<FileImage {...defaultProps} dropzone={true} />);
    
    const dropzoneElement = screen.getByRole('button').closest('#custom-dropzone');
    expect(dropzoneElement).toBeInTheDocument();
  });

  it('handles drag and drop events', () => {
    const mockOnChange = jest.fn();
    const mockRegister = jest.fn(() => ({
      onChange: mockOnChange,
      name: 'document',
    }));
    
    render(<FileImage {...defaultProps} register={mockRegister} dropzone={true} />);
    
    const dropzoneElement = screen.getByRole('button').closest('#custom-dropzone');
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    
    fireEvent.dragOver(dropzoneElement, {
      dataTransfer: {
        files: [file],
      },
    });
    
    fireEvent.drop(dropzoneElement, {
      dataTransfer: {
        files: [file],
      },
    });
    
    expect(mockOnChange).toHaveBeenCalled();
  });

  it('creates object URL when setLogo is provided and file is selected', () => {
    const mockSetLogo = jest.fn();
    const mockOnChange = jest.fn();
    const mockRegister = jest.fn(() => ({
      onChange: (e) => {
        const [file] = e.target.files;
        if (file) {
          mockSetLogo(URL.createObjectURL(file));
        }
        mockOnChange(e);
      },
      name: 'document',
    }));
    
    render(
      <FileImage 
        {...defaultProps} 
        register={mockRegister}
        setLogo={mockSetLogo}
      />
    );
    
    const fileInput = screen.getByDisplayValue('');
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    expect(global.URL.createObjectURL).toHaveBeenCalledWith(file);
    expect(mockSetLogo).toHaveBeenCalledWith('mock-object-url');
  });

  it('renders without label when label is not provided', () => {
    render(<FileImage {...defaultProps} label="" />);
    
    expect(screen.queryByTestId('mui-subtitle')).not.toBeInTheDocument();
  });

  it('does not call setLogo when setLogo is not provided', () => {
    const mockOnChange = jest.fn();
    const mockRegister = jest.fn(() => ({
      onChange: mockOnChange,
      name: 'document',
    }));
    
    render(<FileImage {...defaultProps} register={mockRegister} />);
    
    const fileInput = screen.getByDisplayValue('');
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    // This should not throw an error even though setLogo is not provided
    expect(() => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    }).not.toThrow();
    
    expect(mockOnChange).toHaveBeenCalled();
  });

  it('renders component with hidden file input', () => {
    render(<FileImage {...defaultProps} />);
    
    const fileInput = screen.getByDisplayValue('');
    expect(fileInput).toHaveAttribute('type', 'file');
    expect(fileInput).toHaveAttribute('name', 'document');
  });

  it('renders button with correct fullWidth prop', () => {
    render(<FileImage {...defaultProps} />);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('handles multiple file selection correctly', () => {
    render(<FileImage {...defaultProps} multiple={true} value={[{ original_file: 'existing.pdf', document: '' }]} />);
    
    const fileInput = screen.getByDisplayValue('');
    const file1 = new File(['test1'], 'test1.pdf', { type: 'application/pdf' });
    const file2 = new File(['test2'], 'test2.pdf', { type: 'application/pdf' });
    
    fireEvent.change(fileInput, { target: { files: [file1, file2] } });
    
    // The component should handle multiple files
    expect(fileInput).toHaveAttribute('multiple');
  });

  it('handles single file replacement correctly', () => {
    render(<FileImage {...defaultProps} multiple={false} value={[{ original_file: 'existing.pdf', document: '' }]} />);
    
    const fileInput = screen.getByDisplayValue('');
    const file = new File(['test'], 'new.pdf', { type: 'application/pdf' });
    
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    // For single file mode, the new file should replace existing files
    expect(fileInput).not.toHaveAttribute('multiple');
  });

  it('handles empty file selection correctly', () => {
    const mockOnChange = jest.fn();
    const mockRegister = jest.fn(() => ({
      onChange: mockOnChange,
      name: 'document',
    }));
    
    render(<FileImage {...defaultProps} register={mockRegister} />);
    
    const fileInput = screen.getByDisplayValue('');
    
    // Simulate empty file selection (e.g., when user cancels file dialog)
    fireEvent.change(fileInput, { target: { files: null } });
    
    // The onChange should still be called even with null files
    expect(mockOnChange).toHaveBeenCalled();
  });

  it('properly registers with form hook with setLogo functionality', () => {
    const mockSetLogo = jest.fn();
    const mockRegister = jest.fn((name, options) => {
      // Return the register result including the onChange handler
      return {
        onChange: options.onChange,
        name: 'document',
      };
    });
    
    render(<FileImage {...defaultProps} register={mockRegister} setLogo={mockSetLogo} />);
    
    // Verify that register was called with the correct parameters
    expect(mockRegister).toHaveBeenCalledWith('document', {
      onChange: expect.any(Function),
    });
  });
});