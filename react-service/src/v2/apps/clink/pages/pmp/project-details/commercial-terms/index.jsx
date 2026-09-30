import React from 'react';
import Grid2 from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import RadioGroup from '@mui/material/RadioGroup';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import { useTranslation } from 'react-i18next';
import { CONSTANTS } from 'clink-components';

const { lightPeriwinkle } = CONSTANTS.colors.general;

const CommercialTerms = ({ useUpdateProject }) => {
  const { t } = useTranslation();

  const {
    usePerformanceBond: [isPerformanceBond, setIsPerformanceBond],
  } = useUpdateProject;

  let performanceBondValue = null;
  if (isPerformanceBond === true) {
    performanceBondValue = 'true';
  } else if (isPerformanceBond === false) {
    performanceBondValue = 'false';
  }

  return (
    <Grid2
      size={{ xs: 12, md: 4 }}
      sx={{ width: '100% !important' }}
      container
      flexDirection="column"
    >
      <Grid2 borderBottom={`1px solid ${lightPeriwinkle}`} p={1.75}>
        <Typography sx={{ fontWeight: 600 }}>
          {t('commercial-terms')}
        </Typography>
      </Grid2>

      <Grid2 p={1.75} container spacing={2}>
        <Grid2 xs={12} md={6}>
          <FormControl>
            <FormLabel>{t('is-performance-bond')}</FormLabel>
            <RadioGroup
              row
              value={performanceBondValue}
              onChange={(e) => {
                const value = e.target.value === 'true';
                setIsPerformanceBond(value);
              }}
            >
              <FormControlLabel
                value="true"
                control={<Radio inputProps={{ 'data-testid': 'commercial-terms-performance-bond-yes-radio' }} />}
                label={t('yes')}
              />
              <FormControlLabel
                value="false"
                control={<Radio inputProps={{ 'data-testid': 'commercial-terms-performance-bond-no-radio' }} />}
                label={t('no')}
              />
            </RadioGroup>
          </FormControl>
        </Grid2>
      </Grid2>
    </Grid2>
  );
};

export default CommercialTerms;
