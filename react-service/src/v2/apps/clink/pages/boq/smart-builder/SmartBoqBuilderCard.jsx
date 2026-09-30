import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { CONSTANTS } from 'clink-components';
import i18next from 'v2/helpers/i18n';
import { creationCardActionButtonSx } from 'v2/apps/clink/pages/boq/container/containerStyles';

const { black, clinkGreen, brightGray, white } = CONSTANTS.colors.general;

const SmartBoqBuilderCard = ({ onOpen = () => null, disabled = false }) => {
  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        p: 2,
        ...(disabled && { opacity: 0.5, pointerEvents: 'none' }),
      }}
    >
      <Box>
        <Box
          sx={{
            width: '72px',
            height: '72px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: brightGray,
            mb: 2,
          }}
        >
          <AutoAwesomeIcon sx={{ color: clinkGreen, fontSize: 36 }} />
        </Box>
        <Typography
          component="h2"
          sx={{
            fontSize: '15px',
            fontWeight: 'bold',
            color: black,
            mb: 0.5,
          }}
        >
          {i18next.t('boq-smart-builder-title')}
        </Typography>
        <Typography
          sx={{
            fontSize: '13px',
            color: black,
            opacity: 0.6,
          }}
        >
          {i18next.t('boq-smart-builder-desc')}
        </Typography>
      </Box>

      <Button
        onClick={onOpen}
        variant="contained"
        fullWidth
        startIcon={<AutoAwesomeIcon sx={{ color: white, fontSize: 18 }} />}
        disabled={disabled}
        sx={{
          ...creationCardActionButtonSx,
          backgroundColor: clinkGreen,
          color: white,
          '&:hover': { backgroundColor: clinkGreen },
        }}
      >
        {i18next.t('boq-smart-builder-generate')}
      </Button>
    </Box>
  );
};

export default SmartBoqBuilderCard;
