import React, { useState } from 'react';
import { PasswordValidationBox, CONSTANTS } from 'clink-components';
import InputLabel from '@mui/material/InputLabel';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';

const { prosperGrayDisabled } = CONSTANTS.colors.prosper;
const sx = { backgroundColor: prosperGrayDisabled };

const InputText = ({
  id = '',
  styles = {},
  name,
  label,
  placeholder,
  type = 'text',
  Adornment = null,
  handleChange = () => null,
  passwordErrors = [],
  value = null,
  disabled = null,
  readOnly = null,
}) => {
  const [error, setError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  let props = {};
  const inputProps = {};
  if (error) {
    props = {
      error: Boolean(error),
      helperText: error,
    };
  }
  if (value) {
    props.value = value;
  }
  if (disabled) {
    props.disabled = disabled;
    props.sx = sx;
  }
  if (readOnly) {
    inputProps.readOnly = readOnly;
    props.sx = sx;
  }
  if (Adornment) {
    inputProps.endAdornment = (
      <Adornment
        showPassword={showPassword}
        setShowPassword={setShowPassword}
      />
    );
  }

  const passwordType = showPassword ? 'text' : 'password';
  const newType = type === 'password' ? passwordType : type;

  const { bottomMt, noWrap, titleSize, subtitleSize, inputMb, ...rest } =
    styles;

  return (
    <Grid item {...(rest || {})} mb={inputMb || 0}>
      <InputLabel
        sx={{ fontWeight: 'bold', color: 'black' }}
        htmlFor={name}
        error={Boolean(props.error)}
      >
        {label}
      </InputLabel>
      <TextField
        id={id}
        name={name}
        placeholder={placeholder}
        type={newType}
        fullWidth
        {...props}
        InputProps={inputProps}
        onChange={(e) => handleChange(e, setError)}
      />
      {passwordErrors && Boolean(passwordErrors.length) && (
        <PasswordValidationBox
          showValidationBox={passwordErrors}
          errors={passwordErrors}
        />
      )}
    </Grid>
  );
};

export default InputText;
