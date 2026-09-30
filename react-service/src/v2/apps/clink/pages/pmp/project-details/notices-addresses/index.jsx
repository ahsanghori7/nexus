import React, { useState } from 'react';
import Grid2 from '@mui/material/Grid2';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { CONSTANTS } from 'clink-components';
import i18next from 'v2/helpers/i18n';

const { lightPeriwinkle } = CONSTANTS.colors.general;

const NoticesAddresses = ({ useUpdateProject = {} }) => {
  const {
    useMainContractorPostal: [mainContractorPostal, setMainContractorPostal],
    useMainContractorEmail: [mainContractorEmail, setMainContractorEmail],
    useSubContractorPostal: [subContractorPostal, setSubContractorPostal],
    useSubContractorEmail: [subContractorEmail, setSubContractorEmail],
  } = useUpdateProject;

  const [mainEmailError, setMainEmailError] = useState('');
  const [subEmailError, setSubEmailError] = useState('');

  return (
    <Grid2
      size={{ xs: 12, md: 4 }}
      sx={{ width: '100% !important' }}
      container
      flexDirection="column"
    >
      <Grid2 borderBottom={`1px solid ${lightPeriwinkle}`} p={1.75}>
        <Typography sx={{ fontWeight: 600 }}>
          {i18next.t('addresses-for-notices')}
        </Typography>
      </Grid2>

      <Grid2 p={1.75} container spacing={2}>
        <Grid2 size={{ xs: 12 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            {i18next.t('main-contractor')}
          </Typography>
        </Grid2>

        <Grid2 size={{ xs: 12, md: 6 }} sx={{ mb: 1 }}>
          <TextField
            label={i18next.t('main-contractor-postal-address')}
            slotProps={{
              htmlInput: {
                'data-testid': 'notices-addresses-main-contractor-postal-input',
              },
            }}
            variant="outlined"
            fullWidth
            value={mainContractorPostal}
            onChange={(e) => setMainContractorPostal(e.target.value)}
          />
        </Grid2>

        <Grid2 size={{ xs: 12, md: 6 }} sx={{ mb: 1 }}>
          <TextField
            label={i18next.t('main-contractor-email-address')}
            slotProps={{
              htmlInput: {
                'data-testid': 'notices-addresses-main-contractor-email-input',
              },
            }}
            variant="outlined"
            fullWidth
            value={mainContractorEmail}
            onChange={(e) => {
              const val = e.target.value;
              setMainContractorEmail(val);
              if (val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
                setMainEmailError(i18next.t('invalid-email'));
              } else {
                setMainEmailError('');
              }
            }}
            placeholder={i18next.t('optional')}
            error={Boolean(mainEmailError)}
            helperText={mainEmailError || ' '}
          />
        </Grid2>

        <Grid2 size={{ xs: 12, mt: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            {i18next.t('subcontractor')}
          </Typography>
        </Grid2>

        <Grid2 size={{ xs: 12, md: 6 }} sx={{ mb: 1 }}>
          <TextField
            label={i18next.t('subcontractor-postal-address')}
            slotProps={{
              htmlInput: {
                'data-testid': 'notices-addresses-subcontractor-postal-input',
              },
            }}
            variant="outlined"
            fullWidth
            value={subContractorPostal}
            onChange={(e) => setSubContractorPostal(e.target.value)}
          />
        </Grid2>

        <Grid2 size={{ xs: 12, md: 6 }} sx={{ mb: 1 }}>
          <TextField
            label={i18next.t('subcontractor-email-address')}
            slotProps={{
              htmlInput: {
                'data-testid': 'notices-addresses-subcontractor-email-input',
              },
            }}
            variant="outlined"
            fullWidth
            value={subContractorEmail}
            onChange={(e) => {
              const val = e.target.value;
              setSubContractorEmail(val);
              if (val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
                setSubEmailError(i18next.t('invalid-email'));
              } else {
                setSubEmailError('');
              }
            }}
            placeholder={i18next.t('optional')}
            error={Boolean(subEmailError)}
            helperText={subEmailError || ' '}
          />
        </Grid2>
      </Grid2>
    </Grid2>
  );
};

export default NoticesAddresses;
