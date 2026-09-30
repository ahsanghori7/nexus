import extraReducers, {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from './extraReducers';
import { httpHelperV2 } from 'v2/services/httpHelper';

// Mock httpHelperV2
jest.mock('v2/services/httpHelper', () => ({
  httpHelperV2: jest.fn(),
}));

describe('notifications extraReducers', () => {
  const dispatch = jest.fn();
  const getState = jest.fn();

  const initialState = {
    items: [],
    unreadCount: 0,
    isLoading: false,
    isLoadingMore: false,
    currentTab: 'all',
    since: 0,
    limit: 10,
    hasMore: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchNotifications async thunk', () => {
    it('should create action with correct type prefix', () => {
      expect(fetchNotifications.typePrefix).toBe('notifications/fetchNotifications');
    });

    it('should call httpHelperV2 with correct parameters for initial load', async () => {
      const mockResponse = {
        data: [
          { id: 1, title: 'Notification 1', read_at: null },
          { id: 2, title: 'Notification 2', read_at: '2026-01-01' },
        ],
      };
      httpHelperV2.mockResolvedValue(mockResponse);

      const thunk = fetchNotifications({ since: 0, limit: 10, isLoadingMore: false });
      const result = await thunk(dispatch, getState, undefined);

      expect(httpHelperV2).toHaveBeenCalledWith({
        url: 'notifications?since=0&limit=10',
        method: 'GET',
      });
      expect(result.payload).toEqual({
        data: mockResponse.data,
        isLoadingMore: false,
      });
    });

    it('should call httpHelperV2 with correct parameters for loading more', async () => {
      const mockResponse = {
        data: [
          { id: 3, title: 'Notification 3', read_at: null },
        ],
      };
      httpHelperV2.mockResolvedValue(mockResponse);

      const thunk = fetchNotifications({ since: 10, limit: 10, isLoadingMore: true });
      const result = await thunk(dispatch, getState, undefined);

      expect(httpHelperV2).toHaveBeenCalledWith({
        url: 'notifications?since=10&limit=10',
        method: 'GET',
      });
      expect(result.payload).toEqual({
        data: mockResponse.data,
        isLoadingMore: true,
      });
    });

    it('should use default parameters when not provided', async () => {
      const mockResponse = { data: [] };
      httpHelperV2.mockResolvedValue(mockResponse);

      const thunk = fetchNotifications();
      await thunk(dispatch, getState, undefined);

      expect(httpHelperV2).toHaveBeenCalledWith({
        url: 'notifications?since=0&limit=10',
        method: 'GET',
      });
    });

    it('should handle fetchNotifications.pending for initial load', () => {
      const state = { ...initialState };
      const meta = { arg: { isLoadingMore: false } };
      const action = { type: fetchNotifications.pending.type, meta };

      extraReducers[fetchNotifications.pending](state, action);

      expect(state.isLoading).toBe(true);
      expect(state.isLoadingMore).toBe(false);
    });

    it('should handle fetchNotifications.pending for loading more', () => {
      const state = { ...initialState };
      const meta = { arg: { isLoadingMore: true } };
      const action = { type: fetchNotifications.pending.type, meta };

      extraReducers[fetchNotifications.pending](state, action);

      expect(state.isLoading).toBe(false);
      expect(state.isLoadingMore).toBe(true);
    });

    it('should handle fetchNotifications.fulfilled for initial load', () => {
      const state = { ...initialState, items: [] };
      const payload = {
        data: [
          { id: 1, title: 'Notification 1', read_at: null },
          { id: 2, title: 'Notification 2', read_at: '2026-01-01' },
        ],
        isLoadingMore: false,
      };
      const action = { type: fetchNotifications.fulfilled.type, payload };

      extraReducers[fetchNotifications.fulfilled](state, action);

      expect(state.items).toEqual(payload.data);
      expect(state.isLoading).toBe(false);
      expect(state.isLoadingMore).toBe(false);
      expect(state.unreadCount).toBe(1);
      expect(state.since).toBe(2);
      expect(state.hasMore).toBe(true);
    });

    it('should handle fetchNotifications.fulfilled for loading more', () => {
      const state = {
        ...initialState,
        items: [
          { id: 1, title: 'Notification 1', read_at: null },
          { id: 2, title: 'Notification 2', read_at: '2026-01-01' },
        ],
        since: 2,
      };
      const payload = {
        data: [
          { id: 3, title: 'Notification 3', read_at: null },
          { id: 4, title: 'Notification 4', read_at: null },
        ],
        isLoadingMore: true,
      };
      const action = { type: fetchNotifications.fulfilled.type, payload };

      extraReducers[fetchNotifications.fulfilled](state, action);

      expect(state.items).toHaveLength(4);
      expect(state.items[2]).toEqual(payload.data[0]);
      expect(state.items[3]).toEqual(payload.data[1]);
      expect(state.isLoading).toBe(false);
      expect(state.isLoadingMore).toBe(false);
      expect(state.unreadCount).toBe(3);
      expect(state.since).toBe(4);
      expect(state.hasMore).toBe(true);
    });

    it('should set hasMore to false when no data returned', () => {
      const state = { ...initialState };
      const payload = {
        data: [],
        isLoadingMore: false,
      };
      const action = { type: fetchNotifications.fulfilled.type, payload };

      extraReducers[fetchNotifications.fulfilled](state, action);

      expect(state.hasMore).toBe(false);
    });

    it('should handle fetchNotifications.fulfilled with null payload', () => {
      const state = { ...initialState };
      const payload = null;
      const action = { type: fetchNotifications.fulfilled.type, payload };

      extraReducers[fetchNotifications.fulfilled](state, action);

      expect(state.isLoading).toBe(false);
      expect(state.isLoadingMore).toBe(false);
      expect(state.hasMore).toBe(false);
    });

    it('should handle fetchNotifications.rejected for initial load', () => {
      const state = { ...initialState, isLoading: true };
      const meta = { arg: { isLoadingMore: false } };
      const action = { type: fetchNotifications.rejected.type, meta };

      extraReducers[fetchNotifications.rejected](state, action);

      expect(state.isLoading).toBe(false);
      expect(state.isLoadingMore).toBe(false);
    });

    it('should handle fetchNotifications.rejected for loading more', () => {
      const state = { ...initialState, isLoadingMore: true };
      const meta = { arg: { isLoadingMore: true } };
      const action = { type: fetchNotifications.rejected.type, meta };

      extraReducers[fetchNotifications.rejected](state, action);

      expect(state.isLoading).toBe(false);
      expect(state.isLoadingMore).toBe(false);
    });
  });

  describe('markNotificationAsRead async thunk', () => {
    it('should create action with correct type prefix', () => {
      expect(markNotificationAsRead.typePrefix).toBe('notifications/markAsRead');
    });

    it('should call httpHelperV2 with correct parameters', async () => {
      const mockResponse = { data: { success: true } };
      httpHelperV2.mockResolvedValue(mockResponse);

      const thunk = markNotificationAsRead({ notificationId: 123 });
      const result = await thunk(dispatch, getState, undefined);

      expect(httpHelperV2).toHaveBeenCalledWith({
        url: 'notifications/123/read',
        method: 'PATCH',
      });
      expect(result.payload).toEqual(mockResponse.data);
    });

    it('should handle markNotificationAsRead.fulfilled', () => {
      const state = {
        ...initialState,
        items: [
          { id: 1, title: 'Notification 1', read_at: null },
          { id: 2, title: 'Notification 2', read_at: null },
          { id: 3, title: 'Notification 3', read_at: '2026-01-01' },
        ],
        unreadCount: 2,
      };
      const meta = { arg: { notificationId: 1 } };
      const action = { type: markNotificationAsRead.fulfilled.type, meta };

      extraReducers[markNotificationAsRead.fulfilled](state, action);

      expect(state.items[0].read_at).toBeInstanceOf(Date);
      expect(state.unreadCount).toBe(1);
    });

    it('should not change unreadCount if notification already read', () => {
      const state = {
        ...initialState,
        items: [
          { id: 1, title: 'Notification 1', read_at: '2026-01-01' },
        ],
        unreadCount: 0,
      };
      const meta = { arg: { notificationId: 1 } };
      const action = { type: markNotificationAsRead.fulfilled.type, meta };

      extraReducers[markNotificationAsRead.fulfilled](state, action);

      expect(state.unreadCount).toBe(0);
    });

    it('should handle markNotificationAsRead.fulfilled when notification not found', () => {
      const state = {
        ...initialState,
        items: [
          { id: 1, title: 'Notification 1', read_at: null },
        ],
        unreadCount: 1,
      };
      const meta = { arg: { notificationId: 999 } };
      const action = { type: markNotificationAsRead.fulfilled.type, meta };

      extraReducers[markNotificationAsRead.fulfilled](state, action);

      expect(state.items[0].read_at).toBeNull();
      expect(state.unreadCount).toBe(1);
    });
  });

  describe('markAllNotificationsAsRead async thunk', () => {
    it('should create action with correct type prefix', () => {
      expect(markAllNotificationsAsRead.typePrefix).toBe('notifications/markAllAsRead');
    });

    it('should call httpHelperV2 with correct parameters', async () => {
      const mockResponse = { data: { success: true } };
      httpHelperV2.mockResolvedValue(mockResponse);

      const thunk = markAllNotificationsAsRead();
      const result = await thunk(dispatch, getState, undefined);

      expect(httpHelperV2).toHaveBeenCalledWith({
        url: 'notifications/mark_all_read',
        method: 'PATCH',
      });
      expect(result.payload).toEqual(mockResponse.data);
    });

    it('should handle markAllNotificationsAsRead.fulfilled', () => {
      const state = {
        ...initialState,
        items: [
          { id: 1, title: 'Notification 1', read_at: null },
          { id: 2, title: 'Notification 2', read_at: null },
          { id: 3, title: 'Notification 3', read_at: '2026-01-01' },
        ],
        unreadCount: 2,
      };
      const action = { type: markAllNotificationsAsRead.fulfilled.type };

      extraReducers[markAllNotificationsAsRead.fulfilled](state, action);

      expect(state.items[0].read_at).toBeInstanceOf(Date);
      expect(state.items[1].read_at).toBeInstanceOf(Date);
      expect(state.items[2].read_at).toBeInstanceOf(Date);
      expect(state.unreadCount).toBe(0);
    });

    it('should handle markAllNotificationsAsRead.fulfilled with empty items', () => {
      const state = {
        ...initialState,
        items: [],
        unreadCount: 0,
      };
      const action = { type: markAllNotificationsAsRead.fulfilled.type };

      extraReducers[markAllNotificationsAsRead.fulfilled](state, action);

      expect(state.items).toHaveLength(0);
      expect(state.unreadCount).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should calculate unreadCount correctly with mixed read/unread notifications', () => {
      const state = { ...initialState };
      const payload = {
        data: [
          { id: 1, title: 'N1', read_at: null },
          { id: 2, title: 'N2', read_at: '2026-01-01' },
          { id: 3, title: 'N3', read_at: null },
          { id: 4, title: 'N4', read_at: null },
          { id: 5, title: 'N5', read_at: '2026-01-02' },
        ],
        isLoadingMore: false,
      };
      const action = { type: fetchNotifications.fulfilled.type, payload };

      extraReducers[fetchNotifications.fulfilled](state, action);

      expect(state.unreadCount).toBe(3);
    });

    it('should handle fetchNotifications.pending with undefined meta.arg', () => {
      const state = { ...initialState };
      const meta = {};
      const action = { type: fetchNotifications.pending.type, meta };

      extraReducers[fetchNotifications.pending](state, action);

      expect(state.isLoading).toBe(true);
      expect(state.isLoadingMore).toBe(false);
    });

    it('should handle fetchNotifications.rejected with undefined meta.arg', () => {
      const state = { ...initialState };
      const meta = { arg: undefined };
      const action = { type: fetchNotifications.rejected.type, meta };

      extraReducers[fetchNotifications.rejected](state, action);

      expect(state.isLoading).toBe(false);
      expect(state.isLoadingMore).toBe(false);
    });
  });
});
