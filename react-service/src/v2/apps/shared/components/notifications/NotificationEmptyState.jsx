import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import NotificationsNoneOutlined from '@mui/icons-material/NotificationsNoneOutlined';
import { styles } from './NotificationEmptyState.styles';
import { useTranslation } from 'react-i18next';

const NotificationEmptyState = () => {
  const { t } = useTranslation();
  return (
    <Box sx={styles.container}>
      <NotificationsNoneOutlined sx={styles.icon} />
      <Typography variant="body1" sx={styles.title}>
        {t('notifications-empty-state-title')}
      </Typography>
      <Typography variant="body2" sx={styles.description}>
        {t('notifications-empty-state-description')}
      </Typography>
    </Box>
  );
};

export default NotificationEmptyState;
