import React from 'react';
import { Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { CONSTANTS } from 'clink-components';

const { clinkBlack, clinkLightPurple } = CONSTANTS.colors.general;

const MuiDropdownButton = () => {
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <Button sx={{ maxWidth: '40px', minWidth: 'auto' }} onClick={handleClick}>
        <MoreVertIcon sx={{ color: clinkBlack }} />
      </Button>
      <Menu
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <MenuItem onClick={handleClose}>Action 1</MenuItem>
        <MenuItem onClick={handleClose}>Action 2</MenuItem>
        <MenuItem onClick={handleClose}>Action 3</MenuItem>
      </Menu>
    </>
  );
};

const MuiDocumentsContainer = ({ children }) => {
  return (
    <Grid container spacing={1} sx={{ mt: 0, mb: 2 }}>
      {children}
    </Grid>
  );
};

const MuiDocumentsBox = ({ children, url = '#' }) => {
  return (
    <Grid item xs={4}>
      <Button
        variant="text"
        color="black"
        fullWidth
        LinkComponent={Link}
        to={url}
        sx={{
          padding: 0,
          '&:hover': {
            color: 'inherit',
          },
        }}
      >
        <Grid
          container
          sx={{
            justifyContent: 'space-between',
            flexWrap: 'nowrap',
            border: `1px solid ${clinkLightPurple}`,
            borderRadius: '4px',
            px: 1,
            py: 1,
            boxSizing: 'border-box',
          }}
        >
          <Grid item container>
            <Grid item xs={2}>
              <ContentPasteIcon
                sx={{ fontSize: '32px', ml: '-4px', mr: '4px' }}
              />
            </Grid>
            <Grid
              item
              xs={10}
              sx={{
                fontWeight: 100,
                textAlign: 'left',
                textWrap: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {children}
            </Grid>
          </Grid>
        </Grid>
      </Button>
    </Grid>
  );
};

const MuiLogContainer = ({ children }) => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>{children}</Box>
  );
};

// eslint-disable-next-line no-alert
const handleAlert = () => alert('TODO');
const MuiLogBox = ({ children, url = '#' }) => {
  return (
    <Button variant="text" color='success' LinkComponent={Link} to={url}>
      <Typography sx={{ fontSize: '16px', px: 1 }}>{children}</Typography>
    </Button>
  );
};

export {
  MuiDropdownButton,
  MuiDocumentsContainer,
  MuiDocumentsBox,
  MuiLogContainer,
  MuiLogBox,
  handleAlert,
};
