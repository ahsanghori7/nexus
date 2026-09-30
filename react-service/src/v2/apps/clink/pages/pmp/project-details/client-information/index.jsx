import React, { useState } from 'react';
import Button from '@mui/material/Button';
import Grid2 from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import { useTranslation } from 'react-i18next';
import { Search } from 'v2/apps/clink/pages/pmp/project-details/site-constraints';
import Address from './Address';

const ClientInformation = ({ useUpdate, isUk = true }) => {
  const { t } = useTranslation();
  const [clientSearch, setClientSearch] = useState(isUk);
  const { useClientRegNumber, useClientName, useErrorsThree } = useUpdate;

  const {
    useClientContactName: [clientContactName, setClientContactName],
    useClientContactEmail: [clientContactEmail, setClientContactEmail],
    useClientContactPostalCode: [
      clientContactPostalCode,
      setClientContactPostalCode,
    ],
  } = useUpdate;

  const [emailError, setEmailError] = useState('');
  return (
    <>
      {clientSearch ? (
        <Search
          client
          useUpdateProject={{
            useClientRegNumber,
            useClientName,
            useAddressOne: useUpdate.useClientAddressOne,
            useAddressTwo: useUpdate.useClientAddressTwo,
            useCity: useUpdate.useClientCity,
            usePostcode: useUpdate.useClientPostcode,
            useErrorsOne: useErrorsThree,
          }}
        />
      ) : (
        <Address useUpdateProject={useUpdate} />
      )}
      {isUk && (
        <Grid2 p={1.75} container spacing={2}>
          <Grid2 size={{ xs: 12, md: 6 }}>
            <Button
              data-testid="client-info-toggle-address-button"
              variant="text"
              onClick={() => setClientSearch(!clientSearch)}
              sx={{ m: 2 }}
            >
              {clientSearch
                ? t('enter-address-manually')
                : t('search-spostcode')}
            </Button>
          </Grid2>
        </Grid2>
      )}
      <Grid2
        size={{ xs: 12, md: 4 }}
        sx={{ width: '100% !important' }}
        container
        flexDirection="column"
      >
        <Grid2 p={1.75} container spacing={2.5}>
          <Grid2 size={{ xs: 12 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              {t('client-contact-notices')}
            </Typography>
          </Grid2>
          <Grid2 size={{ xs: 12, md: 6 }}>
            <TextField
              slotProps={{
                htmlInput: { 'data-testid': 'client-info-contact-name-input' },
              }}
              label={t('name')}
              variant="outlined"
              fullWidth
              value={clientContactName}
              onChange={(e) => setClientContactName(e.target.value)}
            />
          </Grid2>

          <Grid2 size={{ xs: 12, md: 6 }}>
            <TextField
              slotProps={{
                htmlInput: { 'data-testid': 'client-info-contact-email-input' },
              }}
              label={t('email')}
              variant="outlined"
              fullWidth
              value={clientContactEmail}
              onChange={(e) => {
                const val = e.target.value;
                setClientContactEmail(val);
                if (val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
                  setEmailError(t('invalid-email'));
                } else {
                  setEmailError('');
                }
              }}
              placeholder={t('optional')}
              error={Boolean(emailError)}
              helperText={emailError || ' '}
            />
          </Grid2>

          <Grid2 size={{ xs: 12, md: 6 }}>
            <TextField
              slotProps={{
                htmlInput: { 'data-testid': 'client-info-contact-postal-code-input' },
              }}
              label={t('postal-code')}
              variant="outlined"
              fullWidth
              value={clientContactPostalCode}
              onChange={(e) => setClientContactPostalCode(e.target.value)}
            />
          </Grid2>
        </Grid2>
      </Grid2>
    </>
  );
};

export default ClientInformation;
