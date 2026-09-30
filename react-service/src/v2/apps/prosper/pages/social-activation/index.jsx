import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { useContext } from 'hooks/context';
import {
  CONSTANTS,
  Image,
  Form as ClinkForm,
  InputForm,
  InputFormControlled,
} from 'clink-components';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import Button from '@mui/material/Button';

import PHPGloblals from 'v2/helpers/php-globals';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';


const { prosperLogoFull } = CONSTANTS.s3;
const { prosperBoxRed, prosperRedBorder, gray } = CONSTANTS.colors.prosper;
const {
  aliceBlue,
  brightGray3,
  azureishWhite,
  clinkRed,
  black,
  white,
  prosperBoxGreen,
} = CONSTANTS.colors.general;

const checkboxStyles = {
  pt: 3,
  '& .checkbox-input-wrapper': {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  a: {
    color: clinkRed,
    textDecorationColor: clinkRed,
    fontWeight: 'bold',
  },
  '& .clink-form__error': {
    left: 'calc(50% - 60px)',
    bottom: '-8px',
  },
  input: {
    m: 0,
    mr: 1,
    '-webkit-appearance': 'none',
    appearance: 'none',
    backgroundColor: white,
    margin: 0,
    color: prosperBoxGreen,
    width: '30px',
    height: '30px',
    fontSize: '40px',
    border: `1px solid ${gray}`,
    borderRadius: '4px',
    display: 'grid',
    placeContent: 'center',

    '&::before': {
      borderColor: prosperBoxGreen,
      content: '""',
      width: '20px',
      height: '20px',
      clipPath: 'polygon(10% 44%, 0% 60%, 50% 90%, 90% 10%, 75% 0%, 43% 62%)',
      transform: 'scale(0)',
      boxShadow: 'inset 30px 30px #71BB6F',
    },

    '&:checked': {
      border: `2px solid ${prosperRedBorder}`,

      '&::before': {
        transform: 'scale(1)',
      },
    },
  },
};

const SocialActivation = ({ dispatch }) => {
  const conf = PHPGloblals();
  const { t } = useTranslation();
  const context = useContext(BASE_DIRS.V2.PROSPER);
  const { actions } = context;

  const [accountName, setAccountName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [accountEmail, setAccountEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [accountCreatePassword, setAccountCreatePassword] = useState('');
  const [accountConfirmPassword, setAccountConfirmPassword] = useState('');
  const [submitDisabled, setSubmitDisabled] = useState(true);
  const [policyCheck, setPolicyCheck] = useState(false);
  const [tokenId, setTokenId] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (conf && conf.data) {
      const { data } = conf;
      const { token } = data;
      setAccountName(data.company_name);
      setAccountEmail(data.email);
      setFirstName(data.firstname);
      setLastName(data.lastname);
      setPhone(data.phone);
      setTokenId(token);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (
      accountCreatePassword.length > 5 &&
      accountCreatePassword === accountConfirmPassword &&
      policyCheck === true
    ) {
      setSubmitDisabled(false);
    } else {
      setSubmitDisabled(true);
    }
  }, [accountCreatePassword, accountConfirmPassword, policyCheck]);

  return (
    <Paper
      sx={{ backgroundColor: aliceBlue, minHeight: 'calc(100vh - 145px)' }}
    >
      <AppBar
        position="absolute"
        component="nav"
        sx={{ backgroundColor: 'white' }}
      >
        <Toolbar
          sx={{
            maxWidth: '740px',
            width: '100%',
            margin: { xs: '0 auto', sm: '30px auto' },
            boxSizing: 'border-box',
            padding: '24px',
            '& img': { maxWidth: { xs: '120px', sm: 'initial' } },
          }}
        >
          <Box component="div" sx={{ flexGrow: 1, display: 'block' }}>
            <Image src={prosperLogoFull} />
          </Box>
          <Typography
            variant="h4"
            sx={{
              display: 'block',
              color: 'black',
              fontSize: { xs: '19px', sm: '27px' },
              fontWeight: 'bold',
            }}
          >
            {t('sa-account-activation')}
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        component="div"
        sx={{
          p: 0,
          width: '100%',
          margin: { xs: '75px auto 0', sm: '145px auto 0' },
          boxSizing: 'border-box',
        }}
      >
        <ClinkForm
          onSubmit={async (e) => {
            if (e.password === accountConfirmPassword) {

              const res = await dispatch(
                actions.activateTeamAccount({
                  tokenId,
                  data: {
                    firstname: firstName,
                    lastname: lastName,
                    email: accountEmail,
                    phone: e.phone,
                    password: e.password,
                  },
                })
              ).unwrap(); // Note: .unwrap() for createAsyncThunk
              if (res?.data && res?.data?.success) {
                navigate('/dashboard');
              }
            } else {
              setSubmitDisabled(true);
            }
          }}
          render={(formHook) => {
            const { formState, register, control } = formHook;
            const { errors } = formState;

            return (
              <Box
                sx={{
                  input: {
                    boxSizing: 'border-box',
                    height: '48px',
                    borderRadius: '4px',
                    mb: 2,
                    '&:focus': {
                      borderRadius: '4px',
                    },
                    '&[type=number]': {
                      '-moz-appearance': 'textfield',
                    },
                    '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button':
                    {
                      '-webkit-appearance': 'none',
                      margin: 0,
                    },
                  },
                  '& input[disabled]': {
                    backgroundColor: brightGray3,
                    color: black,
                  },
                  label: { mb: 1, fontWeight: 'bold' },
                  '& .clink-form__input': { position: 'relative' },
                  '& .clink-form__error': {
                    fontSize: '10px',
                    position: 'absolute',
                    bottom: 0,
                  },
                }}
              >
                <Box>
                  <Box
                    sx={{
                      p: 3,
                      margin: '0 auto',
                      maxWidth: '690px',
                    }}
                  >
                    <Typography
                      component="div"
                      variant="h5"
                      sx={{ fontWeight: 'bold', mb: 4 }}
                    >
                      {t('sa-your-details')}
                    </Typography>
                    <Typography
                      variant="p"
                      sx={{ display: 'block', lineHeight: '1.5' }}
                    >
                      {`${t('sa-prosper-account-name-1')} ${accountName} ${t(
                        'sa-prosper-account-name-2',
                      )}`}
                    </Typography>
                  </Box>
                  <Box sx={{ p: 3, margin: '0 auto', maxWidth: '690px' }}>
                    <Grid
                      container
                      columnSpacing={2}
                      rowSpacing={2}
                      sx={{ mt: { xs: 0 } }}
                    >
                      <Grid item xs={12} sm={6}>
                        <InputForm
                          autoComplete="firstname"
                          label={t('profile-firstname')}
                          errors={errors}
                          name="firstname"
                          type="text"
                          register={register}
                          value={firstName}
                          rules={{
                            required: !firstName
                              ? `${t('profile-firstname')} required`
                              : null,
                            onChange: (e) => {
                              setFirstName(e.target.value);
                            },
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <InputForm
                          autoComplete="lastname"
                          label={t('profile-lastname')}
                          errors={errors}
                          name="lastname"
                          type="text"
                          register={register}
                          value={lastName}
                          rules={{
                            required: !lastName
                              ? `${t('profile-lastname')} required`
                              : null,
                            onChange: (e) => {
                              setLastName(e.target.value);
                            },
                          }}
                        />
                      </Grid>
                    </Grid>
                    <Grid
                      container
                      columnSpacing={2}
                      rowSpacing={2}
                      sx={{ mt: { xs: 0 } }}
                    >
                      <Grid item xs={12} sm={6}>
                        <InputForm
                          autoComplete="email"
                          label={t('sa-email-address')}
                          errors={errors}
                          name="email"
                          type="text"
                          register={register}
                          value={accountEmail}
                          disabled
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                      <InputForm
                        autoComplete="email"
                        label={t('sa-phone')}
                        errors={errors}
                        name="phone"
                        type="number"
                        register={register}
                        value={phone}
                        rules={{
                          onChange: (e) => setPhone(e.target.value),
                        }}
                      />
                      </Grid>
                    </Grid>
                  </Box>
                </Box>
                <Box
                  sx={{
                    backgroundColor: brightGray3,
                    borderTop: `1px solid ${azureishWhite}`,
                    pt: 5,
                    pb: 5,
                  }}
                >
                  <Box
                    sx={{
                      pl: 3,
                      pr: 3,
                      margin: '0 auto',
                      maxWidth: '690px',
                    }}
                  >
                    <Typography
                      variant="h5"
                      component="div"
                      sx={{ fontWeight: 600 }}
                    >
                      {t('sa-password')}{' '}
                      <Typography
                        variant="h5"
                        component="span"
                        sx={{
                          color: clinkRed,
                        }}
                      >
                        - {t('sa-please-create-password')}
                      </Typography>
                    </Typography>
                  </Box>
                  <Box sx={{ p: 3, margin: '0 auto', maxWidth: '690px' }}>
                    <Grid
                      container
                      columnSpacing={2}
                      rowSpacing={2}
                      sx={{ '& input': { boxSizing: 'border-box' } }}
                    >
                      <Grid item xs={12} sm={6}>
                        <InputFormControlled
                          autoComplete="password"
                          label={t('sa-create-password')}
                          errors={errors}
                          name="password"
                          type="password"
                          register={register}
                          control={control}
                          value={accountCreatePassword}
                          rules={{
                            required: `${t('sa-create-password')}`,
                            onChange: (e) => {
                              setAccountCreatePassword(e.target.value);
                            },
                          }}
                          placeholder="*******"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <InputFormControlled
                          autoComplete="repeat_password"
                          label={t('sa-confirm-password')}
                          errors={errors}
                          name="repeat_password"
                          type="password"
                          register={register}
                          control={control}
                          value={accountConfirmPassword}
                          rules={{
                            required: `${t('sa-confirm-password')}`,
                            onChange: (e) => {
                              setAccountConfirmPassword(e.target.value);
                              if (accountCreatePassword.length > 5) {
                                setSubmitDisabled(false);
                              }
                            },
                          }}
                          placeholder="*******"
                        />
                      </Grid>
                    </Grid>
                    <Box sx={checkboxStyles}>
                      <InputFormControlled
                        autoComplete="tba"
                        errors={errors}
                        options={[
                          {
                            label: (
                              <Typography variant="p" sx={{ fontSize: '12px' }}>
                                {t('sa-accept-terms-continue')}{' '}
                                <Link
                                  rel="noopener"
                                  target="_blank"
                                  href={`${BASE_URLS.SITE_PROSPER}/terms-and-conditions/`}
                                >
                                  {t('sa-terms')}
                                </Link>{' '}
                                and{' '}
                                <Link
                                  rel="noopener"
                                  target="_blank"
                                  href={`${BASE_URLS.SITE_PROSPER}/privacy-policy/`}
                                >
                                  {t('sa-privacy-policy')}
                                </Link>
                              </Typography>
                            ),
                            value: 1,
                          },
                        ]}
                        name="terms"
                        type="checkbox"
                        register={register}
                        control={control}
                        checked={policyCheck}
                        rules={{
                          required: t('sa-accept-terms'),
                          onChange: () => {
                            setPolicyCheck(!policyCheck);
                          },
                        }}
                      />
                    </Box>
                  </Box>
                </Box>
                <Box
                  sx={{
                    minHeight: '200px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Button
                    id="submit-button"
                    type="submit"
                    size="large"
                    variant="contained"
                    sx={{
                      textTransform: 'none',
                      backgroundColor: prosperBoxRed,
                      fontSize: { xs: '17px', sm: '21px' },
                      fontWeight: 600,
                      width: { xs: 'auto', sm: '327px' },
                      margin: '0 auto',
                      display: 'flex',
                      height: { xs: '47px', sm: '73px' },
                      '&:hover': { backgroundColor: prosperRedBorder },
                    }}
                    disabled={submitDisabled}
                  >
                    {t('sa-activate-account')}
                  </Button>
                </Box>
              </Box>
            );
          }}
        />
      </Box>
    </Paper>
  );
};

const mapStateToProps = (state) => {
  return {
    teamManager: state.activateTeamAccount,
    subcontractor: state.subcontractor,
  };
};

export default connect(mapStateToProps)(SocialActivation);
