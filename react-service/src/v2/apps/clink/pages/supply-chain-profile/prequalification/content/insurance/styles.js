import { CONSTANTS } from 'clink-components';

const { proxima } = CONSTANTS.fonts;
const { darkCharcoal, webOrange } = CONSTANTS.colors.general;

const commonSx = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '3px',
  minWidth: { xs: 0, lg: '150px' },
  height: '32px',
  '& span': {
    display: 'inline-flex !important',
    marginRight: { xs: '4px', lg: '20px' },
    '& img': {
      filter: { xs: 'invert(100%)', lg: 'invert(0)' },
    },
  },
};
const insurancesSx = {
  ...commonSx,
  position: 'absolute',
  top: 0,
  width: '100%',
  height: '100%',
  background: webOrange,
  fontSize: '14px',
  fontWeight: '600',
  fontFamily: proxima,
  color: darkCharcoal,
  cursor: 'pointer',
  '& span': {
    marginRight: 0,
  },
};

export { commonSx, insurancesSx };
