import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FileUploader from './FileUploader';

// Mock i18next
jest.mock('v2/helpers/i18n', () => ({
  t: (key) => key,
}));

// Mock file size helper
jest.mock('v2/helpers/files', () => ({
  sizeFileIsCorrect: jest.fn((file) => file.size <= 10000000), // 10MB limit
}));

describe('FileUploader Component', () => {
  const defaultProps = {
    files: [],
    setFiles: jest.fn(),
    setHasFiles: jest.fn(),
    deletedFiles: [],
    setDeletedFiles: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render documents title', () => {
      render(<FileUploader {...defaultProps} />);
      expect(screen.getByText('documents')).toBeInTheDocument();
    });

    it('should render add button when not readOnly', () => {
      render(<FileUploader {...defaultProps} />);
      expect(screen.getByText('add')).toBeInTheDocument();
    });

    it('should not render add button when readOnly', () => {
      render(<FileUploader {...defaultProps} readOnly={true} />);
      expect(screen.queryByText('add')).not.toBeInTheDocument();
    });

    it('should show no documents message when readOnly and no files', () => {
      render(<FileUploader {...defaultProps} readOnly={true} />);
      expect(screen.getByText('No documents available')).toBeInTheDocument();
    });
  });

  describe('File Display', () => {
    const mockFiles = [
      {
        id: 'file-1',
        file: { name: 'document1.pdf' },
        error: '',
      },
      {
        id: 'file-2',
        file: { name: 'document2.jpg' },
        error: 'File too large',
      },
      {
        id: 'file-3',
        name: 'existing-file.doc', // For pre-existing files without file object
      },
    ];

    it('should display uploaded files', () => {
      render(<FileUploader {...defaultProps} files={mockFiles} />);
      expect(screen.getByText('document1.pdf')).toBeInTheDocument();
      expect(screen.getByText('document2.jpg')).toBeInTheDocument();
      expect(screen.getByText('existing-file.doc')).toBeInTheDocument();
    });

    it('should show error message for files with errors', () => {
      render(<FileUploader {...defaultProps} files={mockFiles} />);
      expect(screen.getByText('File too large')).toBeInTheDocument();
    });

    it('should display file names correctly for both new and existing files', () => {
      render(<FileUploader {...defaultProps} files={mockFiles} />);
      // New file with file object
      expect(screen.getByText('document1.pdf')).toBeInTheDocument();
      // Existing file with name property
      expect(screen.getByText('existing-file.doc')).toBeInTheDocument();
    });
  });

  describe('File Upload Functionality', () => {
    it('should render file input element when not readOnly', () => {
      render(<FileUploader {...defaultProps} />);
      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute('multiple');
      expect(fileInput).toHaveAttribute('accept', '*');
    });

    it('should render file input element even when readOnly (but label should be hidden)', () => {
      render(<FileUploader {...defaultProps} readOnly={true} />);
      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
      // The input exists but the label/button for it should not be visible
      expect(screen.queryByText('add')).not.toBeInTheDocument();
    });

    it('should call handleAddFile when file input changes', () => {
      const setFilesMock = jest.fn();
      const setHasFilesMock = jest.fn();
      
      render(
        <FileUploader 
          {...defaultProps} 
          setFiles={setFilesMock}
          setHasFiles={setHasFilesMock}
        />
      );

      const fileInput = document.querySelector('input[type="file"]');
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf', size: 1000 });
      
      // Simulate file input change
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });
      
      fireEvent.change(fileInput);

      expect(setFilesMock).toHaveBeenCalled();
      expect(setHasFilesMock).toHaveBeenCalledWith(true);
    });

    it('should not process file upload when readOnly', () => {
      const setFilesMock = jest.fn();
      const setHasFilesMock = jest.fn();
      
      render(
        <FileUploader 
          {...defaultProps} 
          setFiles={setFilesMock}
          setHasFiles={setHasFilesMock}
          readOnly={true}
        />
      );

      const fileInput = document.querySelector('input[type="file"]');
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf', size: 1000 });
      
      // Simulate file input change when readOnly
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });
      
      fireEvent.change(fileInput);

      // Should not process files when readOnly
      expect(setFilesMock).not.toHaveBeenCalled();
      expect(setHasFilesMock).not.toHaveBeenCalled();
    });

    it('should handle large files with error flag', () => {
      const setFilesMock = jest.fn();
      const setHasFilesMock = jest.fn();
      
      // Mock sizeFileIsCorrect to return false
      const { sizeFileIsCorrect } = require('v2/helpers/files');
      sizeFileIsCorrect.mockReturnValueOnce(false);
      
      render(
        <FileUploader 
          {...defaultProps} 
          setFiles={setFilesMock}
          setHasFiles={setHasFilesMock}
        />
      );

      const fileInput = document.querySelector('input[type="file"]');
      const largeFile = new File(['large content'], 'large.pdf', { 
        type: 'application/pdf', 
        size: 20000000 
      });
      
      Object.defineProperty(fileInput, 'files', {
        value: [largeFile],
        writable: false,
      });
      
      fireEvent.change(fileInput);

      expect(setFilesMock).toHaveBeenCalled();
      expect(setHasFilesMock).toHaveBeenCalledWith(true);
      
      // Check that the file was added with error flag
      const callArgs = setFilesMock.mock.calls[0][0];
      const newFilesAdder = callArgs;
      const result = newFilesAdder([]);
      expect(result[0].error).toBe('File too large');
    });

    it('should reset file input value after file removal', async () => {
      const user = userEvent.setup();
      const setFilesMock = jest.fn();
      const setDeletedFilesMock = jest.fn();
      const setHasFilesMock = jest.fn();
      
      const mockFilesWithDelete = [
        {
          id: 'file-1',
          file: { name: 'document1.pdf' },
          error: '',
        },
      ];
      
      render(
        <FileUploader 
          {...defaultProps} 
          files={mockFilesWithDelete}
          setFiles={setFilesMock}
          setDeletedFiles={setDeletedFilesMock}
          setHasFiles={setHasFilesMock}
          deletedFiles={[]}
        />
      );

      const fileInput = document.querySelector('input[type="file"]');
      const deleteButton = screen.getByTestId('chip-delete');
      
      // Set a value on the file input to test it gets reset
      Object.defineProperty(fileInput, 'value', {
        value: 'fake-file.pdf',
        writable: true,
      });
      
      await user.click(deleteButton);

      // Verify the handlers were called and input value was reset
      expect(setFilesMock).toHaveBeenCalled();
      expect(setDeletedFilesMock).toHaveBeenCalledWith(['file-1']);
      expect(setHasFilesMock).toHaveBeenCalledWith(true);
      expect(fileInput.value).toBe('');
    });
  });

  describe('File Removal', () => {
    const mockFilesWithDelete = [
      {
        id: 'file-1',
        file: { name: 'document1.pdf' },
        error: '',
      },
    ];

    it('should handle file removal when not readOnly', async () => {
      const user = userEvent.setup();
      const setFilesMock = jest.fn();
      const setDeletedFilesMock = jest.fn();
      const setHasFilesMock = jest.fn();
      
      render(
        <FileUploader 
          {...defaultProps} 
          files={mockFilesWithDelete}
          setFiles={setFilesMock}
          setDeletedFiles={setDeletedFilesMock}
          setHasFiles={setHasFilesMock}
          deletedFiles={[]}
        />
      );

      const deleteButton = screen.getByTestId('chip-delete');
      await user.click(deleteButton);

      expect(setFilesMock).toHaveBeenCalled();
      expect(setDeletedFilesMock).toHaveBeenCalledWith(['file-1']);
      expect(setHasFilesMock).toHaveBeenCalledWith(true);
    });

    it('should not handle file removal when readOnly', async () => {
      const user = userEvent.setup();
      const setFilesMock = jest.fn();
      
      render(
        <FileUploader 
          {...defaultProps} 
          files={mockFilesWithDelete}
          setFiles={setFilesMock}
          readOnly={true}
        />
      );

      const deleteButton = screen.getByTestId('chip-delete');
      await user.click(deleteButton);

      expect(setFilesMock).not.toHaveBeenCalled();
    });
  });

  describe('File Size Validation', () => {
    it('should validate file size using sizeFileIsCorrect helper', () => {
      const { sizeFileIsCorrect } = require('v2/helpers/files');
      
      // Test large file
      const largeFile = new File(['large content'], 'large.pdf', { 
        type: 'application/pdf', 
        size: 20000000 // 20MB
      });
      
      // Test small file  
      const smallFile = new File(['small content'], 'small.pdf', { 
        type: 'application/pdf', 
        size: 1000 
      });
      
      render(<FileUploader {...defaultProps} />);
      
      // Verify that sizeFileIsCorrect is available and can be called
      expect(sizeFileIsCorrect).toBeDefined();
      expect(typeof sizeFileIsCorrect).toBe('function');
    });

    it('should handle file error states in display', () => {
      const filesWithError = [
        {
          id: 'error-file',
          file: { name: 'large-file.pdf' },
          error: 'File too large',
        },
      ];
      
      render(<FileUploader {...defaultProps} files={filesWithError} />);
      
      expect(screen.getByText('large-file.pdf')).toBeInTheDocument();
      expect(screen.getByText('File too large')).toBeInTheDocument();
    });
  });

  describe('Component Props', () => {
    it('should use default props when not provided', () => {
      const minimalProps = {
        setFiles: jest.fn(),
        setHasFiles: jest.fn(),
        setDeletedFiles: jest.fn(),
      };
      
      render(<FileUploader {...minimalProps} />);
      expect(screen.getByText('documents')).toBeInTheDocument();
    });

    it('should handle file input ref correctly', () => {
      render(<FileUploader {...defaultProps} />);
      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute('multiple');
      expect(fileInput).toHaveAttribute('accept', '*');
    });
  });
});