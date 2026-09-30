import React from 'react';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import { MuiSubtitle } from 'v2/apps/shared/components/company-v2/Mui.styled';

const validateEmail = (value) => {
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  if (!value) {
    return 'Required';
  }
  if (!emailRegex.test(value)) {
    return 'Invalid email';
  }
  return true;
};

const Text = ({
  name,
  label = '',
  value,
  errors,
  register,
  validate = null,
  type = 'text',
  sx = {},
  required = false,
}) => (
  <FormControl sx={sx} fullWidth error={required && !!errors[name]}>
    {Boolean(label) && <MuiSubtitle>{label}</MuiSubtitle>}
    <TextField
      {...register(name, {
        required: required && 'Required',
        ...(type === 'email' ? { validate: validateEmail } : {}),
        ...(type !== 'email' && validate ? { validate } : {}),
      })}
      error={required && !!errors[name]}
      helperText={errors[name]?.message}
      type={type}
    >
      {value}
    </TextField>
  </FormControl>
);

export default Text;
