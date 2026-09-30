import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { CONSTANTS } from 'clink-components';

const { clinkGreen, white } = CONSTANTS.colors.general;

const MuiFormField = ({
  onChange = () => null,
  value = '',
  name = '',
  type = 'text',
  errorMessage = '',
  labelName = 'labelName',
  disabled = false,
  testId = '',
}) => {
  MuiFormField.propTypes = {
    onChange: PropTypes.func,
    value: PropTypes.string,
    name: PropTypes.string,
    type: PropTypes.string,
    errorMessage: PropTypes.string,
    labelName: PropTypes.string,
    disabled: PropTypes.bool,
    testId: PropTypes.string,
  };
  return (
    <FormControl margin="normal">
      <Typography variant="loginLabel">{labelName}</Typography>
      <TextField
        variant="outlined"
        name={name}
        slotProps={{
          input: { readOnly: disabled },
          htmlInput: { 'data-testid': testId },
        }}
        value={value}
        type={type}
        onChange={onChange}
        error={Boolean(errorMessage)}
        helperText={errorMessage}
        required
        sx={{
          height: '64px',
          '&> div': {
            height: '64px !important',
            '&> input': { height: '64px !important' },
          },
        }} /* TODO: special input. To discuss if it needs a theme or not */
      />
    </FormControl>
  );
};

const MuiLoginWrapper = ({ children, ...props }) => {
  const theme = useTheme();

  MuiLoginWrapper.propTypes = {
    children: PropTypes.node,
  };

  return (
    <Box
      {...props}
      sx={{
        backgroundImage: `url(${BASE_URLS.APP_CLINK}/static/images/svg/clink-login-background.svg)`,
        backgroundSize: '650px',
        backgroundPosition: '-247px 105px',
        [theme.breakpoints.up('sm')]: {
          backgroundSize: 'unset',
          backgroundPosition: '450px 120px',
        },
        backgroundRepeat: 'no-repeat',
        minHeight: '100vh',
      }}
    >
      <Grid
        container
        alignItems="center"
        sx={{
          height: '100%',
          bgcolor: white,
          marginBottom: '-16px',
          background:
            'transparent linear-gradient(180deg, rgba(255,255,255,0.1) 58%, #ECECF4 107%) 0% 0% no-repeat padding-box',
          minHeight: '100vh',
        }}
      >
        <Box
          sx={{
            minWidth: 'auto',
            margin: 'auto',
            maxWidth: '500px',
            width: '100%',
            [theme.breakpoints.down('sm')]: {
              minWidth: 'calc(100vw - 40px)',
              margin: 'auto',
            },
          }}
        >
          {children}
        </Box>
      </Grid>
    </Box>
  );
};

const MuiTitle = ({ children, sx = {} }) => {
  return (
    <Typography variant="loginTitle" sx={sx}>
      {children}
    </Typography>
  );
};

MuiTitle.propTypes = {
  children: PropTypes.node,
  sx: PropTypes.object,
};

const MuiClinkImage = () => {
  return (
    <Box
      component="img"
      sx={{
        height: 'auto',
        width: 240,
        mx: 'auto',
        mb: 2,
        display: 'block',
      }}
      alt="Reset your password"
      src={`${BASE_URLS.APP_CLINK}/static/images/svg/clink-logo.svg`}
    />
  );
};

const MuiLink = ({ testid, children, onClick }) => {
  return (
    <Button
      onClick={onClick}
      data-testid={testid}
      sx={{
        fontSize: '16px',
        mt: 3,
        textDecoration: 'underline!important',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: clinkGreen,
        '&:hover': {
          color: clinkGreen,
        },
      }}
    >
      {children}
    </Button>
  );
};

MuiLink.propTypes = {
  testid: PropTypes.string,
  children: PropTypes.node,
  onClick: PropTypes.func,
};

const MuiLoginError = () => {
  const { t } = useTranslation();

  return (
    <Grid container>
      <Grid item>
        <Avatar
          sx={{ width: 80, height: 80, mr: 3 }}
          alt="Login error"
          src="https://app.c-link.com//static/images/png/wrong.png"
        />
      </Grid>
      <Grid item>
        <Box>
          <Typography component="p" variant="loginError">
            {t('login-error-title')}
          </Typography>
          <Typography>{t('login-error-content')}</Typography>
        </Box>
      </Grid>
    </Grid>
  );
};

export {
  MuiFormField,
  MuiLoginWrapper,
  MuiTitle,
  MuiClinkImage,
  MuiLink,
  MuiLoginError,
};
