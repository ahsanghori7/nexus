import { renderHook, act } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';
import { useReminderHandler } from './useReminderHandler';

// Mock i18next
jest.mock('v2/helpers/i18n', () => ({
  __esModule: true,
  default: {
    t: (key, options) => {
      if (key === 'reminder-sent-success' && options?.approverName) {
        return `Reminder sent successfully to ${options.approverName}`;
      }
      const translations = {
        'reminder-api-not-configured': 'Reminder API is not configured',
        'reminder-entity-id-missing': 'Entity ID is missing',
        'reminder-send-failed': 'Failed to send reminder',
        'reminder-send-error': 'An error occurred while sending reminder',
      };
      return translations[key] || key;
    },
  },
}));

// Mock useSnackbar hook
const mockShowSnackbar = jest.fn();
const mockCloseSnackbar = jest.fn();

jest.mock('v2/hooks/useSnackbar', () => ({
  useSnackbar: () => ({
    showSnackbar: mockShowSnackbar,
    closeSnackbar: mockCloseSnackbar,
  }),
}));

describe('useReminderHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with correct default values', () => {
      const reminderApi = jest.fn();
      const { result } = renderHook(() =>
        useReminderHandler(reminderApi, 'entity-1'),
      );

      expect(result.current.loadingReminderId).toBeNull();
      expect(typeof result.current.handleSendReminder).toBe('function');
      expect(typeof result.current.closeSnackbar).toBe('function');
      expect(typeof result.current.resetReminder).toBe('function');
    });

    it('should support custom entityIdKey', () => {
      const reminderApi = jest.fn().mockResolvedValue({ success: true });
      const { result } = renderHook(() =>
        useReminderHandler(reminderApi, 'entity-1', 'customKey'),
      );

      act(() => {
        result.current.handleSendReminder(1, 'John', 'Custom message');
      });

      expect(reminderApi).toHaveBeenCalledWith(
        expect.objectContaining({
          customKey: 'entity-1',
          approver_id: 1,
        }),
      );
    });
  });

  describe('handleSendReminder validation', () => {
    it('should show error snackbar when reminderApi is not provided', async () => {
      const { result } = renderHook(() =>
        useReminderHandler(null, 'entity-1'),
      );

      await act(async () => {
        await result.current.handleSendReminder(1, 'John', 'Test');
      });

    expect(mockShowSnackbar).toHaveBeenCalledWith(
        'Reminder API is not configured',
        'error',
      );
    });

    it('should show error snackbar when entityId is not provided', async () => {
      const reminderApi = jest.fn();
      const { result } = renderHook(() =>
        useReminderHandler(reminderApi, null),
      );

      await act(async () => {
        await result.current.handleSendReminder(1, 'John', 'Test');
      });

      expect(mockShowSnackbar).toHaveBeenCalledWith(
        'Entity ID is missing',
        'error',
      );
    });

    it('should show error snackbar when entityId is empty string', async () => {
      const reminderApi = jest.fn();
      const { result } = renderHook(() =>
        useReminderHandler(reminderApi, ''),
      );

      await act(async () => {
        await result.current.handleSendReminder(1, 'John', 'Test');
      });

      expect(mockShowSnackbar).toHaveBeenCalledWith(
        'Entity ID is missing',
        'error',
      );
    });
  });

  describe('handleSendReminder success', () => {
    it('should handle successful reminder with direct response', async () => {
      const reminderApi = jest.fn().mockResolvedValue({ success: true });
      const { result } = renderHook(() =>
        useReminderHandler(reminderApi, 'entity-1'),
      );

      await act(async () => {
        await result.current.handleSendReminder(1, 'John Doe');
      });

      expect(mockShowSnackbar).toHaveBeenCalledWith(
        'Reminder sent successfully to John Doe',
        'success',
      );
      expect(result.current.loadingReminderId).toBeNull();
    });

    it('should handle successful reminder with payload.status', async () => {
      const reminderApi = jest
        .fn()
        .mockResolvedValue({ payload: { status: true } });
      const { result } = renderHook(() =>
        useReminderHandler(reminderApi, 'entity-1'),
      );

      await act(async () => {
        await result.current.handleSendReminder(1, 'John Doe');
      });

      expect(mockShowSnackbar).toHaveBeenCalledWith(
        'Reminder sent successfully to John Doe',
        'success',
      );
    });

    it('should handle successful reminder with status field', async () => {
      const reminderApi = jest
        .fn()
        .mockResolvedValue({ status: true, data: {} });
      const { result } = renderHook(() =>
        useReminderHandler(reminderApi, 'entity-1'),
      );

      await act(async () => {
        await result.current.handleSendReminder(2, 'Jane Smith');
      });

      expect(mockShowSnackbar).toHaveBeenCalledWith(
        'Reminder sent successfully to Jane Smith',
        'success',
      );
    });

    it('should use custom message over default success message', async () => {
      const reminderApi = jest.fn().mockResolvedValue({ success: true });
      const { result } = renderHook(() =>
        useReminderHandler(reminderApi, 'entity-1'),
      );

      await act(async () => {
        await result.current.handleSendReminder(
          1,
          'John',
          'Custom success message',
        );
      });

      expect(mockShowSnackbar).toHaveBeenCalledWith(
        'Custom success message',
        'success',
      );
    });
  });

  describe('handleSendReminder failures', () => {
    it('should handle failed response with message', async () => {
      const reminderApi = jest.fn().mockResolvedValue({
        success: false,
        message: 'Approver not found',
      });
      const { result } = renderHook(() =>
        useReminderHandler(reminderApi, 'entity-1'),
      );

      await act(async () => {
        await result.current.handleSendReminder(1, 'John');
      });

      expect(mockShowSnackbar).toHaveBeenCalledWith(
        'Approver not found',
        'error',
      );
    });

    it('should handle failed response without message', async () => {
      const reminderApi = jest.fn().mockResolvedValue({ success: false });
      const { result } = renderHook(() =>
        useReminderHandler(reminderApi, 'entity-1'),
      );

      await act(async () => {
        await result.current.handleSendReminder(1, 'John');
      });

      expect(mockShowSnackbar).toHaveBeenCalledWith(
        'Failed to send reminder',
        'error',
      );
    });

    it('should handle API exception', async () => {
      const reminderApi = jest
        .fn()
        .mockRejectedValue(new Error('Network error'));
      const { result } = renderHook(() =>
        useReminderHandler(reminderApi, 'entity-1'),
      );

      await act(async () => {
        await result.current.handleSendReminder(1, 'John');
      });

      expect(mockShowSnackbar).toHaveBeenCalledWith('Network error', 'error');
    });

    it('should handle API exception without message', async () => {
      const reminderApi = jest.fn().mockRejectedValue(new Error());
      const { result } = renderHook(() =>
        useReminderHandler(reminderApi, 'entity-1'),
      );

      await act(async () => {
        await result.current.handleSendReminder(1, 'John');
      });

      expect(mockShowSnackbar).toHaveBeenCalledWith(
        'An error occurred while sending reminder',
        'error',
      );
    });

    it('should handle rejection with error object', async () => {
      const reminderApi = jest
        .fn()
        .mockRejectedValue({ message: 'Validation error' });
      const { result } = renderHook(() =>
        useReminderHandler(reminderApi, 'entity-1'),
      );

      await act(async () => {
        await result.current.handleSendReminder(1, 'John');
      });

      expect(mockShowSnackbar).toHaveBeenCalledWith(
        'Validation error',
        'error',
      );
    });
  });

  describe('handleSendReminder with unwrap', () => {
    it('should handle promise with unwrap method', async () => {
      const reminderApi = jest.fn().mockReturnValue({
        unwrap: jest.fn().mockResolvedValue({ success: true }),
      });
      const { result } = renderHook(() =>
        useReminderHandler(reminderApi, 'entity-1'),
      );

      await act(async () => {
        await result.current.handleSendReminder(1, 'John', 'Custom message');
      });

      expect(mockShowSnackbar).toHaveBeenCalledWith(
        'Custom message',
        'success',
      );
    });

    it('should handle unwrap rejection', async () => {
      const reminderApi = jest.fn().mockReturnValue({
        unwrap: jest
          .fn()
          .mockRejectedValue(new Error('Unwrap failed')),
      });
      const { result } = renderHook(() =>
        useReminderHandler(reminderApi, 'entity-1'),
      );

      await act(async () => {
        await result.current.handleSendReminder(1, 'John');
      });

      expect(mockShowSnackbar).toHaveBeenCalledWith(
        'Unwrap failed',
        'error',
      );
    });
  });

  describe('loading state management', () => {
    it('should set loadingReminderId during send', async () => {
      let resolveReminder;
      const reminderApi = jest
        .fn()
        .mockReturnValue(
          new Promise((resolve) => {
            resolveReminder = resolve;
          }),
        );
      const { result, rerender } = renderHook(() =>
        useReminderHandler(reminderApi, 'entity-1'),
      );

      const sendPromise = act(async () => {
        await result.current.handleSendReminder(1, 'John');
      });

      await waitFor(() => {
        expect(result.current.loadingReminderId).toBe(1);
      });

      resolveReminder({ success: true });
      await sendPromise;

      expect(result.current.loadingReminderId).toBeNull();
    });

    it('should clear loadingReminderId after error', async () => {
      const reminderApi = jest
        .fn()
        .mockRejectedValue(new Error('Failed'));
      const { result } = renderHook(() =>
        useReminderHandler(reminderApi, 'entity-1'),
      );

      await act(async () => {
        await result.current.handleSendReminder(1, 'John');
      });

      expect(result.current.loadingReminderId).toBeNull();
    });

    it('should handle multiple concurrent reminders', async () => {
      const reminderApi = jest.fn().mockResolvedValue({ success: true });
      const { result } = renderHook(() =>
        useReminderHandler(reminderApi, 'entity-1'),
      );

      await act(async () => {
        result.current.handleSendReminder(1, 'John');
        result.current.handleSendReminder(2, 'Jane');
      });

      // Last one should be the current loadingReminderId
      expect(result.current.loadingReminderId).toBeNull();
    });
  });

  describe('closeSnackbar', () => {
    it('should call closeSnackbar from useSnackbar hook', () => {
      const reminderApi = jest.fn();
      const { result } = renderHook(() =>
        useReminderHandler(reminderApi, 'entity-1'),
      );

      act(() => {
        result.current.closeSnackbar();
      });

      expect(mockCloseSnackbar).toHaveBeenCalled();
    });
  });

  describe('resetReminder', () => {
    it('should clear loadingReminderId', async () => {
      let resolveReminder;
      const reminderApi = jest
        .fn()
        .mockReturnValue(
          new Promise((resolve) => {
            resolveReminder = resolve;
          }),
        );
      const { result } = renderHook(() =>
        useReminderHandler(reminderApi, 'entity-1'),
      );

      const sendPromise = act(async () => {
        await result.current.handleSendReminder(1, 'John');
      });

      await waitFor(() => {
        expect(result.current.loadingReminderId).toBe(1);
      });

      act(() => {
        result.current.resetReminder();
      });

      expect(result.current.loadingReminderId).toBeNull();

      resolveReminder({ success: true });
      await sendPromise;
    });
  });

  describe('API payload', () => {
    it('should send correct payload with custom entityIdKey', async () => {
      const reminderApi = jest.fn().mockResolvedValue({ success: true });
      const { result } = renderHook(() =>
        useReminderHandler(reminderApi, 'doc-123', 'documentId'),
      );

      await act(async () => {
        await result.current.handleSendReminder(5, 'Jane', 'Test');
      });

      expect(reminderApi).toHaveBeenCalledWith({
        approver_id: 5,
        documentId: 'doc-123',
      });
    });

    it('should send correct payload with default entityIdKey', async () => {
      const reminderApi = jest.fn().mockResolvedValue({ success: true });
      const { result } = renderHook(() =>
        useReminderHandler(reminderApi, 'entity-456'),
      );

      await act(async () => {
        await result.current.handleSendReminder(3, 'Bob', 'Test');
      });

      expect(reminderApi).toHaveBeenCalledWith({
        approver_id: 3,
        entityId: 'entity-456',
      });
    });
  });
});
