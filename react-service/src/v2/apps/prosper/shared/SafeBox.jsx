import Box from '@mui/material/Box'
import React from 'react';

const SafeBox = ({ handleClick, ...rest }) => {
  // Explicitly filter out non-DOM props
  const {
    ...validDomProps
  } = rest;

  return <Box {...validDomProps} component="div" />;
};

export default SafeBox;
