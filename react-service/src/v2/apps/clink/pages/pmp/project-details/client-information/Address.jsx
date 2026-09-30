import React from 'react';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import Grid2 from '@mui/material/Grid2';
import { CONSTANTS } from 'clink-components';
import i18next from 'v2/helpers/i18n';
import TextField from '@mui/material/TextField';

const { lightPeriwinkle } = CONSTANTS.colors.general;

const Address = ({ useUpdateProject = {} }) => {
  const {
    useClientAddressOne: [clientAddressOne, setClientAddressOne],
    useClientAddressTwo: [clientAddressTwo, setClientAddressTwo],
    useClientCity: [clientCity, setClientCity],
    useClientPostcode: [clientPostcode, setClientPostcode],
    useClientName: [clientName, setClientName],
    useClientRegNumber: [clientRegNumber, setClientRegNumber],
    useErrorsThree: [errors],
  } = useUpdateProject;
  return (
    <Grid2
      size={{ xs: 12, md: 4 }}
      sx={{ width: '100% !important' }}
      container
      flexDirection="column"
    >
      <Grid2 borderBottom={`1px solid ${lightPeriwinkle}`} p={1.75}>
        <Typography sx={{ fontWeight: 600 }}>
          {i18next.t('client-details')}
        </Typography>
      </Grid2>
      {errors?.length > 0 && (
        <Grid2 p={1.75}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {errors.map((error) => (
              <Typography key={error} variant="body2">
                {i18next.t(error)}
              </Typography>
            ))}
          </Alert>
        </Grid2>
      )}
      <Grid2 p={1.75} container spacing={2.5}>
        <Grid2 size={{ xs: 12, md: 6 }}>
          <TextField
            label={i18next.t('references-client_name')}
            variant="outlined"
            fullWidth
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
          />
        </Grid2>
        <Grid2 size={{ xs: 12, md: 6 }}>
          <TextField
            label={i18next.t('client-registration-number')}
            variant="outlined"
            fullWidth
            value={clientRegNumber}
            onChange={(e) => setClientRegNumber(e.target.value)}
          />
        </Grid2>
        <Grid2 size={{ xs: 12, md: 6 }}>
          <TextField
            label={i18next.t('address-line-1')}
            variant="outlined"
            fullWidth
            value={clientAddressOne}
            onChange={(e) => setClientAddressOne(e.target.value)}
          />
        </Grid2>
        <Grid2 size={{ xs: 12, md: 6 }}>
          <TextField
            label={i18next.t('address-line-2')}
            variant="outlined"
            fullWidth
            value={clientAddressTwo}
            onChange={(e) => setClientAddressTwo(e.target.value)}
          />
        </Grid2>
        <Grid2 size={{ xs: 12, md: 6 }}>
          <TextField
            label={i18next.t('city')}
            variant="outlined"
            fullWidth
            value={clientCity}
            onChange={(e) => setClientCity(e.target.value)}
          />
        </Grid2>
        <Grid2 size={{ xs: 12, md: 6 }}>
          <TextField
            label={i18next.t('postcode')}
            variant="outlined"
            fullWidth
            value={clientPostcode}
            onChange={(e) => setClientPostcode(e.target.value)}
          />
        </Grid2>
      </Grid2>
    </Grid2>
  );
};

export default Address;
