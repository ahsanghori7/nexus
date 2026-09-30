import React, { forwardRef } from 'react';
import { CONSTANTS } from 'clink-components';
import {
  TextField as TextFieldMui,
  FormControl,
  InputAdornment,
  Divider,
} from '@mui/material';
import { MuiSubtitle } from 'v2/apps/shared/components/company-v2/Mui.styled';

const TextField = React.forwardRef((props, ref) => (
  <TextFieldMui ref={ref} type="number" {...props} />
));

const { aliceBlue, white } = CONSTANTS.colors.general;

const NumberComponent = forwardRef(
  (
    {
      sx = {},
      label = '',
      labelAdornment = false,
      name = 'number',
      value = '',
      register,
      errors,
      validation = {},
      changeCompanyData = () => null,
    },
    ref,
  ) => {
    return (
      <FormControl
        fullWidth
        sx={{
          ...sx,
          'input[type=number]::-webkit-inner-spin-button': {
            display: 'none',
            WebkitAppearance: 'none',
            margin: 0,
          },
          'input[type=number]::-webkit-outer-spin-button': { display: 'none' },
          'input[type=number]': {
            MozAppearance: 'textfield',
          },
        }}
      >
        {Boolean(label) && !labelAdornment && (
          <MuiSubtitle>{label}</MuiSubtitle>
        )}
        <TextField
          ref={ref}
          defaultValue={value}
          InputProps={{
            sx: { background: white, pl: 0 },
            startAdornment: Boolean(label) && labelAdornment && (
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
            ),
            inputProps: {
              onBlur: (e) => changeCompanyData(e.target.value, name),
            },
          }}
          {...register(name, { required: 'Required', ...validation })}
          error={!!errors[name]}
          helperText={errors[name]?.message}
        />
      </FormControl>
    );
  },
);

export default NumberComponent;
