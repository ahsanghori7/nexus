import React from 'react';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import Grid2 from '@mui/material/Grid2';
import { CONSTANTS } from 'clink-components';
import i18next from 'v2/helpers/i18n';
import TextField from '@mui/material/TextField';
import Search from './Search';
import OpeningHours from './OpeningHours';
import SiteConstraints from './SiteConstraints';

const { lightPeriwinkle } = CONSTANTS.colors.general;

const SiteDetails = ({ useUpdateProject = {} }) => {
  const {
    useAddressOne: [addressOne, setAddressOne],
    useAddressTwo: [addressTwo, setAddressTwo],
    useCity: [city, setCity],
    usePostcode: [postcode, setPostcode],
    useErrorsOne: [errors],
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
          {i18next.t('site-details')}
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
      <Grid2 p={1.75} container spacing={2}>
        <Grid2 size={{ xs: 12, md: 6 }}>
          <TextField
            slotProps={{
              htmlInput: { 'data-testid': 'site-details-address-line-1-input' },
            }}
            label={i18next.t('address-line-1')}
            variant="outlined"
            fullWidth
            value={addressOne}
            onChange={(e) => setAddressOne(e.target.value)}
          />
        </Grid2>
        <Grid2 size={{ xs: 12, md: 6 }}>
          <TextField
            slotProps={{
              htmlInput: { 'data-testid': 'site-details-address-line-2-input' },
            }}
            label={i18next.t('address-line-2')}
            variant="outlined"
            fullWidth
            value={addressTwo}
            onChange={(e) => setAddressTwo(e.target.value)}
          />
        </Grid2>
        <Grid2 size={{ xs: 12, md: 6 }}>
          <TextField
            slotProps={{
              htmlInput: { 'data-testid': 'site-details-city-input' },
            }}
            label={i18next.t('city')}
            variant="outlined"
            fullWidth
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </Grid2>
        <Grid2 size={{ xs: 12, md: 6 }}>
          <TextField
            slotProps={{
              htmlInput: { 'data-testid': 'site-details-postcode-input' },
            }}
            label={i18next.t('postcode')}
            variant="outlined"
            fullWidth
            value={postcode}
            onChange={(e) => setPostcode(e.target.value)}
          />
        </Grid2>
      </Grid2>
    </Grid2>
  );
};

export default SiteDetails;
export { Search, OpeningHours, SiteConstraints };
