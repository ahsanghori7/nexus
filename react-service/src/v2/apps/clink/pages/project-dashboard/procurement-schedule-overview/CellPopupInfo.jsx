import React from 'react';
import Popper from '@mui/material/Popper';
import Paper from '@mui/material/Paper';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Grid2 from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Close from '@mui/icons-material/Close';

const CellPopupInfo = ({
  open,
  anchorEl,
  onClose,
  children,
  title,
  paperSx = {},
  placement = 'top',
  modifiers = [],
  ...props
}) => {
  const defaultModifiers = [
    {
      name: 'offset',
      options: {
        offset: [0, 10],
      },
    },
  ];

  return (
    <Popper
      sx={{ zIndex: 1 }}
      open={open}
      anchorEl={anchorEl}
      placement={placement}
      modifiers={[...defaultModifiers, ...modifiers]}
      data-testid="cell-popup"
      {...props}
    >
      <ClickAwayListener onClickAway={onClose}>
        <Paper sx={paperSx}>
          {title && (
            <Grid2
              container
              justifyContent="space-between"
              alignItems="flex-start"
            >
              <Grid2>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, pr: 1 }}>
                  {title}
                </Typography>
              </Grid2>
              <Grid2>
                <IconButton
                  size="small"
                  data-testid="cell-popup-close"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
                  sx={{
                    p: 0.5,
                    ml: 1,
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' },
                  }}
                >
                  <Close fontSize="small" />
                </IconButton>
              </Grid2>
            </Grid2>
          )}
          {children}
        </Paper>
      </ClickAwayListener>
    </Popper>
  );
};

export default CellPopupInfo;
