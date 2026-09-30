import React from 'react';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import EventIcon from '@mui/icons-material/Event';

const Input = ({ params }) => (
  <TextField
    variant="standard"
    {...params}
    InputProps={{
      disableUnderline: true,
      inputProps: {
        ...(params && params.inputProps),
        sx: {
          textAlign: 'right',
          cursor: 'pointer',
          fontSize: '14px',
          maxWidth: '75px',
          '&::placeholder': {
            opacity: '1 !important',
          },
        },
      },
      endAdornment: (
        <InputAdornment position="end">
          <IconButton edge="end" color="success">
            <EventIcon />
          </IconButton>
        </InputAdornment>
      ),
    }}
  />
);

export default Input;
