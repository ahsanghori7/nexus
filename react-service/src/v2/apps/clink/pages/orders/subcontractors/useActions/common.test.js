import {
  viewQuoteFile,
  modalAsyncAction,
  handleOpenNewTab,
  viewLogOption,
} from './common';

// Mock the URL helper
jest.mock('v2/helpers/url', () => ({
  goToNewTab: jest.fn(),
}));

const { goToNewTab } = require('v2/helpers/url');

describe('useActions Common', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('viewLogOption', () => {
    it('should return a valid action object', () => {
      const mockHandleLogModal = jest.fn();
      const mockLogs = ['log1', 'log2'];
      
      const result = viewLogOption(mockHandleLogModal, mockLogs);
      
      expect(result).toHaveProperty('name', 'View Log');
      expect(result).toHaveProperty('action');
      expect(typeof result.action).toBe('function');
    });

    it('should call handleLogModal with logs when action is executed', () => {
      const mockHandleLogModal = jest.fn();
      const mockLogs = ['log1', 'log2'];
      
      const result = viewLogOption(mockHandleLogModal, mockLogs);
      result.action();
      
      expect(mockHandleLogModal).toHaveBeenCalledWith(mockLogs);
    });
  });

  describe('viewQuoteFile', () => {
    it('should return a valid action object', () => {
      const mockSetOpen = jest.fn();
      const mockClose = jest.fn();
      
      const result = viewQuoteFile('http://example.com', mockSetOpen, mockClose);
      
      expect(result).toHaveProperty('name', 'view-quote-file');
      expect(result).toHaveProperty('action');
      expect(typeof result.action).toBe('function');
    });

    it('should open new tab when quotesFilesUrl is provided', () => {
      const mockSetOpen = jest.fn();
      const mockClose = jest.fn();
      const testUrl = 'http://example.com/file.pdf';
      
      const result = viewQuoteFile(testUrl, mockSetOpen, mockClose);
      result.action();
      
      expect(goToNewTab).toHaveBeenCalledWith(testUrl);
      expect(mockSetOpen).not.toHaveBeenCalled();
    });

    it('should set open modal when quotesFilesUrl is not provided', () => {
      const mockSetOpen = jest.fn();
      const mockClose = jest.fn();
      
      const result = viewQuoteFile(null, mockSetOpen, mockClose);
      result.action();
      
      expect(goToNewTab).not.toHaveBeenCalled();
      expect(mockSetOpen).toHaveBeenCalledWith({
        id: 'view-quotes-draft-order',
        navTitle: 'warning',
        title: 'documents-not-found',
        cancel: 'cancel',
        confirm: 'confirm',
        description: 'documents-not-found-desc',
        handleAccept: mockClose,
      });
    });
  });

  describe('modalAsyncAction', () => {
    it('should return a valid action object with default parameters', () => {
      const mockSetOpen = jest.fn();
      const mockHandleAccept = jest.fn();
      
      const result = modalAsyncAction(mockSetOpen, mockHandleAccept);
      
      expect(result).toHaveProperty('name', 'withdraw-order');
      expect(result).toHaveProperty('action');
      expect(typeof result.action).toBe('function');
    });

    it('should return a valid action object with custom parameters', () => {
      const mockSetOpen = jest.fn();
      const mockHandleAccept = jest.fn();
      
      const result = modalAsyncAction(
        mockSetOpen,
        mockHandleAccept,
        'custom-title',
        'custom-name'
      );
      
      expect(result).toHaveProperty('name', 'custom-name');
      expect(result).toHaveProperty('action');
    });

    it('should call setOpen with correct modal config when action is executed', () => {
      const mockSetOpen = jest.fn();
      const mockHandleAccept = jest.fn();
      
      const result = modalAsyncAction(mockSetOpen, mockHandleAccept);
      result.action();
      
      expect(mockSetOpen).toHaveBeenCalledWith({
        id: 'withdraw-sent-order',
        navTitle: 'withdraw-order',
        title: 'withdraw-order-title',
        cancel: 'cancel',
        confirm: 'confirm',
        handleAccept: mockHandleAccept,
      });
    });
  });

  describe('handleOpenNewTab', () => {
    it('should return a valid action object', () => {
      const testName = 'Open Document';
      const testUrl = 'http://example.com';
      
      const result = handleOpenNewTab(testName, testUrl);
      
      expect(result).toHaveProperty('name', testName);
      expect(result).toHaveProperty('action');
      expect(typeof result.action).toBe('function');
    });

    it('should call goToNewTab with correct URL when action is executed', () => {
      const testName = 'Open Document';
      const testUrl = 'http://example.com';
      
      const result = handleOpenNewTab(testName, testUrl);
      result.action();
      
      expect(goToNewTab).toHaveBeenCalledWith(testUrl);
    });
  });
});