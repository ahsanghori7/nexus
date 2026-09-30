import React, { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Radio from '@mui/material/Radio';
import Typography from '@mui/material/Typography';
import RadioGroup from '@mui/material/RadioGroup';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import { CONSTANTS } from 'clink-components';
import { MuiSubtitle } from 'v2/apps/shared/components/company-v2/Mui.styled';
import Input from './FinanceInput';

const { darkJungleGreen, white } = CONSTANTS.colors.general;
const { prosperBoxRed, lightGray2 } = CONSTANTS.colors.prosper;

const RadioCheckbox = forwardRef(({ value = '', label = '' }, ref) => (
  <FormControlLabel
    ref={ref}
    sx={{
      flexDirection: 'row-reverse',
      mt: '4px !important',
      color: `${darkJungleGreen} !important`,
    }}
    value={value}
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
              bgcolor: prosperBoxRed,
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
    label={label}
  />
));

const QuestionCheckbox = ({
  name = '',
  label = '',
  value = '',
  register,
  errors,
  setValue,
  changeCompanyData,
}) => {
  const { t } = useTranslation();
  const answerRef = register(name, {});
  return (
    <Grid container item xs={12}>
      <Grid item xs={6} md={9} sx={{ display: 'flex', alignItems: 'center' }}>
        <Typography
          sx={{
            fontWeight: 'bold',
            fontSize: '14px',
            lineHeight: '1.1',
            color: 'rgba(0, 0, 0, 0.6)',
          }}
        >
          {label}
        </Typography>
      </Grid>
      <Grid item xs={6} md={3} sx={{ display: 'flex', justifyContent: 'end' }}>
        <FormControl component="fieldset">
          <RadioGroup
            aria-label={t('yes_or_no')}
            onChange={(e) => {
              if (setValue) {
                setValue(name, e.target.value);
              }
              if (changeCompanyData) {
                changeCompanyData(e.target.value, name);
              }
              answerRef.onChange(e);
            }}
            defaultValue={value}
            row
          >
            <RadioCheckbox
              label={t('yes')}
              value={t('yes')}
              ref={answerRef.ref}
            />
            <RadioCheckbox
              label={t('no')}
              value={t('no')}
              ref={answerRef.ref}
            />
          </RadioGroup>
        </FormControl>
      </Grid>
      <Grid item xs={12} sx={{ ml: '14px' }}>
        <FormHelperText sx={{ mt: 0, mb: 1 }} error>
          {errors[name]?.message}
        </FormHelperText>
      </Grid>
    </Grid>
  );
};

const CIS = ({
  register,
  errors,
  setValue,
  validation,
  collateralWarranties = '',
  performanceGuaranteeBonds = '',
  changeCompanyData = () => null,
}) => {
  const { t } = useTranslation();
  return (
    <div>
      <MuiSubtitle>{t('prequalification-cis_details')}</MuiSubtitle>
      <Grid
        container
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column' },
        }}
      >
        <Grid item xs={12}>
          <Input
            sx={{ mb: 2, width: '100%' }}
            label={t('inland-revenue-utr-no')}
            adornmentWidth="400px"
            labelAdornment
            name="utr_number"
            register={register}
            errors={errors}
            validation={validation}
            handleBlur={(e) => changeCompanyData(e.target.value, 'utr_number')}
          />
        </Grid>
        <Grid container item xs={12} mb={2}>
          <QuestionCheckbox
            name="collateral_warranties"
            label={t('company-collateral-warranties')}
            value={collateralWarranties}
            register={register}
            errors={errors}
            setValue={setValue}
            changeCompanyData={changeCompanyData}
          />
          <QuestionCheckbox
            name="performance_guarantee_bonds"
            label={t('company-performance-guarantee-bonds')}
            value={performanceGuaranteeBonds}
            register={register}
            errors={errors}
            setValue={setValue}
            changeCompanyData={changeCompanyData}
          />
        </Grid>
      </Grid>
    </div>
  );
};

export default CIS;
