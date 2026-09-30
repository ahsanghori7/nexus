import React from 'react';
import { CONSTANTS } from 'clink-components';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import i18next from 'v2/helpers/i18n';
import parseCurrency, { currencyConfig } from 'v2/helpers/currency';
import { boqCardContentInsetRight } from './style';

const { eerieBlack, darkCharcoal } = CONSTANTS.colors.general;

const Footer = ({ total = 0, editing = false }) => {
  const formatted = parseCurrency(total, currencyConfig[i18next.t('currency')]);
  return (
    <Grid container sx={{ pb: 1 }}>
      <Grid item xs={8} />
      <Grid item xs={4} sx={{ pl: editing ? 2 : 6 }}>
        <Box sx={{ textAlign: 'right', ...boqCardContentInsetRight }}>
          <Typography
            component="div"
            sx={{
              fontSize: '13px',
              fontWeight: 400,
              color: darkCharcoal,
              opacity: 0.75,
              mb: 0.25,
            }}
          >
            Total
          </Typography>
          <Typography
            component="div"
            sx={{
              fontSize: '24px',
              fontWeight: 700,
              color: eerieBlack,
              lineHeight: 1.2,
            }}
          >
            {formatted}
          </Typography>
        </Box>
      </Grid>
    </Grid>
  );
};

export default Footer;
