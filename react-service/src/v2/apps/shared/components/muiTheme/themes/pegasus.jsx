import { CONSTANTS } from 'clink-components';

const { ptSans } = CONSTANTS.fonts;
const {
  clinkGreen,
  clinkRed,
  aliceBlue,
  casal,
  elephant,
  clinkOrange,
  white,
  ghostWhite,
  lightPeriwinkle,
} = CONSTANTS.colors.general;

export const themeOptions = {
  palette: {
    type: 'light',
    primary: {
      main: casal,
      dark: elephant,
    },
    secondary: {
      main: clinkOrange,
    },
    background: {
      default: aliceBlue,
    },
    text: {
      primary: elephant,
    },
    error: {
      main: clinkRed,
    },
    success: {
      main: clinkGreen,
    },
  },
  spacing: 8,
  typography: {
    fontFamily: [ptSans].join(','),
    small: {
      fontSize: '9px',
    },
    normal: {
      fontSize: '12pt',
      fontFamily: ptSans, // TODO: why is not taking the font family from above?
    },
    title: {
      fontSize: '16px',
      fontWeight: 500,
    },
    title2: {
      fontSize: '18px',
      fontWeight: 500,
      fontFamily: ptSans, // TODO: why is not taking the font family from above?
    },
    title3: {
      fontSize: '28px',
      fontWeight: 500,
      fontFamily: ptSans, // TODO: why is not taking the font family from above?
    },
    boldTitle: {
      fontSize: '20px',
      fontWeight: 600,
      lineHeight: '28px',
      fontFamily: ptSans, // TODO: why is not taking the font family from above?
    },
    button: {
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 4,
  },
  components: {
    MuiAutocomplete: {
      styleOverrides: {
        root: {
          border: 'none !important', // TODO: Investigate how to avoid using important
        },
        tag: {
          backgroundColor: clinkOrange,
          color: white,
          fontWeight: 700,
        },
        inputRoot: {
          height: 'auto !important',
          borderRadius: '5px !important',
        },
        input: {
          border: 'none !important',
        },
        option: {
          padding: '12px',
          minHeight: '40px',
          backgroundColor: ghostWhite,
          borderBottom: `1px solid ${lightPeriwinkle}`,
          '&:nth-of-type(odd)': {
            backgroundColor: white,
          },
        },
      },
    },
  },
};

export default themeOptions;
