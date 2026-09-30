import React from 'react';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import MuiLink from '@mui/material/Link';
import { Link } from 'react-router-dom';
import { CONSTANTS } from 'clink-components';
import HeaderIcon from 'v2/apps/clink/layout/navbar/HeaderIcon';
import { main, secondary, companyAssets } from './Links';
import useFeatureFlag from 'v2/hooks/useFeatureFlag';

const { clinkBlack } = CONSTANTS.colors.general;

const linkBuilder = (item, noReact) => {
  let linkProps = { href: item.url, component: MuiLink };
  if (!noReact) {
    linkProps = item.target
      ? { target: item.target, component: MuiLink, href: item.url }
      : { component: Link, to: item.url };
  }
  return (
    <ListItem
      sx={{ color: clinkBlack }}
      key={item.label}
      disablePadding
      data-testid={`sidebar-link-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
      {...linkProps}
    >
      <ListItemButton>
        <ListItemIcon>{item.icon}</ListItemIcon>
        <ListItemText primary={item.label} />
      </ListItemButton>
    </ListItem>
  );
};
export default function Sidebar({
  noReact = false,
  useSidebar = [false, () => null],
  isVisible
}) {
  const [open, toggleDrawer] = useSidebar;

  const { checkFeature } = useFeatureFlag();
  const canAccessHelpSupport = checkFeature('ACL_HELP_SUPPORT');                                  // only feature check

  const DrawerList = (
    <Box sx={{ width: 250 }} role="presentation" onClick={toggleDrawer(false)} data-testid="sidebar-content">
      <Toolbar>
        <HeaderIcon
          handleClick={toggleDrawer(false)}
          iconLink={{ sx: { pointerEvents: 'none' } }}
        />
      </Toolbar>
      <Divider />
      <List data-testid="sidebar-main-links">
        {main.map((item) => linkBuilder(item, noReact))}
        {isVisible && companyAssets.map((item) => linkBuilder(item, noReact))}
      </List>
      <Divider />

      {/* example to show/hide this option */}
      {canAccessHelpSupport && (
        <List data-testid="sidebar-secondary-links">{secondary.map((item) => linkBuilder(item, noReact))}</List>
      )}
    </Box>
  );

  return (
    <Drawer open={open} onClose={toggleDrawer(false)} data-testid="sidebar-drawer">
      {DrawerList}
    </Drawer>
  );
}
