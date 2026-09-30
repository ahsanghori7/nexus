import { createSlice } from '@reduxjs/toolkit';
import extraReducers, {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from './extraReducers';

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

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setCurrentTab: (state, action) => {
      state.currentTab = action.payload;
    },
    resetNotifications: () => initialState,
    resetPagination: (state) => {
      state.since = 0;
      state.hasMore = true;
      state.items = [];
    },
  },
  extraReducers,
});

export const { setCurrentTab, resetNotifications, resetPagination } = notificationsSlice.actions;

export {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};

export default notificationsSlice.reducer;
