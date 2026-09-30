import React from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import AccreditationData from './Data';

const AccreditationContent = ({ data, aid, accordion }) => {
  if (!data) {
    return null;
  }

  return (
    <Box
      sx={{
        p: '16px 2px 0',
        boxSizing: 'border-box',
        flexBasis: { xs: '100%', lg: '20%' },
        ...(accordion && {
          minWidth: '212px',
        }),
      }}
    >
      <Grid
        container
        spacing={1}
        sx={{
          m: '0!important',
          width: '100%',
          height: '100%',
        }}
      >
        <AccreditationData data={data} aid={aid} />
      </Grid>
    </Box>
  );
};
export default AccreditationContent;
