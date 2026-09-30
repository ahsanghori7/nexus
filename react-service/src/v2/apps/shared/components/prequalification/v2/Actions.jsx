import React, { useState, useEffect, useRef } from 'react';
import Divider from '@mui/material/Divider';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Grid from '@mui/material/Grid';
import Grow from '@mui/material/Grow';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import IconButton from '@mui/material/IconButton';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { CONSTANTS } from 'clink-components';

const { japaneseIndigo } = CONSTANTS.colors.general;
const { SilverSand } = CONSTANTS.colors.prosper;
const styleItemAction = { height: '50px', fontWeight: '100' };

const Actions = ({ actions = [] }) => {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) {
      return;
    }
    setOpen(false);
  };

  const handleListKeyDown = (event) => {
    if (event.key === 'Tab') {
      event.preventDefault();
      setOpen(false);
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  const prevOpen = useRef(open);
  useEffect(() => {
    if (prevOpen.current === true && open === false) {
      anchorRef.current.focus();
    }
    prevOpen.current = open;
  }, [open]);

  return (
    <Grid
      item
      sx={{
        padding: '0 !important',
        justifyContent: 'end',
        display: 'flex',
        alignItems: 'start',
        position: 'absolute',
        top: '4px',
        right: 0,
      }}
    >
      <IconButton
        ref={anchorRef}
        id="basic-button"
        aria-label="options"
        aria-controls={open ? 'basic-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleToggle}
        size="small"
      >
        <MoreHorizIcon fontSize="small" sx={{ color: japaneseIndigo }} />
      </IconButton>
      <Popper
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        disablePortal
        sx={{
          zIndex: '1',
          transform: 'translate(-162px, 30px)!important',
        }}
      >
        {({ TransitionProps }) => (
          <Grow {...TransitionProps}>
            <Paper
              elevation={0}
              sx={{
                width: '195px',
                border: `1px solid ${SilverSand}`,
                borderRadius: 0,
              }}
            >
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList
                  autoFocusItem={open}
                  id="composition-menu"
                  aria-labelledby="composition-button"
                  onKeyDown={handleListKeyDown}
                  sx={{ padding: '0' }}
                >
                  {actions
                    .filter((a) => a.id || a.label)
                    .map((a, i) => (
                      <div key={a.id}>
                        <MenuItem sx={styleItemAction} onClick={a.action}>
                          {a.label}
                        </MenuItem>
                        {actions.length > 1 && i !== actions.length - 1 && (
                          <Divider sx={{ margin: '0 !important' }} />
                        )}
                      </div>
                    ))}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </Grid>
  );
};

export default Actions;
