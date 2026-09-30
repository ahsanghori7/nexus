import React from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import NotificationItem from './NotificationItem';
import NotificationEmptyState from './NotificationEmptyState';

const NotificationList = ({
  notifications = [],
  currentTab = 'unread',
  onClose,
  isLoadingMore = false,
}) => {
  // Filter notifications based on current tab
  const filteredNotifications = currentTab === 'unread'
    ? notifications.filter(n => !n.read_at)
    : notifications;

  // Show empty state if no notifications
  if (filteredNotifications.length === 0 && !isLoadingMore) {
    return <NotificationEmptyState />;
  }

  return (
    <Box>
      {filteredNotifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClose={onClose}
        />
      ))}

      {isLoadingMore && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            py: 2,
          }}
        >
          <CircularProgress size={24} />
        </Box>
      )}
    </Box>
  );
};

export default NotificationList;
