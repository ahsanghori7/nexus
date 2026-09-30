import { CONSTANTS } from 'clink-components';
import prosper from './prosper';

const { avantGardeGothicPRO } = CONSTANTS.fonts;
const { white } = CONSTANTS.colors.general;
const { prosperBoxRed } = CONSTANTS.colors.prosper;

export const themeOptions = {
  ...prosper,
  palette: {
    ...prosper.palette,
    type: 'light',
    secondary: {
      main: white,
    },
    error: {
      main: prosperBoxRed,
      contrastText: white,
    },
  },
  typography: {
    ...prosper.typography,
    fontFamily: [avantGardeGothicPRO].join(','),
    boldTitle: {
      fontSize: '18px',
      fontWeight: 600,
      lineHeight: '28px',
      fontFamily: avantGardeGothicPRO, // TODO: why is not taking the font family from above?
    },
  },

  components: {
    MuiSelect: {
      styleOverrides: {
        root: {
          height: 48,
        },
      },
    },
    MuiFormControlLabel: {
      styleOverrides: {
        root: ({ ownerState }) => {
          return {
            ...(ownerState.dialogSelect && {
              justifyContent: 'space-between',
              flexDirection: 'row-reverse',
              fontWeight: 200,
              margin: 0,
            }),
          };
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          '& .MuiSvgIcon-root': {
            fontSize: 30,
          },
          '& .MuiTypography-root': {
            color: 'red',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: ({ ownerState }) => {
          let buttonTheme = {};
          const common = {
            textTransform: 'initial',
            width: 161,
            height: 51,
          };
          if (ownerState.red) {
            buttonTheme = {
              ...common,
              backgroundColor: prosperBoxRed,
              color: white,
              fontSize: '16pt',
              '&:hover': {
                color: prosperBoxRed,
              },
            };
          }
          if (ownerState.link) {
            buttonTheme = {
              ...common,
              backgroundColor: white,
              color: prosperBoxRed,
              textDecoration: 'underline',
              fontSize: '14pt',
            };
          }
          return {
            ...buttonTheme,
          };
        },
      },
    },
  },
};

export default themeOptions;
