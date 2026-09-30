import React from 'react';
import Box from '@mui/material/Box';

const ImageContainer = ({
  extra = {},
  onClick = () => null,
  children = null,
}) => (
  <Box
    onClick={onClick}
    sx={{
      width: 73,
      height: 64,
      borderRadius: '5px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      '& img': {
        maxWidth: '64px',
        maxHeight: '64px',
      },
      '& span': {
        display: 'flex !important',
      },
      ...extra,
    }}
  >
    {children}
  </Box>
);

export default ImageContainer;
