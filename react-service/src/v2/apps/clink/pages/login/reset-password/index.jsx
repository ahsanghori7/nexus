import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { CONSTANTS } from 'clink-components';
import { goTo } from 'v2/helpers/url';
import {
  MuiFormField,
  MuiLoginWrapper,
  MuiTitle,
  MuiClinkImage,
  MuiLink,
} from '../mui.styled';

const { ghostWhite2, platinum2, ruby } = CONSTANTS.colors.general;

const ResetPassword = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const send = searchParams.get('send');

  const [formData, setFormData] = useState({
    email: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const roundBoxStyle = {
    backgroundColor: ghostWhite2,
    border: `1px solid ${platinum2}`,
    borderRadius: '12px',
    padding: {
      xs: '30px 30px 40px',
      sm: '30px 50px 40px',
      md: '30px 70px 40px',
    },
  };

  return (
    <MuiLoginWrapper data-testid="reset-password-page">
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
        {send === 'true' ? (
          <MuiTitle data-testid="reset-password-page-title" sx={{ color: ruby, px: 3, pb: 1 }}>
            {t('forgot-reset-password')}
          </MuiTitle>
        ) : null}
      </Box>

      {send === 'true' ? (
        <Box data-testid="reset-password-success-message" sx={{ ...roundBoxStyle, textAlign: 'center' }}>
          <Typography component="p" variant="forgotPassword">
            {t('forgot-reset-request')}
          </Typography>
          <Typography component="p" variant="forgotPassword">
            {t('forgot-receive-email')}
          </Typography>
          <MuiLink testid="reset-password-return-link" onClick={() => goTo(BASE_URLS.CLINK_HOST)}>
            {t('forgot-return')}
          </MuiLink>
        </Box>
      ) : (
        <Box component="form" method="POST" data-testid="reset-password-form" sx={roundBoxStyle}>
          <MuiFormField
            name="email"
            labelName={t('forgot-email')}
            value={formData.email}
            onChange={handleChange}
            type="email"
            testId="reset-password-email-input"
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
              data-testid="reset-password-submit-button"
              sx={{ height: 78, fontSize: 24, borderRadius: 50, width: 180 }}
              color="error"
              variant="contained"
              type="submit"
            >
              {t('forgot-submit')}
            </Button>
            <MuiLink data-testid="reset-password-back-to-login-link" onClick={() => navigate('/login')}>
              {t('forgot-login')}
            </MuiLink>
          </Box>
        </Box>
      )}
    </MuiLoginWrapper>
  );
};

export default ResetPassword;
