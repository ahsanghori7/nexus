import React from 'react';
import { PHPAppClinkGloblals } from 'v2/helpers/php-globals';
import { CONSTANTS } from 'clink-components';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Avatar from '@mui/material/Avatar';

const { iconClinkLogo } = CONSTANTS.s3;

const config = PHPAppClinkGloblals();

function HeaderIcon({ handleClick = () => null, iconLink = {} }) {
  return (
    <>
      {!config.isCostPlaningTool && (
        <IconButton
          size="large"
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={handleClick}
          data-testid="navbar-menu-toggle"
        >
          <MenuIcon />
        </IconButton>
      )}
      <IconButton
        size="large"
        aria-label="account of current user"
        aria-controls="menu-appbar"
        aria-haspopup="true"
        color="inherit"
        data-testid="navbar-logo"
        {...iconLink}
      >
        <Avatar alt="c-link-icon" src={iconClinkLogo} />
      </IconButton>
    </>
  );
}

export default HeaderIcon;
