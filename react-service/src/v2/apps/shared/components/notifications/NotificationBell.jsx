import React, { useState, useEffect } from 'react';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import Popover from '@mui/material/Popover';
import NotificationsOutlined from '@mui/icons-material/NotificationsOutlined';
import NotificationDropdown from './NotificationDropdown';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchNotifications,
  resetPagination
} from 'v2/store/reducers/common/notifications';

const NotificationBell = () => {
  const dispatch = useDispatch();
  const [anchorEl, setAnchorEl] = useState(null);
  const { t } = useTranslation();
  const {unreadCount, items} = useSelector((state) => state.notifications);

  useEffect(() => {
    dispatch(resetPagination());
    dispatch(fetchNotifications({ since: 0, limit: 10 }));
  }, [dispatch]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'notification-popover' : undefined;

  return (
    <>
      <IconButton
        size="large"
        aria-label={t('notifications')}
        aria-describedby={id}
        color="inherit"
        onClick={handleClick}
      >
        <Badge
          badgeContent={unreadCount}
          color="error"
          sx={{
            '& .MuiBadge-badge': {
              bgcolor: 'error.main',
              color: 'white',
              fontWeight: 600,
            },
          }}
        >
          <NotificationsOutlined />
        </Badge>
      </IconButton>

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        sx={{
          mt: 1,
        }}
      >
        <NotificationDropdown items={items} unreadCount={unreadCount} onClose={handleClose} />
      </Popover>
    </>
  );
}

export default NotificationBell;
