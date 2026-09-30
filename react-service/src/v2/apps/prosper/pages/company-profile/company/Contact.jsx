import React from 'react';
import { Image, CONSTANTS } from 'clink-components';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { LogoContainer } from 'v2/apps/prosper/shared/crm-components/LogoContainer.styled';

const { blueMagentaViolet } = CONSTANTS.colors.general;

const Contact = ({ src, companyName, children, pt = 0 }) => {
  return (
    <>
      <Grid
        item
        xs={2}
        pt={pt}
        sx={{
          justifyContent: 'center',
          alignItems: {
            lg: 'baseline',
            md: 'baseline',
            sm: 'baseline',
            xs: 'center',
          },
          display: 'flex',
        }}
      >
        <LogoContainer>
          <Image src={src} />
        </LogoContainer>
      </Grid>
      <Grid item xs={10} p={4}>
        <Grid container sx={{ width: '100%' }}>
          <Grid item xs={12}>
            <Typography
              variant="secondary"
              mb={2}
              sx={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: blueMagentaViolet,
              }}
            >
              {companyName}
            </Typography>
          </Grid>
          {children}
        </Grid>
      </Grid>
    </>
  );
};

export default Contact;
