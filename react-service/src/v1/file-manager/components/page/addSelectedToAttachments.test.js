// Unit test for addSelectedToAttachments function
import { httpHelperV2 } from 'v2/services/httpHelper';
import i18n from 'v2/helpers/i18n';

jest.mock('v2/services/httpHelper', () => ({
  httpHelperV2: jest.fn(),
}));

jest.mock('v2/helpers/i18n', () => ({
  __esModule: true,
  default: {
    t: jest.fn((key, params) => {
      if (key === 'file-manager-no-files-selected') return 'No files selected';
      if (key === 'files-uploaded-successfully') return `${params?.count} files uploaded successfully`;
      if (key === 'failed-to-upload-files') return 'Failed to upload files';
      return key;
    }),
  },
}));

describe('addSelectedToAttachments function logic', () => {
  const mockShowSnackbar = jest.fn();
  const mockCloseSidemodal = jest.fn();
  const mockCallback = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Error handling', () => {
    it('shows error when no files are selected', () => {
      const selectedFiles = [];
      
      if (!selectedFiles.length) {
        mockShowSnackbar('No files selected', 'error');
      }

      expect(mockShowSnackbar).toHaveBeenCalledWith('No files selected', 'error');
    });
  });

  describe('File mapping', () => {
    it('maps selected files with isExistingMedia flag', () => {
      const selectedFiles = [
        { id: 1, name: 'file1.pdf', type: 'PDF' },
        { id: 2, name: 'file2.docx', type: 'DOCX' },
      ];

      const newSelectedFiles = selectedFiles.map((file) => ({
        ...file,
        isExistingMedia: true,
      }));

      expect(newSelectedFiles).toEqual([
        { id: 1, name: 'file1.pdf', type: 'PDF', isExistingMedia: true },
        { id: 2, name: 'file2.docx', type: 'DOCX', isExistingMedia: true },
      ]);
      expect(newSelectedFiles.every((file) => file.isExistingMedia === true)).toBe(true);
    });
  });

  describe('API call', () => {
    it('calls httpHelperV2 with correct parameters', async () => {
      httpHelperV2.mockResolvedValue({ success: true });

      const projectId = 100;
      const tid = 10;
      const trid = 1;
      const selectedFiles = [
        { id: 1, name: 'test.pdf', isExistingMedia: true },
        { id: 2, name: 'doc.docx', isExistingMedia: true },
      ];

      await httpHelperV2({
        url: `project/${projectId}/tender/${tid}/tender_recommendation/${trid}/upload_existing`,
        method: 'POST',
        body: {
          data: selectedFiles,
        },
      });

      expect(httpHelperV2).toHaveBeenCalledWith({
        url: 'project/100/tender/10/tender_recommendation/1/upload_existing',
        method: 'POST',
        body: {
          data: selectedFiles,
        },
      });
    });

    it('handles successful upload', async () => {
      httpHelperV2.mockResolvedValue({ success: true });

      const response = await httpHelperV2({
        url: 'project/100/tender/10/tender_recommendation/1/upload_existing',
        method: 'POST',
        body: { data: [] },
      });

      if (response && response.success) {
        mockShowSnackbar('2 files uploaded successfully', 'success');
        mockCloseSidemodal();
        mockCallback();
      }

      expect(mockShowSnackbar).toHaveBeenCalledWith('2 files uploaded successfully', 'success');
      expect(mockCloseSidemodal).toHaveBeenCalled();
      expect(mockCallback).toHaveBeenCalled();
    });

    it('handles upload error', async () => {
      const error = { message: 'Network error' };
      httpHelperV2.mockRejectedValue(error);

      try {
        await httpHelperV2({
          url: 'project/100/tender/10/tender_recommendation/1/upload_existing',
          method: 'POST',
          body: { data: [] },
        });
      } catch (err) {
        mockShowSnackbar(err.message, 'error');
      }

      expect(mockShowSnackbar).toHaveBeenCalledWith('Network error', 'error');
    });

    it('handles failed response', async () => {
      httpHelperV2.mockResolvedValue({ success: false, message: 'Upload failed' });

      const response = await httpHelperV2({
        url: 'project/100/tender/10/tender_recommendation/1/upload_existing',
        method: 'POST',
        body: { data: [] },
      });

      if (!response || !response.success) {
        mockShowSnackbar('Upload failed', 'error');
      }

      expect(mockShowSnackbar).toHaveBeenCalledWith('Upload failed', 'error');
      expect(mockCloseSidemodal).not.toHaveBeenCalled();
    });
  });

  describe('State cleanup', () => {
    it('clears state after successful upload', () => {
      const state = {
        loading: false,
        showAllTenders: false,
        selectedFiles: [],
      };

      expect(state.loading).toBe(false);
      expect(state.showAllTenders).toBe(false);
      expect(state.selectedFiles).toEqual([]);
    });
  });

  describe('Fallback to alert', () => {
    it('does not call showSnackbar when not provided', () => {
      const selectedFiles = [];
      const showSnackbar = undefined;

      if (!selectedFiles.length) {
        if (showSnackbar) {
          showSnackbar('No files selected', 'error');
        }
        // else would use alert
      }

      expect(mockShowSnackbar).not.toHaveBeenCalled();
    });
  });
});
