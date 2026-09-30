import React from 'react';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';

const Header = ({ title = '', children }) => (
  <Grid container justifyContent="space-between">
    <Grid>
      {title && (
        <Typography component="h1" variant="title3" fontWeight="600">
          {title}
        </Typography>
      )}
    </Grid>
    <Grid>{children}</Grid>
  </Grid>
);

export default Header;
