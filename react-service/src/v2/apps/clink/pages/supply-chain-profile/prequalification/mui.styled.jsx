import React from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

import { CONSTANTS } from 'clink-components';

const {
  clinkGreen,
  clinkRed,
  brightGray,
  lightPeriwinkle,
  white,
  japaneseIndigo,
} = CONSTANTS.colors.general;

const MuiScrollerContainer = ({ children, accordion }) => {
  return (
    <Box
      sx={{
        width: '100%',
        ...(accordion && {
          display: 'flex',
          px: 3,
          py: 2,
          pb: 3,
          m: 'auto',
          overflowX: 'scroll',
          '&::-webkit-scrollbar': {
            height: '10px',
          },
          '&::-webkit-scrollbar-track': {
            background: brightGray,
            borderRadius: '10px',
            marginLeft: { xs: '150px', md: '350px' },
            marginRight: { xs: '150px', md: '350px' },
          },
          '&::-webkit-scrollbar-thumb': {
            background: clinkGreen,
            borderRadius: '10px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: clinkRed,
          },
        }),
      }}
    >
      {children}
    </Box>
  );
};

const MuiInsuranceBox = ({ children, accordion }) => {
  return (
    <Grid
      item
      xs={12}
      lg={3}
      sx={{
        m: { xs: 1, lg: 0 },
        border: { xs: `1px solid ${lightPeriwinkle}`, lg: 0 },
        borderRadius: '3px',
        backgroundColor: { xs: white, lg: 'transparent' },
        ...(accordion && {
          minWidth: '192px',
        }),
      }}
      padding="0!important"
    >
      {children}
    </Grid>
  );
};

const MuiDownloadBox = ({ children, accordion }) => {
  return (
    <Box
      sx={{
        width: accordion ? 'unset' : '100%',
        ...(accordion && { position: 'absolute', bottom: 0, right: '20px' }),
      }}
    >
      {children}
    </Box>
  );
};

const MuiReferenceBox = ({ children, accordion }) => {
  return (
    <Grid
      item
      xs={12}
      md={6}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        p: accordion ? '0 12px 12px!important' : '0 16px 16px!important',
        ...(accordion && {
          minWidth: '345px',
        }),
      }}
    >
      {children}
    </Grid>
  );
};

const MuiEmptyReferenceBox = ({ children }) => {
  return (
    <Grid
      item
      xs={12}
      sx={{
        display: 'flex',
        color: japaneseIndigo,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '160px',
        margin: '0px 20px',
        fontWeight: 'bold',
      }}
    >
      <Typography sx={{ fontSize: '20px', textAlign: 'center' }}>
        {children}
      </Typography>
    </Grid>
  );
};

export {
  MuiScrollerContainer,
  MuiInsuranceBox,
  MuiDownloadBox,
  MuiReferenceBox,
  MuiEmptyReferenceBox,
};
