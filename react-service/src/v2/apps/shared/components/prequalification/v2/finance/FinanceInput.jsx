import React from 'react';
import { CONSTANTS } from 'clink-components';
import TextFieldMui from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputAdornment from '@mui/material/InputAdornment';
import Divider from '@mui/material/Divider';
import { MuiSubtitle } from 'v2/apps/shared/components/company-v2/Mui.styled';

const TextField = React.forwardRef((props, ref) => (
  <TextFieldMui ref={ref} {...props} />
));

const { aliceBlue, white } = CONSTANTS.colors.general;

const FinanceInput = ({
  sx = {},
  label = '',
  labelAdornment = false,
  adornmentWidth = '100px',
  name = '',
  register,
  errors,
  handleChange = () => null,
  handleBlur = () => null,
  validation = {},
}) => (
  <FormControl sx={{ ...sx, width: '100%' }}>
    {Boolean(label) && !labelAdornment && <MuiSubtitle>{label}</MuiSubtitle>}
    <TextField
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
                maxWidth: adornmentWidth,
                minWidth: adornmentWidth,
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
          style: { textAlign: 'center' },
          onChange: handleChange,
          onBlur: handleBlur,
        },
      }}
      {...register(name, { required: 'Required', ...validation })}
      error={!!errors[name]}
      helperText={errors[name]?.message}
    />
  </FormControl>
);

export default FinanceInput;
