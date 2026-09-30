import React from 'react';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { CONSTANTS } from 'clink-components';
import { Link as ReactLink } from 'react-router-dom';

const { japaneseIndigo } = CONSTANTS.colors.general;

const Wrapper = ({ children, link, extraLink }) => {
  if (!link) {
    return children;
  }

  const { state: extraState, ...extraProps } = extraLink || {};
  let to = link;
  let state = extraState;

  if (link && typeof link === 'object') {
    const { state: linkState, pathname, search, ...rest } = link;
    let safePathname = pathname;
    let safeSearch = search;

    if (typeof pathname === 'string' && pathname.includes('?')) {
      const [path, query = ''] = pathname.split('?');
      safePathname = path;
      if (!safeSearch && query) {
        safeSearch = `?${query}`;
      }
    }

    to = {
      ...rest,
      ...(safePathname ? { pathname: safePathname } : {}),
      ...(safeSearch ? { search: safeSearch } : {}),
    };
    if (state === undefined) {
      state = linkState;
    }
  }

  return (
    <ReactLink to={to} state={state} {...extraProps}>
      {children}
    </ReactLink>
  );
};

const ItemData = ({
  icon,
  label = '',
  value = '',
  link = null,
  extraLink = null,
}) => {
  return (
    <ListItem sx={{ padding: 0 }}>
      {icon && <ListItemIcon sx={{ minWidth: '40px' }}>{icon}</ListItemIcon>}
      <ListItemText
        secondary={label}
        secondaryTypographyProps={{ fontSize: '14px', color: japaneseIndigo }}
      />
      <Wrapper link={link} extraLink={extraLink}>
        <ListItemText
          primary={value}
          sx={{ textAlign: 'end' }}
          primaryTypographyProps={{
            fontSize: '14px',
            fontWeight: 'bold',
            color: japaneseIndigo,
          }}
        />
      </Wrapper>
    </ListItem>
  );
};
export default ItemData;
