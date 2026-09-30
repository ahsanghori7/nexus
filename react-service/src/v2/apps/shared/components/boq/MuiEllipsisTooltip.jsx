import React, { useState, useEffect, useRef } from 'react';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

const ellipsis = {
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  fontSize: '13px',
  fontWeight: 600,
  lineHeight: 1,
  maxWidth: '200px',
  display: 'inline-block',
  verticalAlign: 'middle',
};

const MuiEllipsisTooltip = ({ tooltipContent = '', time }) => {
  const [open, setOpen] = useState(false);
  const timerRef = useRef(null);

  const handleOpen = () => {
    setOpen(true);
    clearTimeout(timerRef.current);
    if (time) {
      timerRef.current = setTimeout(() => setOpen(false), time);
    }
  };

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  return (
    <Tooltip
      title={
        <Typography sx={{ fontSize: '12px', lineHeight: 1 }}>
          {tooltipContent}
        </Typography>
      }
      open={open}
      onOpen={handleOpen}
      disableFocusListener
      disableTouchListener
      disableHoverListener
      PopperProps={{ disablePortal: true }}
      sx={{ lineHeight: '20px' }}
    >
      <Typography
        component="div"
        sx={ellipsis}
        onMouseEnter={handleOpen}
        onMouseLeave={() => setOpen(false)}
      >
        {tooltipContent}
      </Typography>
    </Tooltip>
  );
};


export default MuiEllipsisTooltip;
