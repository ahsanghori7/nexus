import React from 'react';
import { CONSTANTS, Image } from 'clink-components';

import Box from '@mui/material/Box';
import Badge from '@mui/material/Badge';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

const { iconExclamationTriangleRed } = CONSTANTS.s3;

const STATUS_PERCENTAGE = 20;

const PackageStatus = ({ status = null, warning = false, theme }) => {
  const { palette } = theme;
  const percentage = status.id * STATUS_PERCENTAGE;
  const icon = status.icon;
  const content = (
    <Box position="relative" display="inline-flex">
      <CircularProgress
        thickness={1.5}
        color="success"
        variant="determinate"
        value={percentage}
      />
      <Box
        top={0}
        left={0}
        bottom={0}
        right={0}
        position="absolute"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Image
          style={{ paddingTop: '3px' }}
          src={icon}
          width={26.94}
          heigth={26.94}
        />
      </Box>
    </Box>
  );

  const result = warning ? (
    <Badge badgeContent={<Image src={iconExclamationTriangleRed} />}>
      {content}
    </Badge>
  ) : (
    content
  );

  const sx = {};
  // No tender doc
  if (status.id === 1) {
    sx.fontSize = 8;
  }
  return (
    <>
      {result}
      <Typography
        variant="small"
        color={palette.success.main}
        pt={0.5}
        align="center"
        sx={sx}
      >
        {status.label.toUpperCase()}
      </Typography>
    </>
  );
};

export default PackageStatus;
