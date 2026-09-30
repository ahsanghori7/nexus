import React from 'react';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import OutlinedInput from '@mui/material/OutlinedInput';
import { MuiSubtitle } from 'v2/apps/shared/components/company-v2/Mui.styled';

const Textarea = ({
  name,
  label = '',
  value,
  errors,
  register,
  type = 'text',
  sx = {},
}) => (
  <FormControl sx={sx} fullWidth error={!!errors[name]}>
    {Boolean(label) && <MuiSubtitle>{label}</MuiSubtitle>}

    <OutlinedInput
      {...register(name, {
        required: true,
      })}
      label={label}
      multiline
      minRows={4}
      defaultValue={value}
      error={!!errors[name]}
      type={type}
      sx={{ '& legend': { display: 'none!important' }, mb: 2 }}
    />
    {errors[name] && <FormHelperText>Required</FormHelperText>}
  </FormControl>
);

export default Textarea;
