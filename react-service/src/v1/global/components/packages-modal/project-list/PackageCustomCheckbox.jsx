import React from 'react';
import Checkbox from '@mui/material/Checkbox';
import { useTheme } from '@mui/material/styles';
import { CONSTANTS } from 'clink-components';

const { white, black, eerieBlack, clinkRed } = CONSTANTS.colors.general;

const CustomCheckbox = ({ redBorder, ...restProps }) => {
  const theme = useTheme();
const classes = {
    root: {},
    '*': { boxSizing: 'border-box' },
   customCheckbox : {
    padding: 0,
    '&.MuiButtonBase-root': {
      width: '24px',
      height: '24px',
      border: `1px solid ${eerieBlack}`,
      borderRadius: '4px',
      backgroundColor: white,
      position: 'relative',
      margin: '12px',
      [theme.breakpoints.down('sm')]: {
        width: '10px',
        height: '10px',
        padding: '7px',
        margin: '5px 8px 5px',
      },
      '&.Mui-checked': {
          '& input': {
            position: 'absolute',
            width: '24px',
            height: '24px',
            transform: 'rotate(45deg)',
            top: '-4px',
            left: '-8px',
          },
        '&::after': {
          content: '""',
          width: '8px',
            height: '16px',
            backgroundColor: white,
            borderBottom: `2px solid ${black}`,
            borderRight: `2px solid ${black}`,
            position: 'absolute',
            transform: 'rotate(46deg)',
            [theme.breakpoints.down('sm')]: {
              borderBottom: `1px solid ${black}`,
              borderRight: `1px solid ${black}`,
              width: '6px',
              height: '12px',
              top: 0,
            },
        },
      },
    },
    '& .MuiSvgIcon-root': {
      display: 'none',
    },
  },

  customCheckboxRed : {
    '&.MuiButtonBase-root': {
      border: `1px solid ${clinkRed}`,
      [theme.breakpoints.down('sm')]: {
        marginTop: '4px',
      },
      '&.Mui-checked': {
        '&::after': {
          borderBottom: `2px solid ${clinkRed}`,
          borderRight: `2px solid ${clinkRed}`,
          [theme.breakpoints.down('sm')]: {
            borderBottom: `1px solid ${clinkRed}`,
            borderRight: `1px solid ${clinkRed}`,
          },
        },
      },
    },
  },
    calendarIcon: {
      width: '18px',
      height: 'auto',
      marginRight: '12px',
      marginLeft: '8px',
    },
    arrowDownIcon: { width: '18px', height: 'auto' },
}
  return (
    <Checkbox
      {...restProps}
      sx={[classes.customCheckbox, redBorder && classes.customCheckboxRed]}
    />
  );
};

export default CustomCheckbox;
