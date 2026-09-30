import { createTheme } from '@mui/material/styles';
import { CONSTANTS } from 'clink-components';

const { proxima_nova1, proxima_nova2 } = CONSTANTS.fonts;

export const accordionTheme = createTheme({
  components: {
    MuiAccordion: {
      styleOverrides: {
        root: {
          marginBottom: 16,
          boxShadow: 'none',
          border: '1px solid #E5E7EB',
          borderRadius: '8px !important',
          '&:before': {
            display: 'none',
          },
          '&.Mui-expanded': {
            margin: '0 0 16px 0',
          },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          paddingLeft: 24,
          paddingRight: 24,
          paddingTop: 16,
          paddingBottom: 16,
          minHeight: '64px',
          fontFamily: `${proxima_nova1}, ${proxima_nova2}`,
          '& .MuiAccordionSummary-expandIconWrapper': {
            transform: 'rotate(0deg)',
            transition: 'transform 0.3s',
          },
          '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
            transform: 'rotate(180deg)',
          },
          '& .MuiAccordionSummary-content': {
            marginTop: 0,
            marginBottom: 0,
          },
        },
      },
    },
    MuiAccordionDetails: {
      styleOverrides: {
        root: {
          padding: 0,
        },
      },
    },
  },
});
