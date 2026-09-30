import * as React from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';

const PreqContent = ({ spacing = 1, children, sx = {} }) => (
  <Box sx={{ position: 'relative', ...sx }}>
    <Grid container spacing={spacing}>
      {children}
    </Grid>
  </Box>
);

export default PreqContent;
