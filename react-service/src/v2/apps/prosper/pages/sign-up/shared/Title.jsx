import React from 'react';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid2';

const Title = ({
  styles,
  marginBottom,
  title,
  variant = 'title3',
  fontWeight = 'bold',
}) => (
  <Grid marginBottom={marginBottom}>
    <Typography variant={variant} fontWeight={fontWeight} {...styles}>
      {title}
    </Typography>
  </Grid>
);

export default Title;
