import { Box, Typography } from '@mui/material';
import React from 'react';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import i18next from 'i18next';

const InvalidPage = ({ ownerAccountName }) => {
  return (
    <Box data-testid="download-manager-invalid-page" sx={{ display: 'contents' }}>
      <CancelOutlinedIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
      <Typography variant="h4" fontWeight={'bold'} textAlign={'center'} my={1}> {i18next.t('invalid-access-page-title')}</Typography>
      <Typography variant="body1" textAlign={'center'} color={'text.secondary'} mb={2}>
      {i18next.t('invalid-access-text-1')}
      </Typography>
      <Typography variant="body2" textAlign={'center'} color={'text.secondary'} mb={2}>
      {i18next.t('invalid-access-text-2', { ownerAccountName })}
      </Typography>
    </Box>
  );
};

export default InvalidPage;
