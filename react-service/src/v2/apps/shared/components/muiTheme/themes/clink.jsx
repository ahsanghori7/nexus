import { createTheme, alpha } from '@mui/material/styles';
import { tablePaginationClasses } from '@mui/material/TablePagination';
import { CONSTANTS } from 'clink-components';
import { tooltipClasses } from '@mui/material/Tooltip';


// TODO: Remove the importants and classes in this file by properly using the theme

const { proxima } = CONSTANTS.fonts;
const {
  white,
  eerieBlack,
  highlightGray,
  darkCharcoal,
  clinkPurple,
  clinkGreen,
  clinkGreenDark,
  clinkRed,
  clinkLightPurple,
  clinkBackgroundPurple,
  lightBlue,
  black,
  prim,
  ruby,
  razzmatazz,
  ghostWhite,
  lightPeriwinkle,
  grayDark,
  teal,
} = CONSTANTS.colors.general;

const { palette } = createTheme();

const borderColor = clinkLightPurple;
const focusColor = clinkPurple;

const letterSpacing = '0.02857em';
export const themeOptions = {
  palette: {
    type: 'light',
    primary: palette.augmentColor({
      color: {
        main: clinkGreen,
        contrastText: white,
      },
    }),
    black: {
      main: eerieBlack,
      contrastText: white,
    },
    blackOutlined: palette.augmentColor({
      color: {
        main: white,
        contrastText: eerieBlack,
      },
    }),
    white: palette.augmentColor({
      color: {
        main: white,
        contrastText: clinkGreen,
      },
    }),
    secondary: {
      main: clinkRed,
      contrastText: white,
    },
    secondaryBlack: {
      main: alpha(darkCharcoal, 0.6),
      contrastText: white,
    },
    background: {
      default: highlightGray,
    },
    text: palette.augmentColor({
      color: {
        main: eerieBlack,
        contrastText: clinkGreen,
      },
    }),
    error: {
      main: clinkRed,
      contrastText: white,
    },
    success: palette.augmentColor({
      color: {
        main: clinkGreen,
        contrastText: white,
      },
    }),
    info: {
      main: lightBlue,
      contrastText: white,
    },
    border: palette.augmentColor({
      color: {
        main: clinkPurple,
        contrastText: white,
      },
    }),
    panelBorder: palette.augmentColor({
      color: {
        main: clinkLightPurple,
        contrastText: white,
      },
    }),
    mainBg: palette.augmentColor({
      color: {
        main: clinkBackgroundPurple,
        contrastText: white,
      },
    }),
  },
  spacing: 8,
  typography: {
    // TODO: refactor this object globally
    // current
    htmlFontSize: 16,
    // pxToRem: f (),
    fontFamily: [proxima].join(','),
    fontSize: 14,
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,
    h1: {
      fontSize: '6rem',
      fontFamily: proxima,
    },
    h2: {
      fontSize: '3.75rem',
      fontFamily: proxima,
    },
    h3: {
      fontSize: '3rem',
      fontFamily: proxima,
    },
    h4: {
      fontSize: '2.125rem',
      fontFamily: proxima,
    },
    h5: {
      fontSize: '1.5rem',
      fontFamily: proxima,
    },
    h6: {
      fontSize: '1.25rem',
      fontFamily: proxima,
    },
    subtitle1: {
      fontSize: '1rem',
      fontFamily: proxima,
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontFamily: proxima,
    },
    body1: {
      fontSize: '1rem',
      fontFamily: proxima,
    },
    body2: {
      fontSize: '0.875rem',
      fontFamily: proxima,
    },
    button: {
      fontSize: '0.875rem',
      fontFamily: proxima,
    },
    caption: {
      fontSize: '0.75rem',
      fontFamily: proxima,
    },
    smallCaption: {
      fontSize: '0.65rem',
      fontFamily: proxima,
    },
    overline: {
      fontSize: '0.75rem',
      fontFamily: proxima,
    },
    // legacy
    small: {
      fontSize: '9px',
      fontFamily: proxima, // TODO: why is not taking the font family from above?,
      letterSpacing,
    },
    normal: {
      fontSize: '12pt',
      fontFamily: proxima, // TODO: why is not taking the font family from above?,
      letterSpacing,
    },
    title: {
      fontSize: '16px',
      fontFamily: proxima, // TODO: why is not taking the font family from above?,
      fontWeight: 500,
      letterSpacing,
    },
    title2: {
      fontSize: '18px',
      fontWeight: 500,
      fontFamily: proxima, // TODO: why is not taking the font family from above?,
      letterSpacing,
    },
    title3: {
      fontSize: '36px',
      fontWeight: 500,
      fontFamily: proxima, // TODO: why is not taking the font family from above?,
      letterSpacing,
    },
    loginTitle: {
      fontSize: '42px',
      fontWeight: 'bold',
      fontFamily: proxima,
      letterSpacing,
    },
    loginLabel: {
      fontSize: '18px',
      fontWeight: '600',
      color: black,
      margin: '12px 0',
      position: 'relative',
      '&:after': {
        content: '"*"',
        color: ruby,
        ml: '4px',
        fontSize: '20px',
      },
    },
    loginError: {
      fontSize: '24px',
      color: clinkRed,
      marginBottom: '4px',
    },
    forgotPassword: {
      fontWeight: 'bold',
      fontSize: '20px',
      marginBottom: '8px',
    },
    boldTitle: {
      fontSize: '24px',
      fontWeight: 600,
      lineHeight: '28px',
      fontFamily: proxima, // TODO: why is not taking the font family from above?,
      letterSpacing,
    },
    tradesLocations: {
      fontSize: '20px',
      fontWeight: 'bold',
      color: clinkRed,
    },
  },
  shape: {
    borderRadius: 4,
  },
  props: {
    MuiAppBar: {
      color: 'default',
    },
  },
  components: {
    MuiIconButton: {
      styleOverrides: {
        root: {
          fontSize: '16px',
        },
      },
      variants: [
        {
          props: { variant: 'loginClose' },
          style: {
            position: 'absolute',
            top: 0,
            right: 0,
            fontSize: '16px',
          },
        },
        {
          props: { variant: 'archiveDropdown' },
          style: {
            position: 'absolute',
            top: '2px',
            right: '4px',
            padding: 0,
            border: `1px solid ${clinkPurple}`,
            fontSize: '12px',
            backgroundColor: white,
            color: clinkPurple,
            borderRadius: '50%',
            '&:hover': {
              backgroundColor: clinkPurple,
              color: white,
            },
          },
        },
      ],
    },
    MuiMenu: {
      styleOverrides: {
        root: {
          '&.sc-menu': {
            zIndex: 1000,
            '& .MuiPaper-root': {
              overflow: 'visible',
            },
            '& .MuiMenu-list': {
              paddingTop: 0,
              paddingBottom: 0,
              position: 'relative',
              marginTop: '1px',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: '-8px',
                right: '60px',
                transform: 'translateX(-50%)',
                width: '0',
                height: '0',
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderBottom: '8px solid white',
              },
            },
          },
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          '&.sc-menu-item': {
            fontWeight: 'bold',
            '&.disabled': {
              backgroundColor: clinkLightPurple,
              opacity: '0.5',
            },
            '&.sc-edit': {
              backgroundColor: 'transparent',
            },
            '&:not(:first-of-type)': {
              borderTop: `1px solid ${clinkLightPurple}`,
            },
            '& .clink-button': {
              padding: 0,
              fontWeight: 'bold',
              '&:hover': {
                backgroundColor: 'transparent',
              },
            },
            '& .sc-tooltip': {
              width: '100%',
            },
          },
          '&.sc-menu-item-red': {
            fontWeight: 'bold',
            color: clinkRed,
            borderTop: `1px solid ${clinkLightPurple}`,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          boxShadow: '0px 1px 3px rgba(0,0,0,0.2)',
          border: `1px solid ${clinkLightPurple}`,
        },
      },
    },

    MuiCardMedia: {
      styleOverrides: {
        root: {
          objectFit: 'cover',
        },
      },
    },
    MuiCardActions: {
      styleOverrides: {
        root: {
          top: '4px',
          right: '4px',
          zIndex: 1,
        },
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        root: {
          padding: 0,
        },
      },
    },
    MuiSnackbar: {
      styleOverrides: {
        root: {
          '& .MuiSnackbarContent-root': {
            backgroundColor: white,
            color: black,
            minWidth: '450px',
            maxWidth: '90vw',
            minHeight: '120px',
            borderRadius: 0,
            '& .MuiSnackbarContent-message': {
              width: '100%',
            },
          },
        },
      },
    },
    MuiTypography: {
      defaultProps: {
        variantMapping: {
          small: 'span',
          title: 'h6',
        },
      },
    },
    MuiSelect: {
      defaultProps: {
        size: 'small',
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-notchedOutline': {
            borderRadius: '4px',
            border: `1px solid ${clinkLightPurple}`,
            '&:focus': {
              borderRadius: '4px',
              borderColor: clinkPurple,
            },
          },
        },
        icon: {
          color: clinkPurple,
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: ({ ownerState }) => {
          const top = ownerState?.focused ? 0 : '-8px';
          return { top };
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        root: {
          border: 'none !important', // TODO: Investigate how to avoid using important
        },
        tag: {
          backgroundColor: white,
          color: clinkPurple,
          border: `1px solid ${clinkLightPurple}`,
          fontWeight: 700,
        },
        inputRoot: {
          height: 'auto !important',
          border: `1px solid ${clinkLightPurple}`,
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
    MuiTableRow: {
      styleOverrides: {
        root: {
          backgroundColor: highlightGray,
          borderRight: `1px solid ${clinkLightPurple}`,
          borderLeft: `1px solid ${clinkLightPurple}`,
          '&:nth-of-type(even)': {
            backgroundColor: ghostWhite,
          },
          '&:last-child td': {
            border: 0,
          },
          '&:first-of-type': {
            borderTop: `1px solid ${clinkLightPurple}`,
          },
          '&:last-child': {
            borderBottom: `1px solid ${clinkLightPurple}`,
            '& th': {
              borderTop: `1px solid ${clinkLightPurple}`,
            },
          },
          '&.MuiTableRow-head, &.MuiTableRow-footer': {
            // different row color for TableHead/Footer component
            backgroundColor: white,
            border: 0,
            '& th': {
              border: 'none',
            },
          },
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          '& .MuiDataGrid-columnHeaders': {
            '& .MuiDataGrid-columnHeader': {
              '&[data-field="__detail_panel_toggle__"]': {
                display: 'none',
                '--width': '0px !important',
              },
            },
            backgroundColor: 'background.paper',
            position: 'sticky',
            top: 0,
            zIndex: 1,
          },
          '& .MuiDataGrid-row': {
            '&:hover': {
              backgroundColor: clinkBackgroundPurple,
            },
            '& .MuiDataGrid-cell': {
              '&[data-field="__detail_panel_toggle__"]': {
                display: 'none',
                '--width': '0px !important',
              },
              '&:last-child': {},
            },
            '&.boq--section': {
              backgroundColor: prim,
              fontWeight: 700,
              '& .MuiDataGrid-cell--editable': {
                pointerEvents: 'none',
              },
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
              '&.hide-row': {
                display: 'none',
              },
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
          '& .MuiDataGrid-cell': {
            py: 1,
            display: 'flex',
            alignItems: 'center',
            textOverflow: 'ellipsis',
            whiteSpace: 'pre', // don't collapse double spaces
            '&.show': {
              opacity: '1',
            },
            '&.hide': {
              opacity: '0',
              pointerEvents: 'none',
            },
            '& input[type=number]': {
              MozAppearance: 'textfield',
            },
            '& input[type=number]::-webkit-outer-spin-button': {
              WebkitAppearance: 'none',
              margin: 0,
            },
            '& input[type=number]::-webkit-inner-spin-button': {
              WebkitAppearance: 'none',
              margin: 0,
            },
            '&.MuiDataGrid-cell--editing': {
              cursor: 'text !important',
              '& .MuiInputBase-input': {
                cursor: 'text !important',
              },
            },
            "&[data-field='budget']:hover, &[data-field='actual']:hover": {
              cursor: 'text',
            },
          },
          '& .MuiDataGrid-cell:focus-within, & .MuiDataGrid-colCell:focus-within,  & .MuiDataGrid-columnHeader:focus-within':
          {
            outline: 0,
          },
          '& .MuiDataGrid-columnsContainer': {
            borderBottomColor: borderColor,
          },
          '& .MuiDataGrid-columnSeparator--resizable': {
            color: borderColor,
          },
          '& .MuiDataGrid-row.focusedNotSelected': {
            backgroundColor: focusColor,
          },
          '& .MuiDataGrid-filler': {
            display: 'none',
          },
          '& .MuiDataGrid-container--top [role=row]': {
            backgroundColor: white,
          },
          '& .MuiDataGrid-columnHeaderTitle, & .MuiDataGrid-columnHeaderTitleContainerContent':
          {
            pointerEvents: 'none',
            opacity: '0.7',
            fontWeight: 700,
            '&> span': {
              pointerEvents: 'fill',
              display: 'inline-flex',
              transform: 'translate(0px, 3px)',
            },
          },
          '& .MuiDataGrid-rowCount': {
            display: 'none',
          },
          '& .MuiDataGrid-rowReorderCellPlaceholder': {
            display: 'none',
          },
          '& ::-webkit-scrollbar': {
            width: '0px',
            height: '5px',
          },
          '& ::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '& ::-webkit-scrollbar-thumb': {
            background: clinkPurple,
            borderRadius: '2px',
          },
          '& ::-webkit-scrollbar-thumb:hover': {
            background: clinkLightPurple,
          },
          borderColor,
          borderRadius: 0,
          borderWidth: '1px 0 0',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        backdrop: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        },
      },
    },
    MuiTablePagination: {
      styleOverrides: {
        root: {
          [`& .${tablePaginationClasses.selectLabel}`]: {
            marginBottom: 0,
          },
          [`& .${tablePaginationClasses.displayedRows}`]: {
            marginBottom: 0,
          },
        },
        select: {
          paddingTop: '4px',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          position: 'relative',
          alignItems: 'center',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: 48,
          color: black,
          backgroundColor: white,
          textTransform: 'none',
          '&:hover': {
            color: clinkPurple,
            backgroundColor: white,
          },
          '& .items-count': {
            padding: '2px 10px',
            borderRadius: '9999px',
            fontWeight: 600,
            fontSize: '12px',
            marginLeft: '8px',
            backgroundColor: clinkLightPurple,
          },
        },
      },
    },
    MuiTabScrollButton: {
      styleOverrides: {
        root: {
          opacity: 1,
          borderRadius: '28px',
          width: '26px',
          height: '26px',
          border: `1px solid ${clinkPurple}`,
          '&.Mui-disabled': {
            opacity: 0.5,
          },
          svg: {
            height: '22px',
            width: '22px',
          },
          marginLeft: '53px',
          '&:first-of-type': {
            backgroundColor: white,
            position: 'absolute',
            right: '30px',
            zIndex: 1,
            marginLeft: 0,
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: ({ ownerState, theme: localTheme }) => {
          const { color, href, to } = ownerState;
          let height = '40px';
          let fontSize = '16px';
          if (ownerState?.size === 'small') {
            height = '32px';
            fontSize = '13px';
          }
          if (ownerState?.size === 'large') {
            height = '48px';
            fontSize = '18px';
          }
          const contrastText = localTheme?.palette[color]?.contrastText;
          const hover = contrastText
            ? {
              '&:hover': {
                color: contrastText,
              },
            }
            : {};

          const baseStyles = {
            borderRadius: '24px',
            fontWeight: 'bold',
            textTransform: 'none',
            padding: '6px 16px',
            height,
            fontSize,
            ...(href || to ? hover : {}),
          };

          return baseStyles;
        },
      },
      variants: [
        {
          props: { variant: 'sc-cancel' },
          style: {
            fontWeight: 'bold',
            backgroundColor: clinkRed,
            color: white,
            '&:hover': {
              backgroundColor: razzmatazz,
            },
          },
        },
        {
          props: { variant: 'sc-confirm' },
          style: {
            fontWeight: 'bold',
            backgroundColor: clinkGreen,
            color: white,
            '&:hover': {
              backgroundColor: clinkGreenDark,
            },
          },
        },
        {
          props: { variant: 'sc-trades-locations' },
          style: {
            color: black,
          },
        },
        {
          props: { variant: 'nav-menu' },
          style: {
            color: black,
            backgroundColor: white,
            borderRadius: 0,
            height: '80px',
            fontSize: '16px',
            width: '100%',
            whiteSpace: 'nowrap',
            minWidth: { md: '220px' },
            '&:hover': {
              backgroundColor: grayDark,
              color: black,
              borderBottom: `2px solid ${teal}`,
              '& img': {
                filter: 'none',
              },
            },
          },
        },
      ],
    },
    MuiDialogActions: {
      variants: [
        {
          props: { variant: 'sc-actions' },
          style: {
            padding: '20px',
          },
        },
      ],
    },
    MuiFormControl: {
      styleOverrides: {
        root: {
          width: '100%',
          margin: 0,
        },
      },
    },
    MuiStepLabel: {
      styleOverrides: {
        root: {
          '& > span.Mui-active': {
            '& > svg': {
              fill: clinkPurple,
            },
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: ({ ownerState }) => {
          const height = ownerState?.multiline ? 'auto' : '40px';
          const marginTop = ownerState?.multiline ? '16px' : 0;
          const padding = ownerState?.select ? '9px 16px' : '0px 16px';
          const border = ownerState?.error
            ? `1px solid ${clinkRed}`
            : `1px solid ${clinkLightPurple}`;
          const calendarAdornment =
            ownerState?.yearsPerRow && ownerState?.InputProps
              ? {
                '& .MuiInputAdornment-root': {
                  width: '40px',
                },
              }
              : {};
          const styles = {
            height,
            '& .MuiInputBase-root': {
              height,
              padding: 0,
              backgroundColor: white,
              borderRadius: '5px',
              '& .MuiInputBase-input': {
                marginTop,
                padding,
                height: '40px',
                boxSizing: 'border-box',
                '&.Mui-disabled': {
                  color: clinkRed,
                },
              },
              '& .MuiOutlinedInput-notchedOutline': {
                border,
                borderRadius: '5px',
                '&:hover, &:focus-visible': {
                  outline: 'none',
                },
              },
            },
            '& .MuiFormLabel-root': {
              '&[data-shrink="false"]': {
                top: '-8px',
              },
            },
            ...calendarAdornment,
          };
          return styles;
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        popper: {
          [`& .${tooltipClasses.arrow}`]: { color: black },
          [`& .${tooltipClasses.tooltip}`]: {
            backgroundColor: black,
            color: white,
            fontSize: '13px',
            padding: '12px',
            borderRadius: '8px',
            maxWidth: 350,
          },
        },
      },
    },
  },
};

export default themeOptions;
