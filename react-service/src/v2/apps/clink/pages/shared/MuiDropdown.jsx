// DropdownButton.js
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import IconButton from '@mui/material/IconButton';
import Popper from '@mui/material/Popper';
import Paper from '@mui/material/Paper';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { CONSTANTS } from 'clink-components';

const { clinkLightPurple } = CONSTANTS.colors.general;

const DropdownButton = ({ triggerButton = <MoreVertIcon />, options }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const { t } = useTranslation();

  const handleClick = (event) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  return (
    <div>
      <IconButton
        aria-label="more"
        aria-controls="dropdown-menu"
        aria-haspopup="true"
        variant="archiveDropdown"
        onClick={handleClick}
      >
        {triggerButton}
      </IconButton>
      <Popper open={open} anchorEl={anchorEl} placement="bottom-end">
        <ClickAwayListener onClickAway={handleClose}>
          <Paper>
            <MenuList sx={{ p: 0 }}>
              {options.map((option) => (
                <MenuItem
                  sx={{
                    minWidth: '200px',
                    '&:not(:first-of-type)': {
                      borderTop: `1px solid ${clinkLightPurple}`,
                    },
                  }}
                  key={option.id || option.name}
                  onClick={() => {
                    option.action();
                    handleClose();
                  }}
                  disabled={option.disabled}
                >
                  {t(option.name)}
                </MenuItem>
              ))}
            </MenuList>
          </Paper>
        </ClickAwayListener>
      </Popper>
    </div>
  );
};

export default DropdownButton;
