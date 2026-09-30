import { Box, Typography } from '@mui/material';
import React from 'react';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import i18next from 'i18next';

const RescindedPage = ({ ownerAccountName }) => {
  return (
    <Box data-testid="download-manager-rescinded-page" sx={{ display: 'contents' }}>
      <CancelOutlinedIcon sx={{ fontSize: 40, color: 'warning.main' }} />
      <Typography variant="h4" fontWeight={'bold'} textAlign={'center'} my={1}> {i18next.t('rescinded-page-title')}</Typography>
      <Typography variant="body1" textAlign={'center'} color={'text.secondary'} mb={2}>
      {i18next.t('rescinded-text-1')}
      </Typography>
      <Typography variant="body2" textAlign={'center'} color={'text.secondary'} mb={2}>
      {i18next.t('rescinded-text-2', { ownerAccountName })}
      </Typography>
    </Box>
  );
};

export default RescindedPage;
