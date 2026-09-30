import React from 'react';
import { useTranslation } from 'react-i18next';
import useMuiTheme from 'v2/apps/shared/components/muiTheme';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Packages from './Packages';

const PackageDetails = ({ tenders, service, size }) => {
  const theme = useMuiTheme('clink');
  const { palette } = theme;
  const { t } = useTranslation();
  return (
    <Paper>
      <Grid container sx={{ border: `1px solid ${palette.panelBorder.main}` }}>
        <Grid item xs={12} sx={{ height: '63px' }}>
          <Typography variant="title" p={1} m={1} pb={0.5}>
            {t('label-packages')}
          </Typography>
        </Grid>
        <Grid item container xs={12} pl={4} pr={0.75}>
          <Grid item xs={6} />
          <Grid item xs={2} sx={{ display: 'flex', justifyContent: 'center' }}>
            <Typography sx={{ fontSize: '10px' }}>{t('interests')}</Typography>
          </Grid>
          <Grid item xs={2} sx={{ display: 'flex', justifyContent: 'center' }}>
            <Typography sx={{ fontSize: '10px' }}>{t('quotes')}</Typography>
          </Grid>
          <Grid item xs={2} sx={{ display: 'flex', justifyContent: 'center' }}>
            <Typography sx={{ fontSize: '10px' }}>{t('status')}</Typography>
          </Grid>
        </Grid>
      </Grid>
      <Divider />
      <Packages theme={theme} tenders={tenders} service={service} size={size} />
    </Paper>
  );
};

export default PackageDetails;
