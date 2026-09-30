import React from 'react';
import { Button as ButtonMui } from '@mui/material';

// TODO: delete this thing
const Button = ({ label = 'Save', children, sx, ...props }) => (
  <ButtonMui sx={{ height: '50px', paddingTop: '10px', ...sx }} {...props}>
    {children || label}
  </ButtonMui>
);
export default Button;
