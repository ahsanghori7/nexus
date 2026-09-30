import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { CONSTANTS } from 'clink-components';

const { clinkGreen, clinkPurple, clinkRed } = CONSTANTS.colors.general;

const MuiTabQuizz = ({ children, sx = {} }) => {
  return (
    <Typography
      component="div"
      sx={{
        display: 'flex',
        flexBasis: '100%',
        fontSize: { xs: '14px', lg: '15px' },
        pl: 1,
        pb: 1,
        pt: { xs: 0.5, sm: 0 },
        ...sx,
      }}
    >
      {children}
    </Typography>
  );
};

const MuiTabContent = ({ children, financial = false }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        overflow: 'auto',
        boxSizing: 'border-box',
        p: 1,
        maxHeight: { xs: '290px', lg: financial ? 'unset' : '130px' },
        '&::WebkitScrollbar': {
          width: '10px',
        },
        '&::-webkit-scrollbar-track': {
          boxShadow: `inset 0 0 5px ${clinkPurple}`,
          borderRadius: '10px',
        },
        '&::-webkit-scrollbar-thumb': {
          background: clinkGreen,
          borderRadius: '10px',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: clinkRed,
        },
      }}
    >
      {children}
    </Box>
  );
};

export { MuiTabQuizz, MuiTabContent };
