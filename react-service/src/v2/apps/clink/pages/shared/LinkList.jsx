import React from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Link from '@mui/material/Link';
import { CONSTANTS } from 'clink-components';

const { clinkPurple } = CONSTANTS.colors.general;

const LinkList = ({ entries = [] }) => {
  const handleLinkClick = (id) => {
    if (typeof id === 'string' && id.length > 0) {
      const element = document.getElementById(id);
      element.scrollIntoView({ behavior: 'smooth' });
    } else {
      // eslint-disable-next-line no-console
      console.error('Invalid css id:', id);
    }
  };

  return (
    <List>
      {entries &&
        Boolean(entries.length) &&
        entries.map((entry) => (
          <ListItem sx={{ mb: '12px', p: 0 }} key={entry.tender.id}>
            <Link
              sx={{
                fontSize: '16px',
                color: clinkPurple,
                textDecoration: 'underline!important',
                fontWeight: 500,
                cursor: 'pointer',
                '&:hover': {
                  color: clinkPurple,
                },
              }}
              onClick={() =>
                handleLinkClick(
                  (entry?.tender?.label || '')
                    .replace(/\s+/g, '-')
                    .toLowerCase()
                )
              }
            >
              {entry.tender.label}
            </Link>
          </ListItem>
        ))}
    </List>
  );
};

export default LinkList;
