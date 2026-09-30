import React from 'react';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import Wrapper from './Wrapper';

const ExtraDoc = ({ aid, item, data }) => {
  const color = item?.original_file ? 'success' : '';
  const sx = {
    width: '100%',
    height: 8,
    ...(item?.original_file ? { cursor: 'help' } : { cursor: 'pointer' }),
  };
  return (
    <Tooltip title={item.label} placement="bottom" arrow>
      <div>
        <Wrapper data={{ ...item, label: data?.label }} aid={aid} extra>
          <Chip sx={sx} color={color} variant="filled" />
        </Wrapper>
      </div>
    </Tooltip>
  );
};
export default ExtraDoc;
