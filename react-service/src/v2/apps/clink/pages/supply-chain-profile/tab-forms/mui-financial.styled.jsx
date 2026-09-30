import React from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import {
  FormControl,
  Radio,
  RadioGroup,
  FormControlLabel,
} from '@mui/material';
import flag from 'v2/helpers/flags';
import i18next from 'v2/helpers/i18n';
import { InputWithAdornment } from 'v2/apps/clink/pages/supply-chain-profile/inputs';
import { CONSTANTS } from 'clink-components';

const { clinkGreen, clinkLightPurple, aliceBlue, black, gray2, white } =
  CONSTANTS.colors.general;

const { SilverSand, lightGray2 } = CONSTANTS.colors.prosper;

const MuiFinancialInput = ({
  adornment = '-',
  value = 0,
  profitBeforeTax = 0,
}) => (
  <Box sx={{ flexBasis: '33%' }}>
    <Box
      sx={{
        '& .MuiInputAdornment-root': {
          minWidth: '120px',
          backgroundColor: clinkGreen,
          boxSizing: 'border-box',
          '&:after': {
            color: clinkGreen,
          },
        },
      }}
    >
      <InputWithAdornment adornment={adornment} value={value} />
    </Box>
    {flag('CLINK_PREQUAL_UPDATES') && (
      <Grid container>
        <Grid item xs={2} sx={{ position: 'relative' }}>
          <Box
            sx={{
              width: '20px',
              height: '20px',
              position: 'absolute',
              right: '-2px',
              top: '6px',
              borderBottom: `2px solid ${clinkLightPurple}`,
              borderLeft: `2px solid ${clinkLightPurple}`,
            }}
          />
        </Grid>
        <Grid
          item
          xs={10}
          sx={{
            marginTop: '6px',
            '& .MuiInputAdornment-root': {
              minWidth: '118px',
              backgroundColor: aliceBlue,
              borderRight: `1px solid ${SilverSand}`,
              '& .MuiTypography-root': {
                fontSize: '14px',
                fontWeight: 500,
                color: black,
              },
            },
            '& .MuiOutlinedInput-root.Mui-disabled .MuiOutlinedInput-notchedOutline':
              {
                borderColor: SilverSand,
              },
          }}
        >
          <InputWithAdornment
            adornment={i18next.t('profit-before-tax')}
            value={profitBeforeTax}
          />
        </Grid>
      </Grid>
    )}
  </Box>
);

const RadioCheckbox = ({ checkboxValue = 'yes' }) => (
  <FormControlLabel
    sx={{ flexDirection: 'row-reverse' }}
    value={checkboxValue}
    control={
      <Radio
        icon={
          <Box
            sx={{
              width: '18px',
              height: '18px',
              bgcolor: white,
              border: `1px solid ${lightGray2}`,
              borderRadius: '5px',
            }}
          />
        }
        checkedIcon={
          <Box
            sx={{
              width: '18px',
              height: '18px',
              borderRadius: '5px',
              bgcolor: clinkGreen,
              border: `1px solid ${lightGray2}`,
            }}
          />
        }
        sx={{
          '&:hover': {
            bgcolor: 'transparent',
            '& svg': {
              display: 'none',
            },
          },
          '&.Mui-checked:hover': {
            bgcolor: 'transparent',
          },

          '&.MuiRadio-root': {
            pt: 0,
            pb: 0,
          },
        }}
      />
    }
    label={checkboxValue}
  />
);

const SquareRadiobox = ({ value }) => {
  return (
    <FormControl component="fieldset">
      <RadioGroup
        defaultValue={value ? value.toLowerCase() : undefined}
        aria-label="Yes or No"
        name="yes-no"
        row
      >
        <RadioCheckbox checkboxValue="yes" />
        <RadioCheckbox checkboxValue="no" />
      </RadioGroup>
    </FormControl>
  );
};

const MuiLabel = ({ children }) => (
  <Typography sx={{ fontSize: '14px', color: gray2, lineHeight: '1' }}>
    {children}
  </Typography>
);

const MuiLabelContent = ({ children }) => (
  <Typography sx={{ fontSize: '16px', color: black, lineHeight: '1.1', mb: 1 }}>
    {children}
  </Typography>
);

const MuiFinancialOptions = ({ value = '', option = '' }) => (
  <Grid
    item
    container
    xs={12}
    sx={{ alignItems: 'center', height: 'fit-content' }}
  >
    <Box sx={{ flexBasis: 'calc(100% - 140px)', pl: 2 }}>
      <Typography sx={{ fontSize: '14px', lineHeight: '1.1' }}>
        {option}
      </Typography>
    </Box>
    <Box sx={{ flexBasis: '140px', pl: 1 }}>
      <SquareRadiobox value={value} />
    </Box>
  </Grid>
);

const MuiFinancialDetails = ({ data = {} }) =>
  (flag('CLINK_PREQUAL_UPDATES') && (
    <Grid container sx={{ pt: 2 }}>
      <Grid container item sx={{ flexBasis: '45%' }}>
        <Grid
          item
          xs={5}
          sx={{ borderRight: `1px solid ${lightGray2}`, pr: 1, pl: 1 }}
        >
          <MuiLabel>{i18next.t('financial-bank-details')}:</MuiLabel>
          <MuiLabelContent>{data.bank_name || ''}</MuiLabelContent>
        </Grid>
        <Grid
          item
          xs={3}
          sx={{ borderRight: `1px solid ${lightGray2}`, pr: 1, pl: 2 }}
        >
          <MuiLabel>{i18next.t('financial-sort-code')}:</MuiLabel>
          <MuiLabelContent>{data.sort_code || ''}</MuiLabelContent>
          <MuiLabel>{i18next.t('financial-account-number')}:</MuiLabel>
          <MuiLabelContent>{data.account_number || ''}</MuiLabelContent>
        </Grid>
        <Grid
          item
          xs={4}
          sx={{ borderRight: `1px solid ${lightGray2}`, pr: 1, pl: 2 }}
        >
          <MuiLabel>{i18next.t('financial-vat-no')}:</MuiLabel>
          <MuiLabelContent>{data.vat_number || ''}</MuiLabelContent>
          <MuiLabel>{i18next.t('financial-utr-no')}:</MuiLabel>
          <MuiLabelContent>{data.utr_number || ''}</MuiLabelContent>
        </Grid>
      </Grid>
      <Grid container item sx={{ flexBasis: '55%', display: 'block' }}>
        <MuiFinancialOptions
          value={data.performance_guarantee_bonds}
          option={i18next.t('company-performance-guarantee-bonds')}
        />
        <MuiFinancialOptions
          value={data.collateral_warranties}
          option={i18next.t('company-collateral-warranties')}
        />
      </Grid>
    </Grid>
  )) ||
  null;

export { MuiFinancialInput, MuiFinancialDetails, MuiFinancialOptions };
