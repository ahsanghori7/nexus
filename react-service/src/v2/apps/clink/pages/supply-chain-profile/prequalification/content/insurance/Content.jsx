import React from 'react';
import Box from '@mui/material/Box';
import CardMedia from '@mui/material/CardMedia';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { CONSTANTS } from 'clink-components';
import InsuranceData from './Data';

const { iconAssuranceGray } = CONSTANTS.s3;
const { darkCharcoal } = CONSTANTS.colors.general;

const InsuranceContent = ({ data, aid, country }) => {
  if (!data || (data?.label === 'Other' && !data?.section)) {
    return null;
  }
  return (
    <Box
      sx={{
        flexGrow: { xs: 0, lg: 1 },
        display: { xs: 'flex', lg: 'unset' },
        alignItems: 'center',
        height: '100%',
      }}
    >
      <Box sx={{ display: { lg: 'none' } }}>
        <CardMedia
          sx={{ width: '44px', height: 'auto', m: 2 }}
          component="img"
          alt="insurance"
          image={iconAssuranceGray}
        />
      </Box>
      <Grid
        container
        spacing={1}
        sx={{
          textAlign: {
            xs: 'unset',
            lg: 'center',
            height: '100%',
          },
        }}
      >
        <Grid
          item
          container
          justifyContent={{ xs: 'flex-start', lg: 'center' }}
          alignContent="center"
          lg={12}
        >
          <Typography
            sx={{
              fontSize: '18px',
              color: darkCharcoal,
              fontWeight: 'bold',
              lineHeight: '1.2',
              minHeight: '43px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {data.label || ''}
          </Typography>
        </Grid>
        <InsuranceData country={country} data={data} aid={aid} />
      </Grid>
    </Box>
  );
};

export default InsuranceContent;
