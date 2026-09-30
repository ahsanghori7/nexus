import React, { useState } from 'react';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import { CONSTANTS } from 'clink-components';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { MuiModal } from 'v2/apps/clink/pages/supply-chain-profile/mui.styled';
import Contact from './Contact';

const { iconPersonWhite } = CONSTANTS.s3;
const { white, clinkLightPurple, clinkPurple, clinkGreen, clinkRed } =
  CONSTANTS.colors.general;

const CommonPopperProps = {
  sx: {
    '& > .MuiTooltip-tooltip': {
      backgroundColor: white,
      border: `1px solid ${clinkLightPurple}`,
      '& > .MuiPaper-root': {
        boxShadow: 'none',
      },
      '& > .MuiTooltip-arrow': {
        color: white,
        marginRight: '-14px',
        height: '28px',
        width: '14px',
        '&:before': {
          border: `1px solid ${clinkLightPurple}`,
        },
      },
    },
  },
};
const MuiTooltip = ({ children, title = 'title' }) => {
  const [open, setOpen] = useState(false);

  const handleTooltipClose = () => {
    setOpen(false);
  };

  const handleTooltipOpen = () => {
    setOpen(true);
  };

  // eslint-disable-next-line react/no-unstable-nested-components
  const ClickTooltip = ({ children: content }) => (
    <ClickAwayListener onClickAway={handleTooltipClose}>
      <div>
        <Tooltip
          arrow
          placement="left"
          title={title}
          onClose={handleTooltipClose}
          open={open}
          disableFocusListener
          disableHoverListener
          disableTouchListener
          PopperProps={{
            ...CommonPopperProps,
            disablePortal: true,
          }}
        >
          <Box sx={{ cursor: 'pointer' }} onClick={handleTooltipOpen}>
            {content}
          </Box>
        </Tooltip>
      </div>
    </ClickAwayListener>
  );

  // eslint-disable-next-line react/no-unstable-nested-components
  const HoverTooltip = ({ children: content }) => (
    <Tooltip
      arrow
      placement="left"
      title={title}
      PopperProps={CommonPopperProps}
    >
      <Box sx={{ cursor: 'pointer' }} onClick={handleTooltipOpen}>
        {content}
      </Box>
    </Tooltip>
  );
  return open ? (
    <ClickTooltip>{children}</ClickTooltip>
  ) : (
    <HoverTooltip>{children}</HoverTooltip>
  );
};

const MuiContactItem = ({ children, data }) => {
  const theme = useTheme();
  const matches = useMediaQuery(theme.breakpoints.up('sm'));
  // eslint-disable-next-line react/no-unstable-nested-components
  let Wrapper = ({ children: wrapperChildren }) => (
    <MuiModal openModal={wrapperChildren}>
      <Contact data={data} mobile />
    </MuiModal>
  );
  if (matches) {
    // eslint-disable-next-line react/no-unstable-nested-components
    Wrapper = ({ children: wrapperChildren }) => (
      <MuiTooltip title={<Contact data={data} />}>{wrapperChildren}</MuiTooltip>
    );
  }
  return (
    <Wrapper>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          border: `1px solid ${clinkLightPurple}`,
          borderRadius: '8px',
          padding: '4px 6px',
          marginBottom: '4px',
          width: '100%',
        }}
      >
        <Avatar
          sx={{
            backgroundColor: clinkPurple,
            boxSizing: 'border-box',
            width: '26px',
            height: '26px',
            mr: 1,
            '& .MuiAvatar-img': {
              padding: '7px',
              transform: 'scale(1.15)',
            },
          }}
          src={iconPersonWhite}
        />
        <Box>{children}</Box>
      </Box>
    </Wrapper>
  );
};

const MuiContactsList = ({ contacts }) => (
  <Box
    sx={{
      maxWidth: { xs: 300, md: 'unset' },
      maxHeight: '240px',
      overflow: 'auto',
      m: { xs: 'auto', lg: 0 },
      mt: { xs: '12px', lg: 0 },
      '&::-webkit-scrollbar': {
        width: '10px',
      },
      '&::-webkit-scrollbar-track': {
        boxShadow: `inset 0 0 5px ${clinkPurple}`,
        borderRadius: '10px',
      },
      '&::-webkit-scrollbar-thumb': {
        background: clinkGreen,
        borderRadius: '10px',
      },
      '&::-webkit-scrollbar-thumb:hover': {
        background: clinkRed,
      },
    }}
  >
    {contacts.map((contact) => (
      <MuiContactItem key={contact.id} data={contact}>
        {`${contact.firstname || ''} ${contact.lastname || ''}`}
      </MuiContactItem>
    ))}
  </Box>
);

export { MuiContactsList };
