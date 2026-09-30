import { createAsyncThunk } from '@reduxjs/toolkit';
import { httpHelperV2 } from 'v2/services/httpHelper';

// Fetch all notifications for the current user
const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async ({ since = 0, limit = 10, isLoadingMore = false } = {}) => {
    const response = await httpHelperV2({
      url: `notifications?since=${since}&limit=${limit}`,
      method: 'GET',
    });
    return { data: response?.data, isLoadingMore };
  }
);

// Mark single notification as read
const markNotificationAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async ({ notificationId }) => {
    const response = await httpHelperV2({
      url: `notifications/${notificationId}/read`,
      method: 'PATCH',
    });
    return response?.data;
  }
);

// Mark all notifications as read
const markAllNotificationsAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async () => {
    const response = await httpHelperV2({
      url: 'notifications/mark_all_read',
      method: 'PATCH',
    });
    return response?.data;
  }
);

export default {
  // Fetch Notifications
  [fetchNotifications.pending]: (state, { meta }) => {
    const { isLoadingMore } = meta.arg || {};
    if (isLoadingMore) {
      state.isLoadingMore = true;
    } else {
      state.isLoading = true;
    }
  },
  [fetchNotifications.fulfilled]: (state, { payload }) => {
    if (payload?.data) {
      const { data, isLoadingMore } = payload;

      if (isLoadingMore) {
        // Append new notifications to existing list
        state.items = [...state.items, ...data];
        state.isLoadingMore = false;
      } else {
        // Replace notifications (initial load)
        state.items = data;
        state.isLoading = false;
      }

      // Update pagination state - only stop if no data returned
      state.hasMore = data.length > 0;
      state.since = state.items.length;

      // Update unread count
      state.unreadCount = state.items.filter((n) => !n.read_at).length;
    } else {
      state.isLoading = false;
      state.isLoadingMore = false;
      state.hasMore = false;
    }
  },
  [fetchNotifications.rejected]: (state, { meta }) => {
    const { isLoadingMore } = meta.arg || {};
    if (isLoadingMore) {
      state.isLoadingMore = false;
    } else {
      state.isLoading = false;
    }
  },


  [markNotificationAsRead.fulfilled]: (state, { meta }) => {
    const { notificationId } = meta.arg;
    const notification = state.items.find((n) => n.id === notificationId);
    if (notification) {
      notification.read_at = new Date();
      state.unreadCount = state.items.filter((n) => !n.read_at).length;
    }
  },



  [markAllNotificationsAsRead.fulfilled]: (state) => {
    state.items = state.items.map((notification) => ({
      ...notification,
      read_at: new Date(),
    }));
    state.unreadCount = 0;
  },
};

export {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};
