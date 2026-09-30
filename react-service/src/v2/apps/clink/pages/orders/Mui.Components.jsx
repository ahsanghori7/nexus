import React from 'react';
import { createTheme } from '@mui/material/styles';
import Grid from '@mui/material/Grid';
import { CONSTANTS } from 'clink-components';

const { clinkBackgroundPurple, clinkLightPurple } = CONSTANTS.colors.general;
const { proxima_nova1, proxima_nova2 } = CONSTANTS.fonts;

const themeTable = createTheme({
  components: {
    MuiTableContainer: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-root': {
            opacity: '0.5',
            fontWeight: 500,
            border: 'none',
          },
        },
      },
    },
    MuiTableBody: {
      styleOverrides: {
        root: {
          '& .MuiTableRow-root': {
            '&:nth-of-type(odd)': {
              backgroundColor: `${clinkBackgroundPurple}75`,
            },
            '&:last-child': {
              '& .MuiTableCell-root': {
                borderBottom: 'none',
              },
            },
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontSize: '13px',
          fontWeight: 600,
          borderRight: `1px solid ${clinkLightPurple}`,
          fontFamily: `${proxima_nova1}, ${proxima_nova2}`,

          '&:last-child': {
            borderRight: 'none',
          },
          '&:nth-of-type(1)': {
            width: '17%',
          },
          '&:nth-of-type(2)': {
            width: '10%',
          },
          '&:nth-of-type(3)': {
            width: '29%',
          },
          '&:nth-of-type(4)': {
            width: '17%',
          },
          '&:nth-of-type(5)': {
            width: '27%',
          },
        },
      },
    },
    MuiGrid: {
      styleOverrides: {
        container: {
          flexWrap: 'nowrap',
          margin: 0,
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          maxWidth: '40px',
          maxHeight: '40px',
          width: 'auto',
          height: 'auto',

          '& img, svg': {
            width: '100%',
            height: 'auto',
          },
        },
      },
    },
  },
});

const AvtarGridContainer = ({ children }) => (
  <Grid
    item
    sx={{
      width: '50px',
      height: '50px',
      padding: '0!important',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexBasis: '50px',
      minWidth: '49px',
    }}
  >
    {children}
  </Grid>
);

const CompanyGridContainer = ({ children }) => (
  <Grid
    item
    sx={{
      padding: '0 0 0 10px!important',
      display: 'flex',
      alignItems: 'center',
    }}
  >
    {children}
  </Grid>
);

const StatusGridContainer = ({ children }) => (
  <Grid
    container
    sx={{
      width: '100%',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}
  >
    {children}
  </Grid>
);

export {
  themeTable,
  AvtarGridContainer,
  CompanyGridContainer,
  StatusGridContainer,
};
