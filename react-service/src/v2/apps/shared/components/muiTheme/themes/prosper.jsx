import { CONSTANTS } from 'clink-components';
import MuiDataGrid from './DataGrid';

const { avantGardeGothicPRO } = CONSTANTS.fonts;
const {
  prim,
  white,
  japaneseIndigo,
  blueMagentaViolet,
  black,
  aliceBlue,
  darkJungleGreen,
  clinkRed,
  clinkLightPurple,
} = CONSTANTS.colors.general;
const { prosperBoxRed, prosperBoxGreen, dimGray2, fog } = CONSTANTS.colors.prosper;

const listTextStyles = {
  fontSize: '10px',
  color: dimGray2,
  fontFamily: avantGardeGothicPRO, // TODO: why is not taking the font family from above?
  fontWeight: 200,
};

export const themeOptions = {
  palette: {
    type: 'light',
    primary: {
      main: japaneseIndigo,
      dark: darkJungleGreen,
    },
    secondary: {
      main: prosperBoxRed,
    },
    white: {
      main: white,
    },
    background: {
      default: aliceBlue,
    },
    text: {
      primary: japaneseIndigo,
    },
    error: {
      main: clinkRed,
      contrastText: white,
    },
    success: {
      main: prosperBoxGreen,
      contrastText: white,
    },
    purple: {
      main: blueMagentaViolet,
      contrastText: white,
    },
  },
  spacing: 8,
  typography: {
    fontFamily: [avantGardeGothicPRO].join(','),
    small: {
      fontSize: '9px',
    },
    normal: {
      fontSize: '12pt',
      fontFamily: avantGardeGothicPRO, // TODO: why is not taking the font family from above?
    },
    title: {
      fontSize: '16px',
      fontWeight: 500,
    },
    title2: {
      fontSize: '18px',
      fontWeight: 500,
      fontFamily: avantGardeGothicPRO, // TODO: why is not taking the font family from above?
    },
    title3: {
      fontSize: '36px',
      fontWeight: 500,
      fontFamily: avantGardeGothicPRO, // TODO: why is not taking the font family from above?
    },
    boldTitle: {
      fontSize: '24px',
      fontWeight: 600,
      lineHeight: '28px',
      fontFamily: avantGardeGothicPRO, // TODO: why is not taking the font family from above?
    },
    button: {
      textTransform: 'none',
    },
  },
  components: {
    MuiListItem: {
      styleOverrides: {
        root: {
          height: '48px',
        },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        primary: {
          ...listTextStyles,
          fontSize: '14px',
          color: japaneseIndigo,
        },
        secondary: listTextStyles,
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
          // TODO: Remove this and do it properly
          if (ownerState.design === 'red') {
            buttonTheme = {
              ...common,
              backgroundColor: prosperBoxRed,
              color: white,
              fontSize: '16pt',
              textDecoration: 'none',
              '&:hover': {
                color: fog,
                border: `1px solid ${prosperBoxRed}`,
              },
              '&.Mui-disabled': {
                backgroundColor: dimGray2,
                color: white,
              },
            };
          }
          if (ownerState.design === 'green') {
            buttonTheme = {
              ...common,
              backgroundColor: prosperBoxGreen,
              color: white,
              fontSize: '16pt',
              textDecoration: 'none',
              '&:hover': {
                color: prosperBoxGreen,
                border: `1px solid ${prosperBoxGreen}`,
              },
              '&.Mui-disabled': {
                backgroundColor: dimGray2,
                color: white,
              },
            };
          }
          if (ownerState.design === 'reverse') {
            buttonTheme = {
              ...common,
              backgroundColor: white,
              color: blueMagentaViolet,
              border: `1px solid ${blueMagentaViolet}`,
              textDecoration: 'none',
              fontSize: '16pt',
              '&:hover': {
                backgroundColor: blueMagentaViolet,
                color: white,
              },
              '&.Mui-disabled': {
                backgroundColor: dimGray2,
                color: white,
              },
            };
          }
          if (ownerState.design === 'link') {
            buttonTheme = {
              ...common,
              backgroundColor: white,
              color: prosperBoxRed,
              textDecoration: 'underline',
              fontSize: '14pt',
            };
          }
          if (ownerState.design === 'black') {
            buttonTheme = {
              ...common,
              backgroundColor: black,
              color: white,
              '&:hover': {
                backgroundColor: white,
                color: black,
                border: `1px solid ${black}`,
              },
              '&.Mui-disabled': {
                backgroundColor: dimGray2,
                color: white,
              },
            };
          }
          return {
            ...buttonTheme,
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
    MuiLink: {
      styleOverrides: {
        root: {
          color: prosperBoxRed,
          textDecorationColor: prosperBoxRed,
        },
      },
    },
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
            // TODO: console error appears if not declared like this, why?
            ...(ownerState.dialogselect === 'true' && {
              justifyContent: 'space-between',
              flexDirection: 'row-reverse',
              fontWeight: 200,
              margin: 0,
            }),
          };
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '.MuiInputBase-input': {
            height: 13, // default padding will make it 48px height
            width: '100%',
            marginRight: 0,
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        backdrop: {
          backgroundColor: 'rgb(89, 53, 140, 0.8)',
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          ...MuiDataGrid.styleOverrides.root,
          '& .MuiDataGrid-overlayWrapper': {
            height: '30px',
            paddingTop: '3px',
          },
          '& .MuiDataGrid-row': {
            ...MuiDataGrid.styleOverrides.root['& .MuiDataGrid-row'],
            backgroundColor: white,
            '&:nth-of-type(even)': {
              backgroundColor: white,
            },
            '&:hover': {
              backgroundColor: white,
            },
            '& .MuiDataGrid-cell': {
              '& b': {
                fontWeight: 'bold !important',
              },
              borderLeft: `1px solid ${clinkLightPurple}`,
              borderBottom: `1px solid ${clinkLightPurple}`,
              '&:last-child': {
                borderRight: `1px solid ${clinkLightPurple}`,
              },
            },
            '&.boq--section': {
              backgroundColor: prim,
              pointerEvents: 'none',
            },
            '&.boq--item': {
              backgroundColor: white,
              '&.hide-row': {
                display: 'none',
              },
            },
            '&.boq--grouped_heading': {
              fontWeight: 700,
              textDecoration: 'underline',
              '& .MuiDataGrid-cell': {
                '&.hide': {
                  opacity: 1,
                  pointerEvents: 'none',
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: white,
                    zIndex: 1,
                  },
                },
              },
            },
          },
          '& .MuiDataGrid-rowCount': {
            display: 'none',
          },
          '& .MuiDataGrid-container--top [role=row]': {
            backgroundColor: white,
            borderLeft: `1px solid ${clinkLightPurple}`,
            borderRight: `1px solid ${clinkLightPurple}`,
          },
        },
      },
    },
  },
};

export default themeOptions;
