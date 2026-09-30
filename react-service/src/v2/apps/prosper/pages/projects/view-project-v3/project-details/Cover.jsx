import React from 'react';
import { Image } from 'clink-components';
import Grid from '@mui/material/Grid';

const Cover = ({ src }) => {
  return (
    <Grid
        item
        sx={{
          borderRadius: '5px',
          '& > span': {
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            borderRadius: '5px',
            maxHeight: '395px',
            '& > img': {
              width: '100%',
              borderRadius: '5px',
            },
          },
        }}
      >
        <Image src={src} />
      </Grid>
  );
};

export default Cover;
