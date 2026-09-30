import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import i18next from 'v2/helpers/i18n';
import parseCurrency, { currencyConfig } from 'v2/helpers/currency';

const totalStyles = {
  fontSize: '24px',
  fontWeight: 600,
  textAlign: 'center',
};
/**
 * @param packageLabel
 * @returns {JSX.Element}
 * @constructor
 */
const TenderBoqDescription = ({ totalBudget, packageLabel = '' }) => (
  <Box
    sx={{
      p: 1,
      height: '260px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-evenly',
    }}
  >
    <Typography
      sx={{
        fontSize: '16px',
        fontWeight: 600,
        textAlign: 'center',
        mt: 1,
      }}
    >
      {i18next.t('compare-quotes-for')}
    </Typography>
    <Typography
      sx={{
        fontSize: '32px',
        fontWeight: 600,
        mb: 3,
        textAlign: 'center',
      }}
    >
      {packageLabel}
    </Typography>
    {Boolean(totalBudget) && (
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Box>
          <Typography sx={totalStyles}>
            {`${i18next.t('total-budget')}:`}
          </Typography>
          <Typography sx={{ ...totalStyles, fontWeight: 'bold' }}>
            {parseCurrency(totalBudget, currencyConfig[i18next.t('currency')])}
          </Typography>
        </Box>
      </Box>
    )}
  </Box>
);

export default TenderBoqDescription;
