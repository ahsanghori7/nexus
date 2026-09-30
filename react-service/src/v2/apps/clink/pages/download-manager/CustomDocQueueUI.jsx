import React from 'react';
import { Box, Card, CircularProgress, Typography } from '@mui/material';
import i18next from 'i18next';

const CustomDocQueueUI = () => {
  return (
    <Box
      data-testid="download-manager-loading-overlay"
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
      }}
    >
      <Card
        sx={{
          minWidth: 400,
          maxWidth: 500,
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'white',
          boxShadow: 3,
          borderRadius: 2,
        }}
      >
        <CircularProgress
          size={60}
          thickness={4}
          sx={{ mb: 3,color:'black !important' }}
        />
        <Typography
          variant="h6"
          fontWeight="700"
          color="black"
          align="center"
          mb={1.5}
        >
          {i18next.t('preparing-your-downloads')}
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          align="center"
          mb={0.5}
        >
          {i18next.t('gathering-document-files')}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          align="center"
        >
          {i18next.t('download-wait-message')}
        </Typography>
      </Card>
    </Box>
  );
};

export default CustomDocQueueUI;
