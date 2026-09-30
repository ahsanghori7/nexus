import React from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import { withStyles } from '@mui/styles';
import { CONSTANTS } from 'clink-components';
import { expiredDate } from 'v2/helpers/date';
import ExpirationDate from 'v2/apps/clink/pages/supply-chain-profile/prequalification/ExpirationDate';
import ManagerSystemData from './Data';
import { alpha } from '@mui/material/styles';

const { lightPeriwinkle, white, transparentGray, bostonRed } =
  CONSTANTS.colors.general;

// TODO: Create helper to retrieve this and preq logos
const styles = {
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: alpha(transparentGray, 0.3),
    zIndex: 9999,
  },
};

const ManagerSystemContent = ({ classes, data, aid, accordion }) => {
  if (!data) {
    return null;
  }

  const isExpired = data.date ? expiredDate(new Date(data.date)) : false;
  const showSmallLabel = !data.date || isExpired;

  return (
    <Box sx={{ flexGrow: 1, m: 1 }}>
      <Grid
        item
        container
        spacing={1}
        sx={{
          flexWrap: 'nowrap',
          alignItems: 'center',
          border: `1px solid ${lightPeriwinkle}`,
          borderRadius: '3px',
          position: 'relative',
          backgroundColor: white,
          ...(accordion && {
            minWidth: '192px',
          }),
        }}
      >
        {!data.date && <div className={classes.overlay} />}
        <ManagerSystemData data={data} aid={aid} />
      </Grid>
      {showSmallLabel && (
        <Grid
          item
          textAlign="center"
          xs={12}
          sx={{
            flexBasis: { xs: '50%', lg: '100%' },
            '& .MuiTypography-root': {
              display: { xs: 'block', lg: 'unset' },
              fontSize: { xs: '12px', lg: '10px' },
            },
          }}
        >
          <ExpirationDate
            expirationDateFontSize="10px"
            expirationFontSize="10px"
            expirationColor={bostonRed}
            expirationDateColor={bostonRed}
            date={data.date}
          />
        </Grid>
      )}
    </Box>
  );
};

export default withStyles(styles)(ManagerSystemContent);
