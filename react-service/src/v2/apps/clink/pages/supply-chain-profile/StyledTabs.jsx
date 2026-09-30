import React from 'react';
import MuiTab from '@mui/material/Tab';
import MuiTabs from '@mui/material/Tabs';
import { styled } from '@mui/material/styles';
import { CONSTANTS } from 'clink-components';

const { prosperBoxGreen } = CONSTANTS.colors.prosper;
const { clinkBackgroundPurple, clinkLightPurple, white } =
  CONSTANTS.colors.general;

const tabHeigt = '32px';

const Tabs = styled((props) => <MuiTabs {...props} />)(() => ({
  minHeight: 'unset',
  height: tabHeigt,
  '& .MuiTabs-indicator': {
    display: 'none',
  },
}));

const Tab = styled((props) => <MuiTab {...props} />)(({ closed }) => ({
  textTransform: 'none',
  margin: 0,
  backgroundColor: clinkBackgroundPurple,
  opacity: 1,
  border: `1px solid ${clinkLightPurple}`,
  borderTop: 0,
  fontWeight: 'bold',
  color: 'black',
  fontSize: '18px',
  minWidth: '50px',
  flex: 1,
  height: tabHeigt,
  '&[closed="true"]': {
    ...(closed && {
      backgroundColor: white,
      borderLeft: 0,
      borderRight: 0,
      position: 'relative',
      fontWeight: 400,
      '&:first-of-type': {
        borderLeft: 0,
        borderBottomLeftRadius: '8px',
      },
      '&:after': {
        content: '""',
        width: '1px',
        height: '20px',
        backgroundColor: clinkLightPurple,
        position: 'absolute',
        right: 0,
      },
    }),
  },
  '&:first-of-type': {
    borderLeft: 0,
    borderTopLeftRadius: '8px',
    '.MuiTouchRipple-root': {
      borderTopLeftRadius: '8px',
    },
  },
  '&:last-child': {
    borderRight: 0,
    borderTopRightRadius: '8px',
    '.MuiTouchRipple-root': {
      borderTopRightRadius: '8px',
    },
  },
  '&.Mui-selected': {
    backgroundColor: white,
    borderBottom: 0,
    '&.MuiCardMedia-root': {
      position: 'relative',
      '&:after': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: prosperBoxGreen,
        mixBlendMode: 'overlay',
      },
    },
  },
  '&.Mui-focusVisible': {
    backgroundColor: 'rgba(100, 95, 228, 0.32)',
  },
}));

export { Tabs, Tab };
