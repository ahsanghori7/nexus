import React from 'react';
import { CONSTANTS } from 'clink-components';
import {
  TextField as TextFieldMui,
  FormControl,
  InputAdornment,
  Divider,
} from '@mui/material';
import { MuiSubtitle } from 'v2/apps/shared/components/company-v2/Mui.styled';
import i18next from 'v2/helpers/i18n';
import { NumberFormatCustom } from './NumberFormatCustom';

const TextField = React.forwardRef((props, ref) => (
  <TextFieldMui ref={ref} {...props} />
));

const { aliceBlue, white } = CONSTANTS.colors.general;

const Money = ({
  sx = {},
  label = '',
  labelAdornment = false,
  name = 'money',
  value = '',
  register = () => {},
  errors,
  handleChange = () => null,
  onBlur = () => null,
  validation = {},
  adornment = i18next.t('currency'),
  extraAdornment = '',
}) => (
  <FormControl fullWidth sx={sx}>
    {Boolean(label) && !labelAdornment && <MuiSubtitle>{label}</MuiSubtitle>}
    <TextField
      InputProps={{
        sx: { background: white, pl: 0 },
        startAdornment: (
          <>
            {Boolean(label) && labelAdornment && (
              <>
                <InputAdornment
                  position="start"
                  sx={{
                    '& > p': { fontWeight: 600 },
                    background: aliceBlue,
                    height: '100%',
                    margin: 0,
                    maxWidth: '100px',
                    width: '100%',
                    justifyContent: 'center',
                    paddingTop: 2,
                    paddingBottom: 2,
                    fontWeight: 600,
                  }}
                >
                  {label}
                </InputAdornment>
                <Divider
                  orientation="vertical"
                  variant="middle"
                  flexItem
                  sx={{ m: 0, mr: 1 }}
                />
              </>
            )}
            <InputAdornment
              position="start"
              sx={{
                minWidth: '40px',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                '& > p': { fontWeight: 600 },
              }}
            >
              {adornment}
            </InputAdornment>
          </>
        ),
        inputComponent: NumberFormatCustom,
        inputProps: {
          thousandSeparator: true,
          decimalScale: 2,
          allowNegative: false,
          value,
          onChange: handleChange,
          onBlur,
        },
      }}
      {...register(name, { required: 'Required', ...validation })}
      error={!!errors[name]}
      helperText={errors[name]?.message}
    />
    {Boolean(extraAdornment) && extraAdornment}
  </FormControl>
);

export default Money;
