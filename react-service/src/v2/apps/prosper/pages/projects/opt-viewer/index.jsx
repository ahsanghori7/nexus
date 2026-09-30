import React from 'react';
import OptViewer from 'v2/apps/widgets/opportunity-viewer';
import Grid from '@mui/material/Grid';

const OptViewerPage = () => (
  <Grid
    container
    sx={{
      maxWidth: 466,
      marginLeft: 'auto',
      marginRight: 'auto',
      marginTop: { xs: 2, md: 16 },
    }}
  >
    <OptViewer discover />
  </Grid>
);

export default OptViewerPage;
