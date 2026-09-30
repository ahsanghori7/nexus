import React from 'react';
import { useTheme } from '@mui/material/styles';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import { CONSTANTS } from 'clink-components';
import commonStyles from './common';

const { iconDecisionCalendarPink, iconDownArrowGrey } = CONSTANTS.s3;

const CustomButton = React.forwardRef((props, ref) => {
  const theme = useTheme();

  const classes = {
    ...commonStyles(theme),
    rigthColumnSelectAll: {
      display: 'none',
      pointerEvents: 'none',
      [theme.breakpoints.down('sm')]: {
        display: 'flex',
        alignItems: 'center',
        width: '76px',
        justifyContent: 'space-between',
        marginRight: '-4px',
      },
    },
    decisionDateButton: {
      padding: 0,
      paddingLeft: 1,
      minWidth: 'auto',
      height: 24,
      position: 'relative',
      [theme.breakpoints.down('sm')]: {
        width: '18px',
        minWidth: '32px',
        maxHeight: '22px',
      },
    },
    calendarIcon: {
      width: 24,
      height: 24,
      [theme.breakpoints.down('sm')]: {
        height: '15px',
        width: 'auto',
      },
    },
    arrowDownIcon: {
      width: 10,
      height: 10,
      position: 'absolute',
      right: -12,
      top: '50%',
      transform: 'translateY(-50%)',
    },
    awardedIcon: {
      [theme.breakpoints.down('sm')]: {
        height: '15px',
        width: 'auto',
      },
    },
  };
  return (
    <Button ref={ref} sx={classes.decisionDateButton} onClick={props?.onClick}>
      <Avatar
        sx={classes.calendarIcon}
        src={iconDecisionCalendarPink}
        variant="square"
      />
      <Avatar
        sx={classes.arrowDownIcon}
        src={iconDownArrowGrey}
        variant="square"
      />
    </Button>
  );
});

export default CustomButton;
