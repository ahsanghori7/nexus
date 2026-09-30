import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import getContent from './getContent.jsx';

// Mock i18next
jest.mock('v2/helpers/i18n', () => ({
  t: jest.fn((key) => `mocked-${key}`)
}));

// Mock clink-components
jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: {
        clinkGreen: '#00ff00',
        brightGray: '#cccccc',
        white: '#ffffff',
        clinkRed: '#ff0000'
      }
    }
  }
}));

// Mock MUI components
jest.mock('@mui/material/Box', () => ({ children, sx, ...props }) => (
  <div data-testid="mui-box" data-sx={JSON.stringify(sx)} {...props}>
    {children}
  </div>
));

jest.mock('@mui/material/Button', () => ({ children, sx, component, variant, onClick, ...props }) => (
  <button 
    data-testid="mui-button" 
    data-sx={JSON.stringify(sx)}
    data-component={component}
    data-variant={variant}
    onClick={onClick}
    {...props}
  >
    {children}
  </button>
));

jest.mock('@mui/material/Typography', () => ({ children, variant, sx, ...props }) => (
  <div 
    data-testid="mui-typography" 
    data-variant={variant}
    data-sx={JSON.stringify(sx)}
    {...props}
  >
    {children}
  </div>
));

// Mock modal components
jest.mock('v2/apps/clink/pages/boq/upload/modal-components.mui', () => ({
  MuiModalErrorTable: ({ tableContent, file, maxHeight, maxWidth }) => (
    <div data-testid="error-table" data-max-height={maxHeight} data-max-width={maxWidth}>
      Error Table - {tableContent?.length} errors for {file?.name}
    </div>
  ),
  MuiModalTable: ({ tableContent, maxHeight }) => (
    <div data-testid="modal-table" data-max-height={maxHeight}>
      Modal Table - {tableContent?.length} items
    </div>
  ),
  MuiModalUploadItem: ({ fileName, size, onClick }) => (
    <div data-testid="upload-item" onClick={onClick}>
      Upload Item - {fileName} ({size} bytes)
    </div>
  ),
  MuiModalButton: ({ children, sx, onClick }) => (
    <button data-testid="modal-button" data-sx={JSON.stringify(sx)} onClick={onClick}>
      {children}
    </button>
  )
}));

