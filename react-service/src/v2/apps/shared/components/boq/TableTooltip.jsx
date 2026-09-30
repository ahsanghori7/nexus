import React from 'react';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';

const TableTooltip = ({ title, content }) => {
  const tooltipTitle = title || '-';

  return (
    <Tooltip
      title={
        <Box
          component="span"
          sx={{
            display: 'block',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            overflow: 'visible',
            textOverflow: 'unset',
            maxWidth: 'min(480px, 90vw)',
          }}
        >
          {tooltipTitle}
        </Box>
      }
      placement="bottom-start"
      slotProps={{
        tooltip: {
          sx: {
            maxWidth: 'min(480px, 90vw)',
            overflow: 'visible',
            textOverflow: 'unset',
          },
        },
      }}
    >
      <span
        style={{
          cursor: 'help',
          display: 'block',
          width: '100%',
          overflow: 'hidden',
        }}
      >
        {content || '-'}
      </span>
    </Tooltip>
  );
};

export default TableTooltip;
