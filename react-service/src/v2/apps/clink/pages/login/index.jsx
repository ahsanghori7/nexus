import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { CONSTANTS } from 'clink-components';
import {
  MuiFormField,
  MuiLoginWrapper,
  MuiTitle,
  MuiClinkImage,
  MuiLink,
  MuiLoginError,
} from './mui.styled';

const { ghostWhite2, platinum2 } = CONSTANTS.colors.general;

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    username: '',
    pass: '',
  });
  const [disabled, setDisbaled] = useState(false)

  const [showSnackbar, setShowSnackbar] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('success') === 'false') {
      setShowSnackbar(true);
    }
    const encodedEmail = params.get('id');
    setDisbaled(!!encodedEmail)

    if (encodedEmail) {
      const decodedEmail = atob(encodedEmail);
      setFormData((prev) => ({ ...prev, username: decodedEmail }));
    }
  }, [location]);

  const handleCloseSnackbar = () => {
    setShowSnackbar(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  return (
    <MuiLoginWrapper data-testid="login-page">
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
        <MuiTitle data-testid="login-page-title">{t('login-sign-in')}</MuiTitle>
      </Box>

      <Box
        component="form"
        method="POST"
        action={'/login'}
        data-testid="login-form"
        sx={{
          backgroundColor: ghostWhite2,
          border: `1px solid ${platinum2}`,
          borderRadius: '12px',
          padding: { xs: '40px', sm: '40px 60px', md: '40px 80px' },
        }}
      >
        <input type="hidden" name="app" value="CLINK" />

        <MuiFormField
          name="username"
          labelName={t('login-email')}
          value={formData.username}
          onChange={handleChange}
          type="email"
          disabled={disabled}
          testId="login-email-input"
        />

        <MuiFormField
          name="pass"
          labelName={t('login-pass')}
          value={formData.pass}
          onChange={handleChange}
          type="password"
          testId="login-password-input"
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
            data-testid="login-submit-button"
            sx={{ height: 78, fontSize: 24, borderRadius: 50, width: 180 }}
            size="large"
            color="error"
            variant="contained"
            type="submit"
          >
            {t('login-sign-in')}
          </Button>
          <MuiLink testid="login-forgot-password-link" onClick={() => navigate('/reset-password')}>
            {t('login-forgot-pass')}
          </MuiLink>
        </Box>
      </Box>

      <Snackbar
        data-testid="login-error-snackbar"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        open={showSnackbar}
        onClose={handleCloseSnackbar}
        message={<MuiLoginError />}
        action={
          <IconButton data-testid="login-error-close-button" variant="loginClose" onClick={handleCloseSnackbar}>
            <CloseIcon />
          </IconButton>
        }
      />
    </MuiLoginWrapper>
  );
};

export default Login;
