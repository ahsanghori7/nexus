import notificationsReducer, {
  setCurrentTab,
  resetNotifications,
  resetPagination,
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from './index';

describe('notifications slice', () => {
  const initialState = {
    items: [],
    unreadCount: 0,
    isLoading: false,
    isLoadingMore: false,
    currentTab: 'unread',
    since: 0,
    limit: 10,
    hasMore: true,
  };

  describe('initial state', () => {
    it('should return the initial state', () => {
      expect(notificationsReducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });
  });

  describe('setCurrentTab reducer', () => {
    it('should set the current tab to "all"', () => {
      const previousState = { ...initialState, currentTab: 'unread' };
      const nextState = notificationsReducer(previousState, setCurrentTab('all'));
      
      expect(nextState.currentTab).toBe('all');
    });

    it('should set the current tab to "unread"', () => {
      const previousState = { ...initialState, currentTab: 'all' };
      const nextState = notificationsReducer(previousState, setCurrentTab('unread'));
      
      expect(nextState.currentTab).toBe('unread');
    });

    it('should keep other state properties unchanged', () => {
      const previousState = {
        ...initialState,
        items: [{ id: 1, title: 'Test' }],
        unreadCount: 5,
        currentTab: 'all',
      };
      const nextState = notificationsReducer(previousState, setCurrentTab('unread'));
      
      expect(nextState.items).toEqual(previousState.items);
      expect(nextState.unreadCount).toBe(5);
      expect(nextState.currentTab).toBe('unread');
    });
  });

  describe('resetNotifications reducer', () => {
    it('should reset state to initial state', () => {
      const previousState = {
        items: [
          { id: 1, title: 'Notification 1' },
          { id: 2, title: 'Notification 2' },
        ],
        unreadCount: 2,
        isLoading: true,
        isLoadingMore: true,
        currentTab: 'unread',
        since: 20,
        limit: 5,
        hasMore: false,
      };

      const nextState = notificationsReducer(previousState, resetNotifications());
      
      expect(nextState).toEqual(initialState);
    });

    it('should reset empty state without errors', () => {
      const nextState = notificationsReducer(initialState, resetNotifications());
      
      expect(nextState).toEqual(initialState);
    });
  });

  describe('resetPagination reducer', () => {
    it('should reset pagination state', () => {
      const previousState = {
        ...initialState,
        items: [
          { id: 1, title: 'Notification 1' },
          { id: 2, title: 'Notification 2' },
        ],
        since: 20,
        hasMore: false,
        unreadCount: 2,
      };

      const nextState = notificationsReducer(previousState, resetPagination());
      
      expect(nextState.since).toBe(0);
      expect(nextState.hasMore).toBe(true);
      expect(nextState.items).toEqual([]);
    });

    it('should keep other state properties unchanged', () => {
      const previousState = {
        ...initialState,
        items: [{ id: 1, title: 'Test' }],
        currentTab: 'unread',
        unreadCount: 5,
        since: 10,
      };

      const nextState = notificationsReducer(previousState, resetPagination());
      
      expect(nextState.currentTab).toBe('unread');
      expect(nextState.limit).toBe(10);
      expect(nextState.since).toBe(0);
      expect(nextState.items).toEqual([]);
      expect(nextState.hasMore).toBe(true);
    });

    it('should reset pagination from initial state without errors', () => {
      const nextState = notificationsReducer(initialState, resetPagination());
      
      expect(nextState.since).toBe(0);
      expect(nextState.hasMore).toBe(true);
      expect(nextState.items).toEqual([]);
    });
  });

  describe('exported actions', () => {
    it('should export fetchNotifications action', () => {
      expect(fetchNotifications).toBeDefined();
      expect(typeof fetchNotifications).toBe('function');
    });

    it('should export markNotificationAsRead action', () => {
      expect(markNotificationAsRead).toBeDefined();
      expect(typeof markNotificationAsRead).toBe('function');
    });

    it('should export markAllNotificationsAsRead action', () => {
      expect(markAllNotificationsAsRead).toBeDefined();
      expect(typeof markAllNotificationsAsRead).toBe('function');
    });

    it('should export setCurrentTab action', () => {
      expect(setCurrentTab).toBeDefined();
      expect(typeof setCurrentTab).toBe('function');
    });

    it('should export resetNotifications action', () => {
      expect(resetNotifications).toBeDefined();
      expect(typeof resetNotifications).toBe('function');
    });

    it('should export resetPagination action', () => {
      expect(resetPagination).toBeDefined();
      expect(typeof resetPagination).toBe('function');
    });
  });

  describe('action creators', () => {
    it('setCurrentTab should create action with correct payload', () => {
      const action = setCurrentTab('unread');
      expect(action.type).toBe('notifications/setCurrentTab');
      expect(action.payload).toBe('unread');
    });

    it('resetNotifications should create action with correct type', () => {
      const action = resetNotifications();
      expect(action.type).toBe('notifications/resetNotifications');
    });

    it('resetPagination should create action with correct type', () => {
      const action = resetPagination();
      expect(action.type).toBe('notifications/resetPagination');
    });
  });

  describe('complex scenarios', () => {
    it('should handle multiple tab switches', () => {
      let state = initialState;
      
      state = notificationsReducer(state, setCurrentTab('unread'));
      expect(state.currentTab).toBe('unread');
      
      state = notificationsReducer(state, setCurrentTab('all'));
      expect(state.currentTab).toBe('all');
      
      state = notificationsReducer(state, setCurrentTab('unread'));
      expect(state.currentTab).toBe('unread');
    });

    it('should handle reset after loading data', () => {
      let state = {
        ...initialState,
        items: [{ id: 1 }, { id: 2 }],
        unreadCount: 2,
        since: 2,
      };

      state = notificationsReducer(state, resetPagination());
      expect(state.items).toEqual([]);
      expect(state.since).toBe(0);
      expect(state.hasMore).toBe(true);

      // unreadCount should remain (only pagination resets)
      expect(state.unreadCount).toBe(2);
    });
  });
});