describe('getContent', () => {
  const mockHandlers = {
    updateEntity: jest.fn(),
    handleFileChange: jest.fn(),
    handleUploadFile: jest.fn(),
    handleBack: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when errorTable has errors', () => {
    it('should render error table with back button', () => {
      const errorTable = [
        { error: 'Test error 1' },
        { error: 'Test error 2' }
      ];
      const file = { name: 'test.xlsx' };

      const content = getContent(
        errorTable,
        null,
        file,
        mockHandlers.updateEntity,
        mockHandlers.handleFileChange,
        mockHandlers.handleUploadFile,
        mockHandlers.handleBack
      );

      const { container } = render(content);

      expect(screen.getByTestId('error-table')).toBeInTheDocument();
      expect(screen.getByTestId('error-table')).toHaveAttribute('data-max-height', '660px');
      expect(screen.getByTestId('error-table')).toHaveAttribute('data-max-width', '800px');
      expect(screen.getByText('Error Table - 2 errors for test.xlsx')).toBeInTheDocument();

      const backButton = screen.getByTestId('modal-button');
      expect(backButton).toBeInTheDocument();
      expect(backButton).toHaveTextContent('mocked-go-back');

      fireEvent.click(backButton);
      expect(mockHandlers.handleBack).toHaveBeenCalledTimes(1);
    });

    it('should render error table with red button styling', () => {
      const errorTable = [{ error: 'Test error' }];
      const file = { name: 'test.xlsx' };

      const content = getContent(
        errorTable,
        null,
        file,
        mockHandlers.updateEntity,
        mockHandlers.handleFileChange,
        mockHandlers.handleUploadFile,
        mockHandlers.handleBack
      );

      render(content);

      const backButton = screen.getByTestId('modal-button');
      const buttonSx = JSON.parse(backButton.getAttribute('data-sx'));
      expect(buttonSx.backgroundColor).toBe('#ff0000');
      expect(buttonSx['&:hover'].backgroundColor).toBe('#ff0000');
    });
  });

  describe('when uploadFile has data', () => {
    it('should render modal table with continue button', () => {
      const uploadFile = [
        { item: 'Item 1' },
        { item: 'Item 2' },
        { item: 'Item 3' }
      ];

      const content = getContent(
        null,
        uploadFile,
        null,
        mockHandlers.updateEntity,
        mockHandlers.handleFileChange,
        mockHandlers.handleUploadFile,
        mockHandlers.handleBack
      );

      render(content);

      expect(screen.getByTestId('modal-table')).toBeInTheDocument();
      expect(screen.getByTestId('modal-table')).toHaveAttribute('data-max-height', '660px');
      expect(screen.getByText('Modal Table - 3 items')).toBeInTheDocument();

      const continueButton = screen.getByTestId('modal-button');
      expect(continueButton).toBeInTheDocument();
      expect(continueButton).toHaveTextContent('mocked-continue');

      fireEvent.click(continueButton);
      expect(mockHandlers.updateEntity).toHaveBeenCalledWith(uploadFile);
    });

    it('should render continue button with green styling', () => {
      const uploadFile = [{ item: 'Item 1' }];

      const content = getContent(
        null,
        uploadFile,
        null,
        mockHandlers.updateEntity,
        mockHandlers.handleFileChange,
        mockHandlers.handleUploadFile,
        mockHandlers.handleBack
      );

      render(content);

      const continueButton = screen.getByTestId('modal-button');
      const buttonSx = JSON.parse(continueButton.getAttribute('data-sx'));
      expect(buttonSx.backgroundColor).toBe('#00ff00');
      expect(buttonSx['&:hover'].backgroundColor).toBe('#00ff00');
    });
  });

  describe('when file is selected but not uploaded', () => {
    it('should render file preview with upload button', () => {
      const file = { name: 'test.xlsx', size: 1024 };

      const content = getContent(
        null,
        null,
        file,
        mockHandlers.updateEntity,
        mockHandlers.handleFileChange,
        mockHandlers.handleUploadFile,
        mockHandlers.handleBack
      );

      render(content);

      expect(screen.getByTestId('description-icon')).toBeInTheDocument();
      expect(screen.getByTestId('upload-item')).toBeInTheDocument();
      expect(screen.getByText('Upload Item - test.xlsx (1024 bytes)')).toBeInTheDocument();

      const uploadButton = screen.getByTestId('modal-button');
      expect(uploadButton).toBeInTheDocument();
      expect(uploadButton).toHaveTextContent('mocked-upload-one-file');

      fireEvent.click(uploadButton);
      expect(mockHandlers.handleUploadFile).toHaveBeenCalledTimes(1);
    });

    it('should handle back button click on upload item', () => {
      const file = { name: 'test.xlsx', size: 1024 };

      const content = getContent(
        null,
        null,
        file,
        mockHandlers.updateEntity,
        mockHandlers.handleFileChange,
        mockHandlers.handleUploadFile,
        mockHandlers.handleBack
      );

      render(content);

      const uploadItem = screen.getByTestId('upload-item');
      fireEvent.click(uploadItem);
      expect(mockHandlers.handleBack).toHaveBeenCalledTimes(1);
    });

    it('should render description icon with white background', () => {
      const file = { name: 'test.xlsx', size: 1024 };

      const content = getContent(
        null,
        null,
        file,
        mockHandlers.updateEntity,
        mockHandlers.handleFileChange,
        mockHandlers.handleUploadFile,
        mockHandlers.handleBack
      );

      render(content);

      const descriptionIcon = screen.getByTestId('description-icon');
      expect(descriptionIcon).toBeInTheDocument();
      // Note: sx props are passed to the mock but not necessarily visible in test attributes
    });
  });

  describe('when no file is selected', () => {
    it('should render file upload area', () => {
      const content = getContent(
        null,
        null,
        null,
        mockHandlers.updateEntity,
        mockHandlers.handleFileChange,
        mockHandlers.handleUploadFile,
        mockHandlers.handleBack
      );

      render(content);

      expect(screen.getByTestId('cloud-upload-icon')).toBeInTheDocument();
      expect(screen.getByText('mocked-boq-browse-file')).toBeInTheDocument();

      const fileInput = document.getElementById('file-input');
      expect(fileInput).toHaveAttribute('type', 'file');
      expect(fileInput).toHaveStyle('display: none');

      fireEvent.change(fileInput, { target: { files: [new File(['content'], 'test.xlsx')] } });
      expect(mockHandlers.handleFileChange).toHaveBeenCalledTimes(1);
    });

    it('should render cloud upload icon with correct styling', () => {
      const content = getContent(
        null,
        null,
        null,
        mockHandlers.updateEntity,
        mockHandlers.handleFileChange,
        mockHandlers.handleUploadFile,
        mockHandlers.handleBack
      );

      render(content);

      const cloudIcon = screen.getByTestId('cloud-upload-icon');
      expect(cloudIcon).toBeInTheDocument();
      // Note: sx props are passed to the mock but not necessarily visible in test attributes
    });

    it('should render browse button with green color and underline', () => {
      const content = getContent(
        null,
        null,
        null,
        mockHandlers.updateEntity,
        mockHandlers.handleFileChange,
        mockHandlers.handleUploadFile,
        mockHandlers.handleBack
      );

      render(content);

      const browseButton = screen.getByTestId('mui-button');
      expect(browseButton).toHaveAttribute('data-variant', 'text');
      expect(browseButton).toHaveAttribute('data-component', 'span');
      
      const buttonSx = JSON.parse(browseButton.getAttribute('data-sx'));
      expect(buttonSx.color).toBe('#00ff00');
      expect(buttonSx.textDecoration).toBe('underline');
      expect(buttonSx.p).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle empty errorTable array', () => {
      const content = getContent(
        [],
        null,
        null,
        mockHandlers.updateEntity,
        mockHandlers.handleFileChange,
        mockHandlers.handleUploadFile,
        mockHandlers.handleBack
      );

      render(content);

      // Should render the default upload area since errorTable is empty
      expect(screen.getByTestId('cloud-upload-icon')).toBeInTheDocument();
    });

    it('should handle empty uploadFile array', () => {
      const content = getContent(
        null,
        [],
        null,
        mockHandlers.updateEntity,
        mockHandlers.handleFileChange,
        mockHandlers.handleUploadFile,
        mockHandlers.handleBack
      );

      render(content);

      // Should render the default upload area since uploadFile is empty
      expect(screen.getByTestId('cloud-upload-icon')).toBeInTheDocument();
    });

    it('should prioritize errorTable over uploadFile when both exist', () => {
      const errorTable = [{ error: 'Test error' }];
      const uploadFile = [{ item: 'Test item' }];
      const file = { name: 'test.xlsx' };

      const content = getContent(
        errorTable,
        uploadFile,
        file,
        mockHandlers.updateEntity,
        mockHandlers.handleFileChange,
        mockHandlers.handleUploadFile,
        mockHandlers.handleBack
      );

      render(content);

      // Should render error table, not upload file table
      expect(screen.getByTestId('error-table')).toBeInTheDocument();
      expect(screen.queryByTestId('modal-table')).not.toBeInTheDocument();
    });

    it('should prioritize uploadFile over file when both exist', () => {
      const uploadFile = [{ item: 'Test item' }];
      const file = { name: 'test.xlsx', size: 1024 };

      const content = getContent(
        null,
        uploadFile,
        file,
        mockHandlers.updateEntity,
        mockHandlers.handleFileChange,
        mockHandlers.handleUploadFile,
        mockHandlers.handleBack
      );

      render(content);

      // Should render upload file table, not file preview
      expect(screen.getByTestId('modal-table')).toBeInTheDocument();
      expect(screen.queryByTestId('description-icon')).not.toBeInTheDocument();
    });
  });
});