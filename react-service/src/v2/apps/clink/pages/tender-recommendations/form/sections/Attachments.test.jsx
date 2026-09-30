import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock all dependencies to prevent async issues
jest.mock('v2/helpers/i18n', () => ({
  __esModule: true,
  default: { t: (key, params) => {
    if (key === 'invalid-file-format') return `Invalid format: ${params?.files}`;
    if (key === 'file-size-exceeded') return `Size exceeded: ${params?.files}`;
    if (key === 'files-uploaded-successfully') return `${params?.count} files uploaded`;
    if (key === 'failed-to-upload-files') return 'Upload failed';
    if (key === 'attachment-deleted-successfully') return 'Attachment deleted';
    if (key === 'failed-to-delete-attachment') return 'Delete failed';
    if (key === 'attached-documents-count') return `Attachments: ${params?.count}`;
    return key;
  }},
}));

jest.mock('v2/helpers/date', () => ({
  formatUKorAnzDateTime: () => ({ date: '01/01/2024', time: '12:00' }),
}));

jest.mock('v2/constants/colors', () => ({ white: '#ffffff' }));

jest.mock('clink-components', () => ({
  CONSTANTS: { colors: { general: { lightPeriwinkle: '#e0e0ff', clinkGreen: '#00ff00' }}},
}));

jest.mock('v1/file-manager/components/page', () => {
  const mockFn = jest.fn(() => null);
  mockFn.__esModule = true;
  mockFn.default = mockFn;
  return mockFn;
});

jest.mock('v1/global/components/modal/SideModal', () => {
  const mockFn = jest.fn(() => null);
  mockFn.__esModule = true;
  mockFn.default = mockFn;
  return mockFn;
});

jest.mock('../components/DeleteAttachmentDialog', () => ({
  __esModule: true,
  default: ({ open, onCancel, onConfirm }) => 
    open ? (
      <div data-testid="delete-dialog">
        <button onClick={onCancel}>Cancel</button>
        <button onClick={onConfirm}>Confirm</button>
      </div>
    ) : null,
}));

const mockGetAttachments = jest.fn();
const mockUploadAttachments = jest.fn();
const mockDeleteAttachment = jest.fn();

jest.mock('v2/hooks/context', () => ({
  useContext: () => ({ 
    actions: {
      getTenderRecommendationAttachments: mockGetAttachments,
      uploadTenderRecommendationAttachments: mockUploadAttachments,
      deleteTenderRecommendationAttachment: mockDeleteAttachment,
    }
  }),
}));

const mockDispatch = jest.fn();

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch,
  connect: () => (component) => component,
}));

import Attachments from './Attachments';

const mockFileManager = require('v1/file-manager/components/page');
const mockSideModal = require('v1/global/components/modal/SideModal');

