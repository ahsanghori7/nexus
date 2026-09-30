import React from 'react';
import i18n from 'i18next';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
import Box from '@mui/material/Box';

const Empty = ({ hasEntities, loading = false }) =>
  !hasEntities && (
    <Paper sx={{ textAlign: 'center', p: 3 }}>
      {loading ? (
        <Box sx={{ maxWidth: 520, mx: 'auto' }}>
          <Skeleton variant="rectangular" height={180} sx={{ borderRadius: '12px' }} />
        </Box>
      ) : (
        <>
          <Typography variant="h4" paddingBottom={2}>
            {i18n.t('no-entities-available')}
          </Typography>
          <Typography paddingBottom={1}>{i18n.t('please-click-add')}</Typography>
        </>
      )}
    </Paper>
  );

export default Empty;
