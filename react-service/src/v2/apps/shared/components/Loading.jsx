import React from 'react';
import { useTranslation } from 'react-i18next';
import { CONSTANTS, Status } from 'clink-components';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

const hexAlpha = (hex, a) => {
  const h = String(hex).replace('#', '');
  const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  if (v.length !== 6) return hex;
  const r = parseInt(v.slice(0, 2), 16);
  const g = parseInt(v.slice(2, 4), 16);
  const b = parseInt(v.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
};

const Loading = ({ status, message = null }) => {
  const { t } = useTranslation();
  const severity = status !== 'error' ? 'info' : status;
  const messageValue = message || t(status);

  const normalizedStatus = String(status || '').toLowerCase();
  const isBoqListLoading = normalizedStatus === 'loading boq list';
  const isBoqEntityUpdating = normalizedStatus === 'updating boq entity';

  if (
    status &&
    (isBoqListLoading || isBoqEntityUpdating) &&
    CONSTANTS?.colors?.general
  ) {
    const { boqAccent, clinkLightPurple, darkCharcoal } =
      CONSTANTS.colors.general;
    return (
      <Box
        data-testid="boq-loading-banner"
        sx={{
          width: '100%',
          p: 1.25,
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
          backgroundColor: hexAlpha(boqAccent, 0.06),
          border: `1px solid ${clinkLightPurple}`,
          borderRadius: '8px',
        }}
      >
        <CircularProgress size={16} thickness={5} sx={{ color: boqAccent }} />
        <Typography sx={{ fontSize: '14px', color: darkCharcoal, fontWeight: 500 }}>
          {messageValue}
        </Typography>
      </Box>
    );
  }

  return status && <Status severity={severity} message={messageValue} />;
};

export default Loading;
