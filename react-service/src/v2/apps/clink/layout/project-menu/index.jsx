import React, { useState, Fragment } from 'react';
import { connect, useSelector } from 'react-redux';
import { useParams, useLocation } from 'react-router-dom';
import i18next from 'v2/helpers/i18n';
import { Image } from 'clink-components';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import CssBaseline from '@mui/material/CssBaseline';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import MenuIcon from '@mui/icons-material/Menu';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

import {
  SingleDrawerLink,
  SingleMenuLink,
  MultipleMenuLink,
  sxImg,
} from './SingleLink';
import navItems from './navItems';

const drawerWidth = 240;

function DrawerAppBar(props) {
  const { window, layout, clinkAccount } = props;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState({});
  const params = useParams();
  const theme = useTheme();
  const matches = useMediaQuery(theme.breakpoints.down('lg'));
  const containerProps = matches ? { size: { xs: 6, md: 4 } } : {};
  const slug = (params && params.slug) || layout.slugHack;
  const location = useLocation();
  const locationLastSegment = location.pathname.split('/').pop();
  const handleDrawerToggle = () => {
    setMobileOpen(true);
  };

  const toggleSubmenu = (label) => {
    setOpenSubmenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isAction = (url) =>
    locationLastSegment !== slug && url.endsWith(locationLastSegment);

  const drawer =
    (slug && (
      <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
        <Typography variant="h6" sx={{ my: 2 }}>
          {i18next.t('project-menu')}
        </Typography>
        <Divider />
        <List>
          {navItems(slug, clinkAccount).map((item) => {
            return item.url ? (
              <SingleDrawerLink
                active={isAction(item.url)}
                key={item.label}
                {...item}
              />
            ) : (
              <Fragment key={item.label}>
                <ListItem
                  sx={{ textAlign: 'left', p: 0 }}
                  onClick={() => toggleSubmenu(item.label)}
                >
                  <ListItemButton sx={{ textAlign: 'left' }}>
                    {item.icon && (
                      <Box sx={sxImg}>
                        <Image src={item.icon} width={20} height={20} />
                      </Box>
                    )}
                    <ListItemText primary={item.label} />
                  </ListItemButton>
                </ListItem>
                {openSubmenus[item.label] &&
                  item.urls.map((i) => (
                    <SingleDrawerLink key={i.label} {...i} />
                  ))}
              </Fragment>
            );
          })}
        </List>
      </Box>
    )) ||
    null;

  const container =
    window !== undefined ? () => window().document.body : undefined;

  return (
    (slug && (
      <Grid container>
        <CssBaseline />
        <AppBar
          component="nav"
          position="static"
          color="white"
          sx={{ borderRadius: '6px', marginBottom: 2 }}
          data-testid="project-menu-bar"
        >
          <Toolbar disableGutters>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, ml: 1, display: { sm: 'none' } }}
              data-testid="project-menu-mobile-toggle"
            >
              <MenuIcon />
            </IconButton>
            <Grid
              id="project-menu"
              container
              sx={{ display: { xs: 'none', sm: 'flex' } }}
              flexWrap="wrap"
              justifyContent="space-around"
              width="100%"
              data-testid="project-menu-desktop"
            >
              {navItems(slug, clinkAccount).map((item, index, array) => (
                <Grid
                  sx={{ flex: { lg: 1 } }}
                  key={item.label}
                  {...containerProps}
                >
                  {item.url ? (
                    <SingleMenuLink
                      active={isAction(item.url)}
                      firstMenuItem={index === 0}
                      lastMenuItem={index === array.length - 1}
                      {...item}
                    />
                  ) : (
                    <MultipleMenuLink
                      locationLastSegment={
                        locationLastSegment !== slug && locationLastSegment
                      }
                      firstMenuItem={index === 0}
                      lastMenuItem={index === array.length - 1}
                      {...item}
                    />
                  )}
                </Grid>
              ))}
            </Grid>
          </Toolbar>
        </AppBar>
        <nav>
          <Drawer
            container={container}
            variant="temporary"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            data-testid="project-menu-mobile-drawer"
            ModalProps={{
              keepMounted: true, // Better open performance on mobile.
            }}
            sx={{
              display: { xs: 'block', sm: 'none' },
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: drawerWidth,
              },
            }}
          >
            {drawer}
          </Drawer>
        </nav>
      </Grid>
    )) ||
    null
  );
}

const mapStateToProps = (state) => {
  return {
    layout: state.layout,
    clinkAccount: state.clinkAccount
  };
};

export default connect(mapStateToProps)(DrawerAppBar);
