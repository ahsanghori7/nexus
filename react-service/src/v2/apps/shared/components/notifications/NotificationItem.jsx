import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import FiberManualRecord from '@mui/icons-material/FiberManualRecord';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
import EditOutlined from '@mui/icons-material/EditOutlined';
import AssignmentOutlined from '@mui/icons-material/AssignmentOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import { useDispatch } from 'react-redux';
import { markNotificationAsRead } from 'v2/store/reducers/common/notifications';
import { useTranslation } from 'react-i18next';
import { getLondonUTCDate } from 'v2/helpers/date';

// Icon mapper for different notification types
const getNotificationIcon = (type) => {
  const iconMap = {
    order_approved: CheckCircleOutline,
    approval_required: FactCheckOutlinedIcon,
    signature_required: EditOutlined,
    workflow_action: AssignmentOutlined,
  };

  const IconComponent = iconMap[type?.toLowerCase()] || FactCheckOutlinedIcon;
  return <IconComponent sx={{ fontSize: 20, color: 'white' }} />;
};

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const toUtcIso = (timestamp) =>
  timestamp.includes('T') ? timestamp : `${timestamp.replace(' ', 'T')}Z`;

const parseLondonDateTime = (timestamp) => {
  const [datePart, timePart = '00:00:00'] = getLondonUTCDate(timestamp).split(' ');
  const [year, month, day] = datePart.split('-');

  return {
    year,
    month: MONTH_NAMES[Number(month) - 1],
    day: String(Number(day)),
    time: timePart.slice(0, 5),
    dateKey: datePart,
  };
};

// Format timestamp based on date recency in Europe/London
const formatTimestamp = (timestamp) => {
  if (!timestamp) return '';

  const notification = parseLondonDateTime(toUtcIso(timestamp));
  const now = parseLondonDateTime();

  if (notification.dateKey === now.dateKey) {
    return notification.time;
  }
  if (notification.year === now.year) {
    return `${notification.day} ${notification.month}`;
  }
  return `${notification.day} ${notification.month} ${notification.year}`;
};

const parseContextParts = (message) => {
  if (!message) return null;
  try {
    const parsed = JSON.parse(message);
    if (Array.isArray(parsed) && parsed.every((part) => part && typeof part === 'object' && 'label' in part && 'value' in part)) {
      return parsed;
    }
  } catch {
    // Not JSON - legacy plain-text message, fall through to raw rendering.
  }
  return null;
};

const NotificationItem = ({ notification, onClose }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  if (!notification) return null;

  const {
    id,
    type,
    title,
    message,
    target_url,
    read_at,
    created_at,
  } = notification;

  const contextParts = parseContextParts(message);

  const handleOpen = () => {
    if (target_url) {
      // Construct full URL by appending target_url to base app URL
      const baseUrl = BASE_URLS.APP_CLINK || '';
      const fullUrl = `${baseUrl}/${target_url}`;
      dispatch(markNotificationAsRead({ notificationId: id }))
      window.location.href = fullUrl;
    }
    if (onClose) {
      onClose();
    }
  };

  const handleMarkAsRead = (e) => {
    e.stopPropagation();
    dispatch(markNotificationAsRead({ notificationId: id }));
  };

  return (
    <Box
      onClick={handleOpen}
      sx={{
        display: 'flex',
        gap: 1.5,
        p: 2,
        borderBottom: '1px solid',
        borderColor: 'panelBorder.main',
        bgcolor: read_at ? 'transparent' : 'action.hover',
        '&:hover': {
          bgcolor: 'action.hover',
        },
        cursor: 'pointer',
      }}
    >
      {/* Unread indicator dot */}
      {!read_at && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            pt: 0.5,
          }}
        >
          <FiberManualRecord
            sx={{
              fontSize: 12,
              color: 'primary.main',
            }}
          />
        </Box>
      )}

      {/* Icon */}
      <Avatar
        sx={{
          width: 30,
          height: 30,
          mt: 0.5,
          bgcolor: 'primary.main',
          borderRadius: 2,
        }}
      >
        {getNotificationIcon(type)}
      </Avatar>

      {/* Content */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {/* Header - Type and Timestamp */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 0.5,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontWeight: 600,
              fontSize: '11px',
              letterSpacing: '0.5px',
            }}
          >
            {type?.split('_').join(' ')?.toUpperCase()}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontSize: '12px',
            }}
          >
            {formatTimestamp(created_at)}
          </Typography>
        </Box>

        {/* Title */}
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            color: 'text.primary',
            mb: 0.5,
            lineHeight: 1.4,
          }}
        >
          {title}
        </Typography>

        {/* Description */}
        {contextParts ? (
          <Box sx={{ mb: 1.5 }}>
            {contextParts.map(({ label, value }) => (
              <Typography
                key={label}
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  fontSize: '13px',
                  lineHeight: 1.4,
                }}
              >
                <Box component="span" sx={{ fontWeight: 600 }}>
                  {label}:
                </Box>{' '}
                {value}
              </Typography>
            ))}
          </Box>
        ) : (
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              fontSize: '13px',
              mb: 1.5,
              lineHeight: 1.4,
            }}
          >
            {message}
          </Typography>
        )}

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <Button
            size="small"
            variant="contained"
            onClick={handleOpen}
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              borderRadius: 2,
            }}
          >
            {t('open')}
          </Button>
          {!read_at && (
            <Button
              size="small"
              onClick={handleMarkAsRead}
              sx={{
                border: '1px solid',
                borderColor: 'text.secondary',
                borderRadius: 2,
                color: 'text.secondary',
              }}
            >
              {t('mark_as_read')}
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default NotificationItem;
