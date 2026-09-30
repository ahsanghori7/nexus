import React from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import { MuiSubtitle } from 'v2/apps/shared/components/company-v2/Mui.styled';
import Input from './FinanceInput';

const BankDetails = ({
  register,
  errors,
  validation,
  changeCompanyData = () => null,
}) => {
  const { t } = useTranslation();
  return (
    <div>
      <MuiSubtitle>{t('financial-bank-details')}</MuiSubtitle>
      <MuiSubtitle red={false}>
        {t('prequalification-bank_details')}
      </MuiSubtitle>
      <Box
        sx={{
          display: 'flex',
          gap: '16px',
          flexDirection: { xs: 'column' },
        }}
      >
        <Input
          name="bank_name"
          label={t('bank-name')}
          adornmentWidth="175px"
          labelAdornment
          register={register}
          errors={errors}
          validation={validation}
          handleBlur={(e) => changeCompanyData(e.target.value, 'bank_name')}
        />
        <Input
          name="address"
          label={t('address')}
          adornmentWidth="175px"
          labelAdornment
          register={register}
          errors={errors}
          validation={validation}
          handleBlur={(e) => changeCompanyData(e.target.value, 'address')}
        />
        <Grid
          container
          sx={{
            flexDirection: { xs: 'row', mb: 2 },
          }}
        >
          <Grid
            item
            xs={12}
            md={6}
            pr={{ xs: '0', md: '10px' }}
            mb={{ xs: 2, md: 0 }}
          >
            <Input
              name="sort_code"
              label={t('financial-sort-code')}
              adornmentWidth="175px"
              labelAdornment
              register={register}
              errors={errors}
              validation={validation}
              handleBlur={(e) => changeCompanyData(e.target.value, 'sort_code')}
            />
          </Grid>
          <Grid item xs={12} md={6} pl={{ xs: '0', md: '10px' }}>
            <Input
              name="account_number"
              label={t('financial-account-no')}
              adornmentWidth="175px"
              labelAdornment
              register={register}
              errors={errors}
              validation={validation}
              handleBlur={(e) =>
                changeCompanyData(e.target.value, 'account_number')
              }
            />
          </Grid>
        </Grid>
        <Input
          sx={{ mb: 2 }}
          name="vat_number"
          label={t('financial-vat-no')}
          adornmentWidth="400px"
          labelAdornment
          register={register}
          errors={errors}
          validation={validation}
          handleBlur={(e) => changeCompanyData(e.target.value, 'vat_number')}
        />
      </Box>
    </div>
  );
};

export default BankDetails;
