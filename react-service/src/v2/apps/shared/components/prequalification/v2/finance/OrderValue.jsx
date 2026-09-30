import React from 'react';
import Box from '@mui/material/Box';
import { useTranslation } from 'react-i18next';
import { MuiSubtitle } from 'v2/apps/shared/components/company-v2/Mui.styled';
import Money from '../form/Money';

const OrderValue = ({
  min_order_value,
  max_order_value,
  register,
  errors,
  validation,
  changeCompanyData = () => null,
}) => {
  const { t } = useTranslation();
  return (
    <div>
      <MuiSubtitle>{t('order-value')}</MuiSubtitle>
      <MuiSubtitle red={false}>{t('order-value-desc')}</MuiSubtitle>
      <Box
        sx={{
          display: 'flex',
          gap: '16px',
          flexDirection: { xs: 'column', lg: 'row' },
        }}
      >
        <Money
          sx={{ mb: 2 }}
          label={t('minimum')}
          labelAdornment
          name="min_order_value"
          value={min_order_value || 0}
          register={register}
          errors={errors}
          validation={validation}
          onBlur={(e) => changeCompanyData(e.target.value, 'min_order_value')}
        />
        <Money
          sx={{ mb: 2 }}
          label={t('maximum')}
          labelAdornment
          name="max_order_value"
          value={max_order_value || 0}
          register={register}
          errors={errors}
          validation={validation}
          onBlur={(e) => changeCompanyData(e.target.value, 'max_order_value')}
        />
      </Box>
    </div>
  );
};

export default OrderValue;
