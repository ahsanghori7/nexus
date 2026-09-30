import React, { useState } from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Grid2 from '@mui/material/Grid2';
import i18next from 'v2/helpers/i18n';
import { acceptStyle } from 'v2/apps/clink/pages/orders/subcontractors/modal/styles';
import { postData } from 'services/helpers';

const CLINK_RESOURCE = 'relay';
const CLINK_PARAMS = { action: 'account' };

const WitnessForm = ({
  did = '',
  open = {},
  dataref = '',
  subcontractor = {},
  initPage = () => null,
  triggerLoading = () => null,
  openWitnessModal = () => null,
}) => {
  const [emailError, setEmailError] = useState(false);
  const aid = subcontractor?.id && Number(subcontractor.id);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    setEmailError(false);

    const { dbKey } = open;

    if (dataref === 'docusign.contractor') {
      const data = {
        did,
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        role: 'witness',
        dbKey,
      };
      postData(
        CLINK_RESOURCE,
        data,
        '',
        { ...CLINK_PARAMS, method: 'teamInvite', did },
        '',
        '',
        '',
      )
        .then((result) => result.json())
        .then((result) => {
          if (result && !result.success) {
            setEmailError(true);
          }

          if (result && result.success) {
            triggerLoading(() => {
              initPage();
              openWitnessModal(false);
            });
          }
        })
        .catch((error) => {
          // eslint-disable-next-line no-console
          console.error(error);
          openWitnessModal(false);
        });
    } else if (dataref === 'docusign.subcontractor' && aid) {
      const data = {
        did,
        firstname: formData.firstName,
        lastname: formData.lastName,
        email: formData.email,
        role: 'Witness',
        dbKey,
      };
      postData(
        CLINK_RESOURCE,
        data,
        '',
        { ...CLINK_PARAMS, method: 'createWitness', aid, did },
        '',
        '',
        '',
      )
        .then((result) => result.json())
        .then((result) => {
          if (result && result.error) {
            setEmailError(true);
          }

          if (result && result.id) {
            triggerLoading(() => {
              initPage();
              openWitnessModal(false);
            });
          }
        })
        .catch((error) => {
          // eslint-disable-next-line no-console
          console.error(error);
          openWitnessModal(false);
        });
    }
  };

  const handleFormChange = (e) => {
    const newState = { ...formData, [e.target.name]: e.target.value };
    setFormData(newState);
  };

  return (
    <Grid2
      component="form"
      container
      spacing={2}
      maxWidth={400}
      sx={{ margin: '0 auto', flexDirection: 'column' }}
      onSubmit={handleSubmit}
    >
      <Grid2>
        <Typography variant="subtitle2" sx={{ textAlign: 'left' }} mb={0.5}>
          {i18next.t('profile-firstname')}
        </Typography>
        <TextField
          name="firstName"
          value={formData.firstName}
          onChange={handleFormChange}
          fullWidth
          required
          variant="outlined"
          InputLabelProps={{ shrink: false }}
          slotProps={{ htmlInput: { 'data-testid': 'document-creator-witness-first-name' } }}
        />
      </Grid2>

      <Grid2>
        <Typography variant="subtitle2" sx={{ textAlign: 'left' }} mb={0.5}>
          {i18next.t('profile-lastname')}
        </Typography>
        <TextField
          name="lastName"
          value={formData.lastName}
          onChange={handleFormChange}
          fullWidth
          required
          variant="outlined"
          InputLabelProps={{ shrink: false }}
          slotProps={{ htmlInput: { 'data-testid': 'document-creator-witness-last-name' } }}
        />
      </Grid2>

      <Grid2>
        <Typography variant="subtitle2" sx={{ textAlign: 'left' }} mb={0.5}>
          {i18next.t('email')}
        </Typography>
        <TextField
          name="email"
          type="email"
          value={formData.email}
          onChange={handleFormChange}
          fullWidth
          required
          variant="outlined"
          error={emailError}
          helperText={emailError ? i18next.t('witness-already-exists') : ''}
          InputLabelProps={{ shrink: false }}
          slotProps={{ htmlInput: { 'data-testid': 'document-creator-witness-email' } }}
          FormHelperTextProps={{
            sx: {
              fontSize: '12px',
              margin: 0,
              lineHeight: 1,
            },
          }}
        />
      </Grid2>

      <Grid2>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          sx={{ ...acceptStyle, margin: '16px auto 0' }}
          data-testid="document-creator-witness-submit-btn"
        >
          Submit
        </Button>
      </Grid2>
    </Grid2>
  );
};

export default WitnessForm;
