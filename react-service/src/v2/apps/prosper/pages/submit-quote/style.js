import { CONSTANTS } from 'clink-components';

const { white } = CONSTANTS.colors.general;
const { prosperBoxRed, dimGray2 } = CONSTANTS.colors.prosper;

const redStyle = {
  border: `1px solid ${prosperBoxRed}`,
  color: prosperBoxRed,
  bgcolor: white,
};
const cancelStyle = {
  color: white,
  bgcolor: prosperBoxRed,
  border: `1px solid ${prosperBoxRed}`,
  '&:hover': redStyle,
};
const acceptStyle = {
  border: `1px solid ${prosperBoxRed}`,
  color: prosperBoxRed,
  bgcolor: white,
  '&:hover': {
    border: 0,
    color: white,
    bgcolor: prosperBoxRed,
  },
  '&.Mui-disabled': {
    color: white,
    bgcolor: dimGray2,
    border: 0,
  },
};

const modalSx = {
  width: '420px',
  backgroundColor: 'transparent',
  paddingBottom: '30px',
  boxShadow: 'none',
  '& .MuiPaper-root': {
    margin: '0 auto',
    boxShadow: 'none',
    borderBottom: `1px solid ${dimGray2}`,
    '& .MuiToolbar-root': {
      paddingLeft: '0',
    },
    '& .MuiButtonBase-root': {
      display: 'none',
    },
    '& .MuiTypography-root ': {
      textAlign: 'center',
      color: prosperBoxRed,
      fontSize: '24px',
      fontWeight: 'bold',
      padding: '10px 0 4px',
    },
  },
  '&> .MuiBox-root': {
    position: 'relative',
    paddingTop: '8px',
    backgroundColor: white,
    borderBottomLeftRadius: '10px',
    borderBottomRightRadius: '10px',
    '&> .MuiTypography-root': {
      fontSize: '20px',
      textAlign: 'center',
    },
    textarea: {
      maxWidth: '338px',
      border: `1px solid ${dimGray2}`,
      borderRadius: '8px',
      maxHeight: '300px',
      overflowY: 'auto !important',
    },
    '& .MuiBox-root': {
      position: 'relative',
      marginTop: 0,
      '& .MuiButtonBase-root': {
        padding: '2px 0 4px',
        position: 'absolute',
        height: 'auto',
        right: '40px',
        top: '12px',
        '&:first-of-type': {
          marginRight: '30px',
          right: 'unset',
          left: '40px',
        },
      },
    },
  },
};

export { modalSx, acceptStyle, cancelStyle };
