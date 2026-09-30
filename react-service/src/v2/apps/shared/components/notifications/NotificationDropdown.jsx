import React, { useState, useRef, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import NotificationList from './NotificationList';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import {
  markAllNotificationsAsRead,
  fetchNotifications
} from 'v2/store/reducers/common/notifications';
import { styles } from './NotificationDropdown.styles';

const NotificationDropdown = ({ items = [], unreadCount = 0, onClose }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [currentTab, setCurrentTab] = useState('unread');
  const scrollContainerRef = useRef(null);

  const { isLoadingMore, hasMore, since, limit } = useSelector(
    (state) => state.notifications
  );

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleMarkAllAsRead = () => {
    if (unreadCount > 0) {
      dispatch(markAllNotificationsAsRead());
    }
  };

  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current || isLoadingMore || !hasMore) {
      return;
    }

    const container = scrollContainerRef.current;
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;

    // Trigger load more when user scrolls to within 50px of the bottom
    if (scrollTop + clientHeight >= scrollHeight - 50) {
      dispatch(fetchNotifications({
        since,
        limit,
        isLoadingMore: true
      }));
    }
  }, [isLoadingMore, hasMore, since, limit, dispatch]);

  return (
    <Box sx={styles.container}>
      {/* Header */}
      <Box sx={styles.header}>
        <Typography variant="h6" sx={styles.title}>
          {t('notifications')}
          <Typography
            component="span"
            variant="body2"
            sx={styles.unreadCount}
          >
            {unreadCount} {t('notifications-unread')}
          </Typography>
        </Typography>
        <Button
          size="small"
          onClick={handleMarkAllAsRead}
          sx={styles.markAllButton}
        >
          {t('notifications-mark-all-as-read')}
        </Button>
      </Box>

      {/* Tabs */}
      <Box sx={styles.tabsContainer}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          sx={styles.tabs}
        >
          <Tab
            label={
              <Box sx={styles.tabBadgeContainer}>
                {t('notifications-unread')}
                <Box
                  component="span"
                  className="items-count"
                  sx={styles.tabBadge}
                >
                  {unreadCount}
                </Box>
              </Box>
            }
            value="unread"
            sx={styles.tab}
          />
          <Tab
            label={t('notifications-all')}
            value="all"
            sx={styles.tab}
          />
        </Tabs>
      </Box>

      <Divider />

      {/* Content Area - Notification List */}
      <Box
        ref={scrollContainerRef}
        onScroll={handleScroll}
        sx={styles.scrollContainer}
      >
        <NotificationList
          notifications={items}
          currentTab={currentTab}
          onClose={onClose}
          isLoadingMore={isLoadingMore}
          hasMore={hasMore}
        />
      </Box>
    </Box>
  );
}

export default NotificationDropdown;
