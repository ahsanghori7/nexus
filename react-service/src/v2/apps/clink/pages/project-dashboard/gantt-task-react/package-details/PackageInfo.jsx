import React from 'react';
import Badge from '@mui/material/Badge';
import Chip from '@mui/material/Chip';

const PackageInfo = ({ info = '', extra = '' }) => {
  const content = (
    <Chip
      label={info}
      size="small"
      sx={{
        minWidth: '31px',
        height: '16px',
        borderRadius: '4px',
        fontSize: '11px',
      }}
    />
  );
  return extra ? (
    <Badge color="success" variant="string" badgeContent={extra}>
      {content}
    </Badge>
  ) : (
    content
  );
};

export default PackageInfo;