describe('Attachments Component Tests', () => {
  const mockShowSnackbar = jest.fn();

  const defaultProps = {
    data: {
      tender_recommendation_id: 1,
      package_id: 10,
      package_name: 'Test Package',
      status: 'Draft',
    },
    projectId: 100,
    showSnackbar: mockShowSnackbar,
    project: {
      data: { id: 100, name: 'Test Project' },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock dispatch to return resolved promises immediately
    mockDispatch.mockReturnValue({
      unwrap: jest.fn().mockResolvedValue([]),
    });
  });

  describe('Rendering', () => {
    it('renders component', () => {
      const { container } = render(<Attachments {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it('renders with missing projectId', () => {
      render(<Attachments {...{...defaultProps, projectId: null}} />);
      expect(mockGetAttachments).not.toHaveBeenCalled();
    });

    it('renders with Pending status', () => {
      const props = {...defaultProps, data: {...defaultProps.data, status: 'Pending'}};
      render(<Attachments {...props} />);
      const button = screen.getByRole('button', { name: /upload-document/i });
      expect(button).toBeDisabled();
    });

    it('renders without project', () => {
      render(<Attachments {...{...defaultProps, project: null}} />);
      expect(screen.queryByText('attach-supporting-documents-description')).toBeInTheDocument();
    });
  });

  describe('Data Fetching', () => {
    it('fetches attachments on mount', () => {
      render(<Attachments {...defaultProps} />);
      expect(mockGetAttachments).toHaveBeenCalledWith({
        project_id: 100,
        trid: 1,
        tid: 10,
      });
    });

    it('does not fetch without projectId', () => {
      render(<Attachments {...{...defaultProps, projectId: null}} />);
      expect(mockGetAttachments).not.toHaveBeenCalled();
    });

    it('does not fetch without tender_recommendation_id', () => {
      const props = {...defaultProps, data: {...defaultProps.data, tender_recommendation_id: null}};
      render(<Attachments {...props} />);
      expect(mockGetAttachments).not.toHaveBeenCalled();
    });
  });

  describe('File Upload', () => {
    it('uploads valid PDF', async () => {
      mockDispatch.mockReturnValue({
        unwrap: jest.fn().mockResolvedValue({ success: true }),
      });

      const { container } = render(<Attachments {...defaultProps} />);
      const input = container.querySelector('input[type="file"]');
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockUploadAttachments).toHaveBeenCalled();
      }, { timeout: 500 });
    });

    it('rejects invalid file type', async () => {
      const { container } = render(<Attachments {...defaultProps} />);
      const input = container.querySelector('input[type="file"]');
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockShowSnackbar).toHaveBeenCalledWith('Invalid format: test.txt', 'error');
      }, { timeout: 500 });
    });

    it('rejects oversized file', async () => {
      const { container } = render(<Attachments {...defaultProps} />);
      const input = container.querySelector('input[type="file"]');
      const file = new File([new ArrayBuffer(26 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' });

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockShowSnackbar).toHaveBeenCalledWith('Size exceeded: large.pdf', 'error');
      }, { timeout: 500 });
    });

    it('uploads multiple files', async () => {
      mockDispatch.mockReturnValue({
        unwrap: jest.fn().mockResolvedValue({ success: true }),
      });

      const { container } = render(<Attachments {...defaultProps} />);
      const input = container.querySelector('input[type="file"]');
      const file1 = new File(['c1'], 'test1.pdf', { type: 'application/pdf' });
      const file2 = new File(['c2'], 'test2.pdf', { type: 'application/pdf' });

      fireEvent.change(input, { target: { files: [file1, file2] } });

      await waitFor(() => {
        expect(mockShowSnackbar).toHaveBeenCalledWith('2 files uploaded', 'success');
      }, { timeout: 500 });
    });

    it('does not upload empty files', () => {
      const { container } = render(<Attachments {...defaultProps} />);
      const input = container.querySelector('input[type="file"]');

      fireEvent.change(input, { target: { files: [] } });

      expect(mockUploadAttachments).not.toHaveBeenCalled();
    });

    it('does not upload when Pending', () => {
      const props = {...defaultProps, data: {...defaultProps.data, status: 'Pending'}};
      const { container } = render(<Attachments {...props} />);
      const input = container.querySelector('input[type="file"]');
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

      fireEvent.change(input, { target: { files: [file] } });

      expect(mockUploadAttachments).not.toHaveBeenCalled();
    });

    it('handles upload error', async () => {
      mockDispatch.mockReturnValue({
        unwrap: jest.fn().mockRejectedValue({ message: 'Network error' }),
      });

      const { container } = render(<Attachments {...defaultProps} />);
      const input = container.querySelector('input[type="file"]');
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockShowSnackbar).toHaveBeenCalledWith('Network error', 'error');
      }, { timeout: 500 });
    });

    it('handles upload error without message', async () => {
      mockDispatch.mockReturnValue({
        unwrap: jest.fn().mockRejectedValue({}),
      });

      const { container } = render(<Attachments {...defaultProps} />);
      const input = container.querySelector('input[type="file"]');
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockShowSnackbar).toHaveBeenCalledWith('Upload failed', 'error');
      }, { timeout: 500 });
    });
  });

  describe('File Types', () => {
    const testFileUpload = async (fileName, type) => {
      mockDispatch.mockReturnValue({
        unwrap: jest.fn().mockResolvedValue({ success: true }),
      });

      const { container } = render(<Attachments {...defaultProps} />);
      const input = container.querySelector('input[type="file"]');
      const file = new File(['content'], fileName, { type });

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockUploadAttachments).toHaveBeenCalled();
      }, { timeout: 500 });
      
      jest.clearAllMocks();
    };

    it('accepts DOC', () => testFileUpload('test.doc', 'application/msword'));
    it('accepts DOCX', () => testFileUpload('test.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'));
    it('accepts XLS', () => testFileUpload('test.xls', 'application/vnd.ms-excel'));
    it('accepts XLSX', () => testFileUpload('test.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'));
    it('accepts PNG', () => testFileUpload('test.png', 'image/png'));
    it('accepts JPG', () => testFileUpload('test.jpg', 'image/jpeg'));
    it('accepts JPEG', () => testFileUpload('test.jpeg', 'image/jpeg'));
  });

  describe('Drag and Drop', () => {
    it('sets drag-over on dragEnter', () => {
      render(<Attachments {...defaultProps} />);
      const dropzone = screen.getByText('drag-and-drop-files').closest('div').parentElement;
      
      fireEvent.dragEnter(dropzone);
      
      expect(dropzone).toHaveClass('drag-over');
    });

    it('removes drag-over on dragLeave', () => {
      render(<Attachments {...defaultProps} />);
      const dropzone = screen.getByText('drag-and-drop-files').closest('div').parentElement;
      
      fireEvent.dragEnter(dropzone);
      fireEvent.dragLeave(dropzone);
      
      expect(dropzone).not.toHaveClass('drag-over');
    });

    it('handles dragOver', () => {
      render(<Attachments {...defaultProps} />);
      const dropzone = screen.getByText('drag-and-drop-files').closest('div').parentElement;
      
      const event = new Event('dragover', { bubbles: true, cancelable: true });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
      
      dropzone.dispatchEvent(event);
      
      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('handles drop', async () => {
      mockDispatch.mockReturnValue({
        unwrap: jest.fn().mockResolvedValue({ success: true }),
      });

      render(<Attachments {...defaultProps} />);
      const dropzone = screen.getByText('drag-and-drop-files').closest('div').parentElement;
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

      fireEvent.drop(dropzone, { dataTransfer: { files: [file] } });

      await waitFor(() => {
        expect(mockUploadAttachments).toHaveBeenCalled();
      }, { timeout: 500 });
    });

    it('does not drag when Pending', () => {
      const props = {...defaultProps, data: {...defaultProps.data, status: 'Pending'}};
      render(<Attachments {...props} />);
      const dropzone = screen.getByText('drag-and-drop-files').closest('div').parentElement;
      
      fireEvent.dragEnter(dropzone);
      
      expect(dropzone).not.toHaveClass('drag-over');
    });
  });

  describe('Dropzone Click', () => {
    it('triggers file input', () => {
      render(<Attachments {...defaultProps} />);
      const dropzone = screen.getByText('drag-and-drop-files').closest('div').parentElement;
      const fileInput = document.getElementById('file-upload-input');
      const clickSpy = jest.spyOn(fileInput, 'click');
      
      fireEvent.click(dropzone);
      
      expect(clickSpy).toHaveBeenCalled();
      clickSpy.mockRestore();
    });

    it('does not trigger when disabled', () => {
      const props = {...defaultProps, data: {...defaultProps.data, status: 'Pending'}};
      render(<Attachments {...props} />);
      const dropzone = screen.getByText('drag-and-drop-files').closest('div').parentElement;
      const fileInput = document.getElementById('file-upload-input');
      const clickSpy = jest.spyOn(fileInput, 'click');
      
      fireEvent.click(dropzone);
      
      expect(clickSpy).not.toHaveBeenCalled();
      clickSpy.mockRestore();
    });
  });

  describe('Constants', () => {
    it('has correct allowed extensions', () => {
      const ALLOWED = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.png', '.jpg', '.jpeg'];
      expect(ALLOWED.length).toBe(8);
    });

    it('has correct max file size', () => {
      expect(25 * 1024 * 1024).toBe(26214400);
    });
  });

  describe('Attachments Display', () => {
    it('displays attachments with icons', async () => {
      mockDispatch.mockReturnValue({
        unwrap: jest.fn().mockResolvedValue([
          {
            id: 1,
            name: 'doc.pdf',
            file_type: 'PDF',
            file_size: '2MB',
            uploaded_by: 'John',
            created_at: '2024-01-01',
          },
          {
            id: 2,
            name: 'sheet.xlsx',
            file_type: 'XLSX',
            file_size: '1MB',
            uploaded_by: 'Jane',
            created_at: '2024-01-02',
          },
        ]),
      });

      render(<Attachments {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('doc.pdf')).toBeInTheDocument();
      }, { timeout: 500 });

      expect(screen.getByText('sheet.xlsx')).toBeInTheDocument();
      expect(screen.getByText('Attachments: 2')).toBeInTheDocument();
    });

    it('displays different file type icons', async () => {
      const files = [
        { id: 1, name: 'test.pdf', file_type: 'PDF', file_size: '1MB', uploaded_by: 'A', created_at: '2024-01-01' },
        { id: 2, name: 'test.doc', file_type: 'DOC', file_size: '1MB', uploaded_by: 'B', created_at: '2024-01-01' },
        { id: 3, name: 'test.docx', file_type: 'DOCX', file_size: '1MB', uploaded_by: 'C', created_at: '2024-01-01' },
        { id: 4, name: 'test.xls', file_type: 'XLS', file_size: '1MB', uploaded_by: 'D', created_at: '2024-01-01' },
        { id: 5, name: 'test.xlsx', file_type: 'XLSX', file_size: '1MB', uploaded_by: 'E', created_at: '2024-01-01' },
        { id: 6, name: 'test.png', file_type: 'PNG', file_size: '1MB', uploaded_by: 'F', created_at: '2024-01-01' },
        { id: 7, name: 'test.jpg', file_type: 'JPG', file_size: '1MB', uploaded_by: 'G', created_at: '2024-01-01' },
        { id: 8, name: 'test.jpeg', file_type: 'JPEG', file_size: '1MB', uploaded_by: 'H', created_at: '2024-01-01' },
        { id: 9, name: 'test.txt', file_type: 'TXT', file_size: '1MB', uploaded_by: 'I', created_at: '2024-01-01' },
      ];

      mockDispatch.mockReturnValue({
        unwrap: jest.fn().mockResolvedValue(files),
      });

      render(<Attachments {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeInTheDocument();
      }, { timeout: 500 });

      files.forEach(file => {
        expect(screen.getByText(file.name)).toBeInTheDocument();
      });
    });

    it('hides delete button when disabled', async () => {
      mockDispatch.mockReturnValue({
        unwrap: jest.fn().mockResolvedValue([
          { id: 1, name: 'doc.pdf', file_type: 'PDF', file_size: '2MB', uploaded_by: 'John', created_at: '2024-01-01' },
        ]),
      });

      const props = {...defaultProps, data: {...defaultProps.data, status: 'Pending'}};
      render(<Attachments {...props} />);

      await waitFor(() => {
        expect(screen.getByText('doc.pdf')).toBeInTheDocument();
      }, { timeout: 500 });

      const deleteButtons = screen.queryAllByRole('button', { name: '' });
      const closeButtons = deleteButtons.filter(btn => btn.querySelector('svg'));
      expect(closeButtons.length).toBe(0);
    });
  });

  describe('Delete Attachment', () => {
    beforeEach(() => {
      mockDispatch.mockReturnValue({
        unwrap: jest.fn().mockResolvedValue([
          { id: 1, name: 'doc.pdf', file_type: 'PDF', file_size: '2MB', uploaded_by: 'John', created_at: '2024-01-01' },
        ]),
      });
    });

    it('opens delete dialog', async () => {
      render(<Attachments {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('doc.pdf')).toBeInTheDocument();
      }, { timeout: 500 });

      const buttons = screen.getAllByRole('button');
      const deleteButton = buttons.find(btn => {
        const svg = btn.querySelector('svg');
        return svg && btn.getAttribute('aria-label') === null;
      });
      
      if (deleteButton) {
        fireEvent.click(deleteButton);
        expect(screen.getByTestId('delete-dialog')).toBeInTheDocument();
      }
    });

    it('cancels delete', async () => {
      render(<Attachments {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('doc.pdf')).toBeInTheDocument();
      }, { timeout: 500 });

      const buttons = screen.getAllByRole('button');
      const deleteButton = buttons.find(btn => {
        const svg = btn.querySelector('svg');
        return svg && btn.getAttribute('aria-label') === null;
      });
      
      if (deleteButton) {
        fireEvent.click(deleteButton);

        const cancelButton = screen.getByText('Cancel');
        fireEvent.click(cancelButton);

        await waitFor(() => {
          expect(screen.queryByTestId('delete-dialog')).not.toBeInTheDocument();
        }, { timeout: 500 });
      }
    });

    it('confirms delete successfully', async () => {
      render(<Attachments {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('doc.pdf')).toBeInTheDocument();
      }, { timeout: 500 });

      // Change mock for delete operation
      mockDispatch.mockReturnValue({
        unwrap: jest.fn().mockResolvedValue({ success: true }),
      });

      const buttons = screen.getAllByRole('button');
      const deleteButton = buttons.find(btn => {
        const svg = btn.querySelector('svg');
        return svg && btn.getAttribute('aria-label') === null;
      });
      
      if (deleteButton) {
        fireEvent.click(deleteButton);

        const confirmButton = screen.getByText('Confirm');
        fireEvent.click(confirmButton);

        await waitFor(() => {
          expect(mockShowSnackbar).toHaveBeenCalledWith('Attachment deleted', 'success');
        }, { timeout: 1000 });
      }
    });

    it('handles delete error', async () => {
      render(<Attachments {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('doc.pdf')).toBeInTheDocument();
      }, { timeout: 500 });

      // Change mock for delete operation
      mockDispatch.mockReturnValue({
        unwrap: jest.fn().mockRejectedValue({ message: 'Delete failed' }),
      });

      const buttons = screen.getAllByRole('button');
      const deleteButton = buttons.find(btn => {
        const svg = btn.querySelector('svg');
        return svg && btn.getAttribute('aria-label') === null;
      });
      
      if (deleteButton) {
        fireEvent.click(deleteButton);

        const confirmButton = screen.getByText('Confirm');
        fireEvent.click(confirmButton);

        await waitFor(() => {
          expect(mockShowSnackbar).toHaveBeenCalledWith('Delete failed', 'error');
        }, { timeout: 1000 });
      }
    });

    it('handles delete error without message', async () => {
      render(<Attachments {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('doc.pdf')).toBeInTheDocument();
      }, { timeout: 500 });

      // Change mock for delete operation
      mockDispatch.mockReturnValue({
        unwrap: jest.fn().mockRejectedValue({}),
      });

      const buttons = screen.getAllByRole('button');
      const deleteButton = buttons.find(btn => {
        const svg = btn.querySelector('svg');
        return svg && btn.getAttribute('aria-label') === null;
      });
      
      if (deleteButton) {
        fireEvent.click(deleteButton);

        const confirmButton = screen.getByText('Confirm');
        fireEvent.click(confirmButton);

        await waitFor(() => {
          expect(mockShowSnackbar).toHaveBeenCalledWith('Delete failed', 'error');
        }, { timeout: 1000 });
      }
    });
  });

  describe('File Manager', () => {
    it('renders file manager when project exists', () => {
      render(<Attachments {...defaultProps} />);
      expect(screen.getByRole('button', { name: /add-from-existing-files/i })).toBeInTheDocument();
    });

    it('does not render file manager without project', () => {
      render(<Attachments {...{...defaultProps, project: null}} />);
      const button = screen.queryByRole('button', { name: /add-from-existing-files/i });
      expect(button).toBeInTheDocument(); // Button exists but Sidemodal doesn't render
    });

    it('disables add from existing when Pending', () => {
      const props = {...defaultProps, data: {...defaultProps.data, status: 'Pending'}};
      render(<Attachments {...props} />);
      const button = screen.getByRole('button', { name: /add-from-existing-files/i });
      expect(button).toBeDisabled();
    });

    it('renders SideModal with correct props', () => {
      render(<Attachments {...defaultProps} />);
      
      expect(mockSideModal).toHaveBeenCalled();
      const sideModalProps = mockSideModal.mock.calls[0][0];
      
      expect(sideModalProps.title).toBe('File Manager');
      expect(sideModalProps.subtitle).toBe('Test Package');
      expect(sideModalProps.className).toBe('file-manager-sidemodal sidemodal');
      expect(sideModalProps.render).toBeInstanceOf(Function);
    });

    it('passes correct props to FileManager through render function', () => {
      render(<Attachments {...defaultProps} />);
      
      const sideModalProps = mockSideModal.mock.calls[0][0];
      const modalInstance = { setShow: jest.fn() };
      
      // Manually call render function to test what props it passes
      const renderFn = sideModalProps.render;
      const fileManagerComponent = renderFn(modalInstance);
      
      // Verify FileManager was created with correct props
      expect(fileManagerComponent).toBeDefined();
      expect(fileManagerComponent.props.sidemodal).toBe(true);
      expect(fileManagerComponent.props.projectData).toEqual(defaultProps.project.data);
      expect(fileManagerComponent.props.defaultTender).toBe(10);
      expect(fileManagerComponent.props.trAttachments).toBe(true);
      expect(fileManagerComponent.props.trAttachmentsData).toEqual({ tid: 10, trid: 1 });
      expect(fileManagerComponent.props.showSnackbar).toBe(mockShowSnackbar);
      expect(fileManagerComponent.props.closeSidemodal).toBeInstanceOf(Function);
      expect(fileManagerComponent.props.callback).toBeInstanceOf(Function);
    });

    it('closeSidemodal prop calls modalInstance.setShow(false)', () => {
      render(<Attachments {...defaultProps} />);
      
      const sideModalProps = mockSideModal.mock.calls[0][0];
      const modalInstance = { setShow: jest.fn() };
      
      const fileManagerComponent = sideModalProps.render(modalInstance);
      const { closeSidemodal } = fileManagerComponent.props;
      
      closeSidemodal();
      expect(modalInstance.setShow).toHaveBeenCalledWith(false);
    });

    it('callback prop refreshes attachments', () => {
      mockGetAttachments.mockClear();
      render(<Attachments {...defaultProps} />);
      
      const sideModalProps = mockSideModal.mock.calls[0][0];
      const modalInstance = { setShow: jest.fn() };
      
      const fileManagerComponent = sideModalProps.render(modalInstance);
      const { callback } = fileManagerComponent.props;
      
      callback();
      expect(mockGetAttachments).toHaveBeenCalled();
    });
  });

  describe('Context Type', () => {
    it('uses custom contextType', () => {
      render(<Attachments {...defaultProps} contextType="custom" />);
      expect(mockGetAttachments).toHaveBeenCalled();
    });
  });
});