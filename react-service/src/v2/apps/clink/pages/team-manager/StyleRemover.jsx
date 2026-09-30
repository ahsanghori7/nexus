import React from 'react';
import Box from '@mui/material/Box';

const StyleRemover = ({ children }) => (
  <Box
    id="box-helper"
    sx={{
      '& > div': {
        display: 'block',
        marginRight: '0',
        marginLeft: '0',
      },
    }}
  >
    {children}
  </Box>
);

export default StyleRemover;
