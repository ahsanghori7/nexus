import React, { useState } from 'react';
import isNumber from 'lodash/isNumber';
import { CONSTANTS, Image } from 'clink-components';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import List from './List';

const { iconSearchBlack } = CONSTANTS.s3;

export default function ClinkAutocomplete(props) {
  const [error, setError] = useState(false);
  const {
    placeholder,
    onInputChange,
    label,
    options,
    handleClick = () => null,
    showOptions = false,
    loading = false,
    value,
    name,
    ...rest
  } = props;

  let propsTextField = {};
  if (error) {
    propsTextField = {
      error: Boolean(error),
      helperText: error,
    };
  }
  const sx = {};
  if (rest.sx) {
    if (rest.sx.marginBottom) {
      sx.marginTop = isNumber(rest.sx.marginBottom)
        ? -rest.sx.marginBottom
        : `-${rest.sx.marginBottom}`;
    }
    if (rest.sx.backgroundColor) {
      sx.backgroundColor = rest.sx.backgroundColor;
    }
  }

  const onClick = (val) => {
    handleClick(val);
    if (val.has_account) {
      setError(`${label} already exists`);
    }
  };

  return (
    <Box position="relative">
      <Autocomplete
        {...rest}
        onInputChange={(e, result) => onInputChange([e, result], setError)}
        options={options}
        value={value}
        renderInput={(params) => (
          <>
            {label && (
              <InputLabel
                sx={{ fontWeight: 'bold', color: 'black' }}
                error={propsTextField.error}
              >
                {label}
              </InputLabel>
            )}
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', top: 15, left: 15 }}>
                <Image src={iconSearchBlack} />
              </span>
              <TextField
                {...params}
                {...propsTextField}
                placeholder={placeholder}
                name={name}
                value={(value && value.label) || ''}
                InputProps={{
                  sx: {
                    paddingLeft: '40px !important',
                  },
                  endAdornment: loading ? (
                    <InputAdornment position="end">
                      <CircularProgress />
                    </InputAdornment>
                  ) : null,
                }}
              />
            </div>
          </>
        )}
      />
      {options && Boolean(options.length) && showOptions && (
        <List options={options} sx={sx} handleClick={onClick} />
      )}
    </Box>
  );
}
