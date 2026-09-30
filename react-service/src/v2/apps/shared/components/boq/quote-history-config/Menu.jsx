import * as React from 'react';
import { connect } from 'react-redux';
import i18next from 'v2/helpers/i18n';
import Tooltip from '@mui/material/Tooltip';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import httpRequest from 'services/httpHelper';
import { goToNewTab } from 'v2/helpers/url';

const ITEM_HEIGHT = 48;

function QuoteHistoryMenu({ row }) {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const ellipsis = {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };

  const { entity, subcontractor, version } = row;
  const options = [
    {
      label: i18next.t('view-quote-document'),
      action: () => {
        httpRequest({
          url: `boq/${(entity && entity.id) || 0}/quote/${
            (subcontractor && subcontractor.id) || 0
          }/download/${version}`,
        }).then((result) => {
          if (result && result.data && result.data.success) {
            goToNewTab(result.data.file);
          } else {
            /* eslint no-alert: "off" */
            alert((result && result.data && result.data.error) || 'ERROR');
          }
        });
      },
    },
  ];

  return (
    <div style={{ textAlign: 'right' }}>
      <IconButton
        aria-label="more"
        id="long-button"
        aria-controls={open ? 'long-menu' : undefined}
        aria-expanded={open ? 'true' : undefined}
        aria-haspopup="true"
        onClick={handleClick}
      >
        <MoreVertIcon />
      </IconButton>
      <Menu
        id="long-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          style: {
            maxHeight: ITEM_HEIGHT * 4.5,
            width: '20ch',
          },
        }}
      >
        {options.map((option) => (
          <MenuItem key={option.label} onClick={option.action}>
            <Tooltip title={option.label}>
              <Box sx={ellipsis}>{option.label}</Box>
            </Tooltip>
          </MenuItem>
        ))}
      </Menu>
    </div>
  );
}

export default connect()(QuoteHistoryMenu);
