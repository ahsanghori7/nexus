import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Link as ReactRouter } from 'react-router-dom';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import { Image, CONSTANTS } from 'clink-components';
import { goTo } from 'v2/helpers/url';

const { white, clinkLightPurple, grayDark, black, teal } = CONSTANTS.colors.general;
const sxImg = { marginRight: '10px' };

// `external` items live in another application on this origin (e.g. the
// Angular "orion" app) and must be hard-navigated to via `goTo` — a
// react-router `Link` would only update client-side history and 404.
const SingleDrawerLink = ({ url, label, icon, external }) => (
  <ListItem disablePadding>
    <ListItemButton
      sx={{ textAlign: 'left', zIndex: 10 }}
      {...(external
        ? { onClick: () => goTo(url) }
        : { component: ReactRouter, to: url })}
    >
      {icon && (
        <Box sx={sxImg}>
          <Image src={icon} width={20} height={20} />
        </Box>
      )}
      <ListItemText primary={label} />
    </ListItemButton>
  </ListItem>
);

SingleDrawerLink.propTypes = {
  url: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  icon: PropTypes.string,
  external: PropTypes.bool,
};

const SingleMenuLink = ({ url, label, icon, submenu, active, firstMenuItem, lastMenuItem, external }) => (
  <Button
    key={label}
    color="text"
    {...(external ? { onClick: () => goTo(url) } : { component: ReactRouter, to: url })}
    variant="nav-menu"
    data-testid={`menu-link-${label.toLowerCase().replace(/\s+/g, '-')}`}
    // TODO: These styles should be moved to general themes
    sx={{
      ...(active && {
        color: white,
        backgroundColor: teal,
        '& img': { filter: 'invert(1)' },
      }),
      ...(firstMenuItem && { borderTopLeftRadius: '6px', borderBottomLeftRadius: { lg: '6px' } }),
      ...(lastMenuItem && { borderTopRightRadius: { lg: '6px' }, borderBottomRightRadius: '6px' }),
      ...(submenu && {
        border: `1px solid ${clinkLightPurple}`,
        width: '100% !important',
        fontWeight: active ? 500 : 300,
        backgroundColor: active ? teal : white,
        color: active ? white : black,
        padding: '16px',
        '&:hover': { backgroundColor: grayDark, color: black, fontWeight: 500 },
        '&:focus': { border: `2px solid ${clinkLightPurple}`, backgroundColor: grayDark, color: black, fontWeight: 600 },
        '&:first-of-type': { borderTopLeftRadius: '6px', borderTopRightRadius: '6px' },
        '&:last-of-type': { borderBottomLeftRadius: '6px', borderBottomRightRadius: '6px' },
      }),
    }}
  >
    {icon && (
      <Box sx={{ ...sxImg, opacity: active ? 1 : 0.5 }}>
        <Image src={icon} width={20} height={20} />
      </Box>
    )}
    {label}
  </Button>
);

SingleMenuLink.propTypes = {
  url: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  icon: PropTypes.string,
  submenu: PropTypes.bool,
  active: PropTypes.bool,
  firstMenuItem: PropTypes.bool,
  lastMenuItem: PropTypes.bool,
  external: PropTypes.bool,
};

const MultipleMenuLink = ({ urls, label, icon, locationLastSegment, firstMenuItem, lastMenuItem }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const activeParent = urls.some((u) => u.url.endsWith(locationLastSegment));

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const handleClickAway = () => setIsMenuOpen(false);

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <Box
        sx={{ cursor: 'pointer' }}
        position="relative"
        onMouseEnter={() => setIsMenuOpen(true)}
        onMouseLeave={() => setIsMenuOpen(false)}
        onClick={toggleMenu}
        data-testid={`menu-group-${label.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <SingleMenuLink active={activeParent} label={label} icon={icon} url="#" firstMenuItem={firstMenuItem} lastMenuItem={lastMenuItem} />
        {isMenuOpen && (
          <List sx={{ position: 'absolute', zIndex: 7, boxShadow: '0 0 10px rgba(0, 0, 0, 0.2)', paddingTop: 0, paddingBottom: 0, borderRadius: '6px', width: '100%' }}>
            {urls.map((u) => (
              <SingleMenuLink
                key={u.label}
                label={u.label}
                url={u.url}
                external={u.external}
                submenu
                active={u.url.endsWith(locationLastSegment)}
              />
            ))}
          </List>
        )}
      </Box>
    </ClickAwayListener>
  );
};

MultipleMenuLink.propTypes = {
  urls: PropTypes.arrayOf(
    PropTypes.shape({
      url: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      external: PropTypes.bool,
    })
  ).isRequired,
  label: PropTypes.string.isRequired,
  icon: PropTypes.string,
  locationLastSegment: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.bool,
  ]).isRequired,
  firstMenuItem: PropTypes.bool,
  lastMenuItem: PropTypes.bool,
};

export { SingleDrawerLink, SingleMenuLink, MultipleMenuLink, sxImg };
