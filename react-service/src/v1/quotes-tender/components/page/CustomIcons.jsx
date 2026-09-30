import React from 'react';
import i18next from 'v2/helpers/i18n';
import { CONSTANTS } from 'clink-components';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';

const { clinkPurple, clinkRed, white } = CONSTANTS.colors.general;

const BudgetCost = () => (
  <Box sx={{ fontSize: '24px', color: clinkPurple }}>
    {i18next.t('currency')}
    {i18next.t('currency')}
  </Box>
);

const BudgetCostPerSquareFeet = ({ code }) => {
  const measureSystem = code === 'UK' ? 'ft²' : 'm²';
  return (
    <Grid
      container
      sx={{
        fontSize: '24px',
        color: clinkPurple,
      }}
    >
      <Grid
        item
        sx={{
          fontSize: '24px',
          margin: '0.2em 0',
        }}
      >
        {i18next.t('currency')}
        {i18next.t('currency')}
      </Grid>
      <Grid
        item
        sx={{
          fontSize: '14px',
          color: white,
          background: clinkPurple,
          borderRadius: '30px',
          width: '21px',
          textAlign: 'center',
          height: '21px',
          fontWeight: 'bold',
          paddingTop: '2px',
        }}
      >
        {measureSystem}
      </Grid>
    </Grid>
  );
};

const Profit = ({ color = clinkRed, down = true }) => (
  <Grid
    container
    sx={{
      alignItems: 'center',
      fontSize: '2em',
      color,
    }}
  >
    <Grid
      item
      sx={{
        color,
        '&:before': {
          content: '"↑"',
          display: 'block',
          color,
          fontSize: '18px',
          ...(down ? { opacity: 0.5 } : {}),
        },
      }}
    />
    <Grid
      item
      sx={{
        fontSize: '24px',
        margin: '0.2em 0',
      }}
    >
      {i18next.t('currency')}
    </Grid>
    <Grid
      item
      sx={{
        color,
        '&:before': {
          content: '"↓"',
          display: 'block',
          color,
          fontSize: '18px',
          ...(!down ? { opacity: 0.5 } : {}),
        },
      }}
    />
  </Grid>
);

export { BudgetCost, Profit, BudgetCostPerSquareFeet };
