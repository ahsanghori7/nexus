import React from 'react';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { CONSTANTS } from 'clink-components';

const { platinum, elephant, lightBlue, white } = CONSTANTS.colors.general;
const { ptSans } = CONSTANTS.fonts;

const MuiChangeSubscriptionsModal = ({ children }) => (
  <Grid container sx={{ flexDirection: 'column', fontFamily: ptSans }}>
    {children}
  </Grid>
);

const MuiTitleWrapper = ({ children }) => (
  <Grid container sx={{ flexDirection: 'column' }}>
    {children}
  </Grid>
);

const MuiTitle = ({ children }) => (
  <Typography
    variant="h1"
    component="h2"
    sx={{
      textAlign: 'left',
      color: elephant,
      fontWeight: 'bold',
      lineHeight: '32px',
      fontSize: '28px',
    }}
  >
    {children}
  </Typography>
);

const MuiSmall = ({ children }) => (
  <Typography
    variant="h5"
    component="small"
    sx={{
      textAlign: 'left!important',
      color: elephant,
      fontWeight: 'bold',
      lineHeight: '18px',
      opacity: '0.75',
      margin: '2px',
    }}
  >
    {children}
  </Typography>
);

const MuiInputData = ({ children }) => (
  <Grid
    container
    sx={{
      width: '100%',
      '& .clink-form__input': {
        flex: '8',
        '& label': {
          padding: '4px',
          lineHeight: '1.5',
          fontSize: '16px',
          fontWeight: 700,
        },
        '& input': {
          fontSize: '16px',
          fontWeight: 'normal',
          color: elephant,
          height: '48px',
          border: `1px solid ${platinum}`,
          borderRadius: '5px',
          textIndent: '8px',
          '&::placeholder': {
            fontWeight: 'normal',
            fontSize: '16px',
            color: elephant,
            opacity: '0.5',
            textIndent: '8px',
          },
        },
      },
    }}
  >
    {children}
  </Grid>
);

const MuiFormSubscription = ({ children }) => (
  <Grid
    container
    sx={{
      flexWrap: 'nowrap',
      marginTop: '1rem',
      '& form': {
        width: '100%',
        minHeight: 'unset',
        display: 'flex',
      },
      "& div[class^='css-']": {
        width: ' 100%',
        flex: '8',
        '& label': {
          fontSize: '16px',
          color: elephant,
          fontWeight: 700,
        },
        '& .autocomplete-input-wrapper': {
          boxSizing: 'border-box',
          border: `1px solid ${platinum}`,
          borderRadius: '5px',
          padding: 0,
          height: '48px',
          '&.focused': {
            boxShadow: 'none',
          },
          '& input.autocomplete-search-input': {
            fontSize: '16px',
            fontWeight: 'normal',
            color: elephant,
            '&::placeholder': {
              fontWeight: 'normal',
              fontSize: '16px',
              color: elephant,
              opacity: '0.5',
            },
          },
        },
      },
    }}
  >
    {children}
  </Grid>
);

const MuiSaveBtnContainer = ({ children }) => (
  <Grid
    container
    sx={{
      flex: 2,
      justifyContent: 'end',
      alignItems: 'end',
    }}
  >
    {children}
  </Grid>
);

const MuiSaveBtn = ({ children, disabled, handleClick = () => null, ...rest }) => (
  <Button
    disabled={disabled}
    onClick={handleClick}
    {...rest}
    sx={{
      margin: 0,
      padding: 0,
      height: '48px',
      backgroundColor: lightBlue,
      color: white,
      fontSize: '16px',
      minWidth: '70px',
      cursor: 'pointer',
      fontWeight: 'bold',
      '&:disabled': {
        color: white,
        opacity: '0.75',
      },
      '&:hover': {
        backgroundColor: lightBlue,
      },
    }}
  >
    {children}
  </Button>
);

export {
  MuiChangeSubscriptionsModal,
  MuiTitleWrapper,
  MuiTitle,
  MuiSmall,
  MuiInputData,
  MuiFormSubscription,
  MuiSaveBtnContainer,
  MuiSaveBtn,
};
