import React from 'react';
import LinearProgress from '@mui/material/LinearProgress';
import { CONSTANTS } from 'clink-components';

const { black } = CONSTANTS.colors.general;

const AppLinearProgress = ({
  value,
  sx,
  barColor,
  trackColor = `${black}1A`,
  ...props
}) => {
  const hasValue = Number.isFinite(Number(value));
  const variant = hasValue ? 'determinate' : 'indeterminate';

  return (
    <LinearProgress
      variant={variant}
      value={hasValue ? Number(value) : undefined}
      sx={{
        '&.MuiLinearProgress-root': {
          height: 10,
          borderRadius: 999,
          backgroundColor: trackColor,
        },
        '& .MuiLinearProgress-bar': {
          borderRadius: 999,
          ...(barColor ? { backgroundColor: barColor } : null),
        },
        ...sx,
      }}
      {...props}
    />
  );
};

export default AppLinearProgress;
