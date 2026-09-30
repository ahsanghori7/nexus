import React from 'react';
import Grid from '@mui/material/Grid';

const MuiChartsContainer = ({ children }) => (
  <Grid container sx={{ flexDirection: 'column', height: '100%' }}>
    {children}
  </Grid>
);

const MuiDateRangeContainer = ({ children }) => (
  <Grid
    container
    sx={{
      padding: '10px',
      flexDirection: 'row',
      flexFlow: { xs: 'wrap', sm: 'nowrap' },
    }}
  >
    {children}
  </Grid>
);

const MuiCalendarContainer = ({ children }) => (
  <Grid
    container
    sx={{
      flexDirection: 'column',
      width: 'unset',
      flexBasis: '50%',
      '& > label': {
        paddingLeft: '10px',
      },
      '& .react-date-picker__wrapper': {
        height: '32px',
        marginLeft: '10px',
        '& .react-date-picker__inputGroup': {
          padding: '0 10px',
        },
      },
      '& .react-date-picker__calendar': {
        marginLeft: { xs: '10px', md: '-20px', lg: '-10px' },
        width: { xs: '222px' },
        inset: { sm: 'unset!important' },
      },
    }}
  >
    {children}
  </Grid>
);

const MuiChartsList = ({ children }) => (
  <Grid
    container
    sx={{
      padding: '10px',
      height: '100%',
      width: '100%',
      boxSizing: 'border-box',
      minHeight: '370px',
      justifyContent: 'center',
    }}
  >
    {children}
  </Grid>
);

export {
  MuiChartsContainer,
  MuiDateRangeContainer,
  MuiCalendarContainer,
  MuiChartsList,
};
