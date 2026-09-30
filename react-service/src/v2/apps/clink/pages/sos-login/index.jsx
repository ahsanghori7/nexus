import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import {
  MuiFormField,
  MuiLoginWrapper,
  MuiTitle,
  MuiClinkImage,
  MuiSSOError,
} from './mui.styled';
import { CONSTANTS } from 'clink-components';

const { ghostWhite2, platinum2 } = CONSTANTS.colors.general;

const SosLogin = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [showSnackbar, setShowSnackbar] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('success') === 'false') {
      setShowSnackbar(true);
    }
  }, [location]);

  const handleCloseSnackbar = () => {
    setShowSnackbar(false);
  };

  return (
    <MuiLoginWrapper>
      <Box
        sx={{
          justifyContent: 'center',
          display: 'flex',
          flexDirection: 'column',
          textAlign: 'center',
          mb: 2,
        }}
      >
        <MuiClinkImage />
        <MuiTitle>{t('login-sign-in')}</MuiTitle>
      </Box>
      <Box
        component="form"
        method="GET"
        action="/sign_up_check" // Form will GET to this endpoint
        sx={{
          backgroundColor: ghostWhite2,
          border: `1px solid ${platinum2}`,
          borderRadius: '12px',
          padding: { xs: '40px', sm: '40px 60px', md: '40px 80px' },
        }}
      >
        <MuiFormField
          name="email" // This will be the form field name in the POST data
          labelName={t('login-email')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
        />

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            textAlign: 'center',
            pt: 2,
            mt: 2,
          }}
        >
          <Button
            sx={{ height: 78, fontSize: 24, borderRadius: 50, width: 180 }}
            size="large"
            color="error"
            variant="contained"
            type="submit"
          >
            {t('sos-submit')}
          </Button>
        </Box>
      </Box>

      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        open={showSnackbar}
        onClose={handleCloseSnackbar}
        message={<MuiSSOError />}
        action={
          <IconButton variant="loginClose" onClick={handleCloseSnackbar}>
            <CloseIcon />
          </IconButton>
        }
      />
    </MuiLoginWrapper>
  );
};

export default SosLogin;
