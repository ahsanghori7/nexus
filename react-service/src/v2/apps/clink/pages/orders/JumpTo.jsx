import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LinkList from 'v2/apps/clink/pages/shared/LinkList';
import { useTranslation } from 'react-i18next';

const JumpTo = ({ entries }) => {
  const { t } = useTranslation();

  return (
    <Box>
      <Typography sx={{ fontSize: '24px', pt: 1, fontWeight: 'bold' }}>
        {t('order-page-selected-packages')}:
      </Typography>
      <Typography sx={{ fontSize: '16px', pt: 2, opacity: '0.5', mb: 1 }}>
        {t('order-page-jump-to')}:
      </Typography>
      <LinkList entries={entries} />
    </Box>
  );
};

export default JumpTo;
