import React, { useState } from 'react';
import Cookies from 'js-cookie';
import { PHPAppClinkGloblals } from 'v2/helpers/php-globals';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { CONSTANTS } from 'clink-components';
import AppBar from '@mui/material/AppBar';
import MuiLink from '@mui/material/Link';
import Toolbar from '@mui/material/Toolbar';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import Person from '@mui/icons-material/Person';
import AdminPanelSettings from '@mui/icons-material/AdminPanelSettings';
import ExitToApp from '@mui/icons-material/ExitToApp';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import Menu from '@mui/material/Menu';
import Avatar from '@mui/material/Avatar';
import { goTo } from 'v2/helpers/url';
import HeaderIcon from './HeaderIcon';
import { superAdmin, admin, administrator } from 'v2/helpers/roles';
import { NotificationBell } from 'v2/apps/shared/components/notifications';

const { clinkGreen } = CONSTANTS.colors.general;

const config = PHPAppClinkGloblals();

function MenuAppBar({
  toggleDrawer = () => null,
  clinkAccount,
  noReact = false,
}) {
  const tokenName = (ENV && `ghost_${ENV}`) || 'ghost_development';
  const token = Cookies.get(tokenName);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const roleValue =
    (clinkAccount?.user?.type || clinkAccount?.user?.role?.value || '').trim();
  const isAdmin =
    [administrator.value, superAdmin.value, admin.value].includes(roleValue) ||
    token;
  const displayName = clinkAccount?.user?.display_name || '';

  // We build the initials from the display name
  const initials = displayName
    .split(' ')
    .map((word) => (word[0] && word[0].toUpperCase()) || 'U')
    .join('');

  const iconLink = noReact
    ? { LinkComponent: MuiLink, href: BASE_URLS.CLINK }
    : { LinkComponent: Link, to: BASE_URLS.CLINK };
  return (
    <AppBar position="static" color="white" data-testid="navbar">
      <Toolbar>
        <Grid container alignItems="center" justifyContent="space-between">
          <Grid item>
            <HeaderIcon handleClick={toggleDrawer(true)} iconLink={iconLink} />
          </Grid>
          <Grid item textAlign="right" display="flex" alignItems="center">
            <NotificationBell />
            <div id="avatar-menu">
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
                data-testid="navbar-user-menu-button"
              >
                <Avatar alt={displayName} sx={{ bgcolor: clinkGreen }}>
                  {initials}
                </Avatar>
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                keepMounted
                open={Boolean(anchorEl)}
                onClose={handleClose}
                data-testid="navbar-user-menu"
              >
                <MenuItem
                  onClick={() => goTo('/main-contractor/profile')}
                  data-testid="navbar-menu-profile"
                >
                  <ListItemIcon>
                    <Person fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Update profile</ListItemText>
                </MenuItem>

                {isAdmin && !config.isCostPlaningTool && (
                  <MenuItem
                    onClick={() =>
                      goTo(
                        `${BASE_URLS.APP_CLINK}/main-contractor/back_to_admin/`
                      )
                    }
                    data-testid="navbar-menu-admin"
                  >
                    <ListItemIcon>
                      <AdminPanelSettings fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Admin</ListItemText>
                  </MenuItem>
                )}

                <Divider />

                <MenuItem
                  onClick={() => goTo('/logout')}
                  data-testid="navbar-menu-logout"
                >
                  <ListItemIcon>
                    <ExitToApp fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Logout</ListItemText>
                </MenuItem>

              </Menu>
            </div>
          </Grid>
        </Grid>
      </Toolbar>
    </AppBar>
  );
}

const mapStateToProps = (state) => ({
  clinkAccount: state.clinkAccount,
});

export default connect(mapStateToProps)(MenuAppBar);
