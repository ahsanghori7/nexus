import React from 'react';
import Tooltip from '@mui/material/Tooltip';
import VerifiedIcon from '@mui/icons-material/Verified';
import RemoveIcon from '@mui/icons-material/Remove';
import Grid from '@mui/material/Grid2';

const StatusActivated = ({ isActivated }) => {
  const text = isActivated ? 'Activated' : 'Not Activated';
  return (
    <Tooltip title={text}>
      <Grid textAlign="center">
        {isActivated ? (
          <VerifiedIcon color="success" />
        ) : (
          <RemoveIcon color="error" />
        )}
      </Grid>
    </Tooltip>
  );
};

export default StatusActivated;
