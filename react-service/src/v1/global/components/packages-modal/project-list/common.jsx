import { CONSTANTS } from 'clink-components';

const { SilverSand } = CONSTANTS.colors.prosper;
const { proxima } = CONSTANTS.fonts;

const textFragment = (theme) => ({
  fontFamily: proxima,
  display: 'flex',
  alignItems: 'center',
  '&:first-of-type': {
    [theme.breakpoints.down('sm')]: {
      height: 16,
    },
  },
  [theme.breakpoints.down('sm')]: {
    alignItems: 'unset',
  },
  '&:nth-of-type(2)': {
    [theme.breakpoints.down('sm')]: {
      width: '50px',
      paddingLeft: '20px',
      alignItems: 'unset',
    },
  },
});
const textFragmentSize = (theme) => ({
  fontFamily: proxima,
  fontSize: '22px',
  [theme.breakpoints.down('sm')]: {
    fontSize: '14px',
  },
});
const commonStyles = (theme) => ({
  root: {},
  '*': { boxSizing: 'border-box' },
  listItem: {
    fontFamily: proxima,
    display: 'flex',
    width: '100%',
    justifyContent: 'space-between',
    maxWidth: '984px',
    border: `2px solid ${SilverSand}`,
    borderBottom: 'none',
    '&:first-of-type': {
      borderTop: 0,
    },
    '&:last-of-type': {
      borderBottomLeftRadius: '8px',
      borderBottomRightRadius: '8px',
      borderBottom: `2px solid ${SilverSand}`,
    },
  },
  leftColumn: {
    display: 'flex',
    flexBasis: '50%',
    justifyContent: 'space-between',
    [theme.breakpoints.down('sm')]: {
      flexDirection: 'column',
      flexBasis: 'unset',
    },
  },
  rightColumn: {
    display: 'flex',
    flexBasis: '50%',
    justifyContent: 'space-between',
    padding: '0 20px',
    [theme.breakpoints.down('sm')]: {
      padding: 0,
      justifyContent: 'flex-end',
      flexBasis: 'unset',
    },
  },
  textFragment: textFragment(theme),
  textFragmentHeader: {
    ...textFragment(theme),
    '&:first-of-type': {
      [theme.breakpoints.down('sm')]: {
        height: 'initial',
      },
    },
  },
  textFragmentHidden: {
    fontFamily: proxima,
    display: 'flex',
    alignItems: 'center',
    fontSize: '22px',

    [theme.breakpoints.down('sm')]: {
      display: 'none',
    },
  },
  textFragmentSize: textFragmentSize(theme),
  textFragmentSizeHeader: {
    ...textFragmentSize(theme),
    paddingTop: '3px',
  },
  decisionDateButton: {
    fontFamily: proxima,
    [theme.breakpoints.down('sm')]: {
      width: '18px',
      minWidth: '32px',
      maxHeight: '22px',
    },
  },
  calendarIcon: {
    width: '18px',
    height: 'auto',
    marginRight: '12px',
    marginLeft: '8px',
    [theme.breakpoints.down('sm')]: {
      width: '15px',
    },
  },
  arrowDownIcon: {
    width: '18px',
    height: 'auto',
    [theme.breakpoints.down('sm')]: {
      display: 'none',
    },
  },
});

export default commonStyles;
